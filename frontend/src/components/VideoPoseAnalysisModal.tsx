import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Send,
  Upload,
  CheckCircle2,
  Activity,
  Gauge
} from 'lucide-react';
import {
  calculateJointAngle,
  drawSkeletonOnCanvas,
  EXERCISE_POSE_PROFILES,
  Keypoint2D,
  RepetitionRecord,
  RepPhase
} from '../utils/videoPoseEstimator';
import { sendVideoTelemetry, TelemetryAnalysisResponse, VideoTelemetryPayload } from '../utils/api';

interface VideoPoseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExerciseId?: string;
  defaultExerciseName?: string;
}

export const VideoPoseAnalysisModal: React.FC<VideoPoseAnalysisModalProps> = ({
  isOpen,
  onClose,
  defaultExerciseId = 'squat',
  defaultExerciseName = 'Sentadilla Libre'
}) => {
  const [selectedExerciseKey, setSelectedExerciseKey] = useState<string>(defaultExerciseId);
  const [isRecording, setIsRecording] = useState(false);
  const [currentKneeAngle, setCurrentKneeAngle] = useState<number>(165);
  const [currentHipAngle, setCurrentHipAngle] = useState<number>(110);
  const [repCount, setRepCount] = useState<number>(0);
  const [repPhase, setRepPhase] = useState<RepPhase>('STANDING');
  const [repsHistory, setRepsHistory] = useState<RepetitionRecord[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [backendDiagnosis, setBackendDiagnosis] = useState<TelemetryAnalysisResponse | null>(null);
  const [isSendingToBackend, setIsSendingToBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseTimerRef = useRef<{ eccentricStart: number; bottomStart: number }>({
    eccentricStart: 0,
    bottomStart: 0
  });

  const profile = EXERCISE_POSE_PROFILES[selectedExerciseKey] || EXERCISE_POSE_PROFILES.squat;

  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
      setBackendDiagnosis(null);
      setRepsHistory([]);
      setRepCount(0);
    }
  }, [isOpen]);

  // Simulated pose simulation tracking loop for demonstration
  useEffect(() => {
    if (!isRecording) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let t = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let minAngleInCycle = 180;
    let minHipInCycle = 180;
    let currentPhase: RepPhase = 'STANDING';

    const loop = () => {
      t += 0.045; // cycle progress
      // Oscillate knee angle between 165° (standing) and 82° (deep squat)
      const normalizedSin = (Math.sin(t) + 1) / 2; // 0 to 1
      const knee = Math.round((82 + normalizedSin * (165 - 82)) * 10) / 10;
      const hip = Math.round((55 + normalizedSin * (115 - 55)) * 10) / 10;

      setCurrentKneeAngle(knee);
      setCurrentHipAngle(hip);

      // Track keypoints
      const keypoints: Record<string, Keypoint2D> = {
        shoulder: { x: 0.5, y: 0.28 },
        elbow: { x: 0.44, y: 0.42 },
        wrist: { x: 0.48, y: 0.56 },
        hip: { x: 0.5, y: 0.52 + (1 - normalizedSin) * 0.12 },
        knee: { x: 0.46, y: 0.72 + (1 - normalizedSin) * 0.05 },
        ankle: { x: 0.46, y: 0.90 }
      };

      // FSM Repetition Counting & Biomechanical Rules
      if (currentPhase === 'STANDING' && knee < profile.standingThreshold - 5) {
        currentPhase = 'DESCENDING';
        setRepPhase('DESCENDING');
        phaseTimerRef.current.eccentricStart = Date.now();
        minAngleInCycle = knee;
        minHipInCycle = hip;
      } else if (currentPhase === 'DESCENDING') {
        if (knee < minAngleInCycle) minAngleInCycle = knee;
        if (hip < minHipInCycle) minHipInCycle = hip;

        if (knee <= profile.inflectionThreshold + 5) {
          currentPhase = 'BOTTOM';
          setRepPhase('BOTTOM');
          phaseTimerRef.current.bottomStart = Date.now();
        }
      } else if (currentPhase === 'BOTTOM' && knee > minAngleInCycle + 8) {
        currentPhase = 'ASCENDING';
        setRepPhase('ASCENDING');
      } else if (currentPhase === 'ASCENDING' && knee >= profile.standingThreshold - 5) {
        // Complete repetition
        currentPhase = 'STANDING';
        setRepPhase('STANDING');

        const isDepthValid = minAngleInCycle <= profile.inflectionThreshold;
        const alerts: Array<{
          ruleId: string;
          joint: string;
          measuredValue: number;
          expectedThreshold: number;
          message: string;
        }> = [];

        if (!isDepthValid) {
          alerts.push({
            ruleId: 'depth_check',
            joint: 'knee',
            measuredValue: minAngleInCycle,
            expectedThreshold: profile.inflectionThreshold,
            message: `Profundidad insuficiente: alcanzaste ${minAngleInCycle}°, se requiere ≤ ${profile.inflectionThreshold}°.`
          });
        }

        const newRecord: RepetitionRecord = {
          repIndex: repsHistory.length + 1,
          isValid: isDepthValid,
          eccentricTimeSeconds: 2.1,
          concentricTimeSeconds: 1.4,
          minKneeAngle: minAngleInCycle,
          minHipAngle: minHipInCycle,
          feedbackAlerts: alerts
        };

        setRepsHistory(prev => [...prev, newRecord]);
        setRepCount(c => c + 1);

        if (alerts.length > 0) {
          setActiveAlerts(alerts.map(a => a.message));
        } else {
          setActiveAlerts(['★ Repetición con ROM completo y aceleración controlada.']);
        }

        minAngleInCycle = 180;
      }

      // Render skeleton with adaptive color
      const feedbackColor = knee <= profile.inflectionThreshold ? '#10B981' : '#F59E0B';
      drawSkeletonOnCanvas(ctx, keypoints, canvas.width, canvas.height, feedbackColor);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, selectedExerciseKey, profile]);

  const handleStartStop = () => {
    setIsRecording(prev => !prev);
  };

  const handleReset = () => {
    setIsRecording(false);
    setRepCount(0);
    setRepsHistory([]);
    setActiveAlerts([]);
    setBackendDiagnosis(null);
    setCurrentKneeAngle(165);
    setRepPhase('STANDING');
  };

  const handleSendToBackend = async () => {
    if (repsHistory.length === 0) return;
    setIsSendingToBackend(true);
    setBackendError(null);

    const validCount = repsHistory.filter(r => r.isValid).length;
    const payload: VideoTelemetryPayload = {
      userId: 'pablo_coach',
      exerciseId: selectedExerciseKey,
      exerciseName: profile.name,
      videoDurationSeconds: repsHistory.length * 3.5,
      hardwareModel: 'Client Edge Engine (Trigonometry Web/Mobile)',
      metrics: {
        totalRepsCounted: repsHistory.length,
        validRepsCount: validCount,
        failedRepsCount: repsHistory.length - validCount,
        averageRepCadenceSeconds: 3.5,
        romConsistencyScore: Math.round((validCount / repsHistory.length) * 100)
      },
      repsDetail: repsHistory.map(r => ({
        repIndex: r.repIndex,
        isValid: r.isValid,
        eccentricTimeSeconds: r.eccentricTimeSeconds,
        concentricTimeSeconds: r.concentricTimeSeconds,
        minKneeAngle: r.minKneeAngle,
        minHipAngle: r.minHipAngle,
        feedbackAlerts: r.feedbackAlerts
      }))
    };

    try {
      const response = await sendVideoTelemetry(payload);
      setBackendDiagnosis(response);
    } catch (err: any) {
      setBackendError(err?.message || 'Error de conexión con el backend Spring Boot.');
    } finally {
      setIsSendingToBackend(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0f111a] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Análisis Biomecánico por Vídeo</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Edge AI Pose
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tracking articular en tiempo real mediante trigonometría vectorial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise selector */}
        <div className="flex gap-2">
          {Object.entries(EXERCISE_POSE_PROFILES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedExerciseKey(key);
                handleReset();
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                selectedExerciseKey === key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-400'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Video Canvas Viewport */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {/* Simulated athlete background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/80 flex items-center justify-center">
            {!isRecording && (
              <div className="text-center space-y-2 p-4">
                <Video className="w-10 h-10 text-cyan-400/60 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400 max-w-xs">
                  Pulsa Iniciar para activar el tracking trigonométrico de articulaciones (Cadera, Rodilla y Tobillo).
                </p>
              </div>
            )}
          </div>

          {/* Skeleton Overlay */}
          <canvas
            ref={canvasRef}
            width={400}
            height={320}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Telemetry HUD overlays */}
          {isRecording && (
            <>
              {/* Top Angle Gauge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-slate-400">Ángulo de Rodilla</div>
                  <div className={`font-mono text-sm font-bold ${
                    currentKneeAngle <= profile.inflectionThreshold ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {currentKneeAngle}° {currentKneeAngle <= profile.inflectionThreshold ? '(Profundo)' : '(Descenso)'}
                  </div>
                </div>
              </div>

              {/* Rep Count HUD */}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-blue-500/40 rounded-xl px-3 py-1.5 text-right">
                <div className="text-[10px] text-slate-400">Repeticiones</div>
                <div className="font-mono text-lg font-black text-white">{repCount}</div>
              </div>

              {/* Rep Phase Pill */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1 text-xs font-semibold text-slate-300">
                Fase: <span className="text-cyan-400 uppercase font-mono">{repPhase}</span>
              </div>
            </>
          )}
        </div>

        {/* Live Feedback Alerts */}
        {activeAlerts.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              {activeAlerts.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={handleStartStop}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isRecording
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRecording ? 'Pausar Grabación' : 'Iniciar Tracking en Vivo'}
          </button>

          <button
            onClick={handleReset}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>

          <button
            disabled={repsHistory.length === 0 || isSendingToBackend}
            onClick={handleSendToBackend}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {isSendingToBackend ? 'Enviando...' : 'Enviar a Backend Spring Boot'}
          </button>
        </div>

        {/* Backend Diagnosis Panel */}
        {backendDiagnosis && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Diagnóstico del Servidor (Spring Boot 3.3)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  backendDiagnosis.status === 'EXCELLENT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {backendDiagnosis.status} • {backendDiagnosis.efficiencyPercentage}% Eficiencia
              </span>
            </div>
            <p className="text-xs text-slate-300">{backendDiagnosis.biomechanicalPrescription}</p>
            {backendDiagnosis.keyActionPoints.length > 0 && (
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                {backendDiagnosis.keyActionPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {backendError && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {backendError}
          </div>
        )}
      </div>
    </div>
  );
};
