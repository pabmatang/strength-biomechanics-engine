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
  Gauge,
  Film,
  Camera,
  Layers,
  Cpu,
  RefreshCw,
  Rewind,
  FastForward,
  Scale,
  Crosshair,
  TrendingUp,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  calculateJointAngle,
  EXERCISE_POSE_PROFILES,
  getPoseLandmarker,
  extractPoseDataFromLandmarks,
  Keypoint2D,
  ExercisePoseProfile,
  drawDualModeOverlay
} from '../utils/videoPoseEstimator';
import { PoseLandmarkSmoother } from '../utils/oneEuroFilter';
import { BiomechanicalFSM, CompletedRepetition, FsmPhase } from '../utils/biomechanicalFSM';
import {
  evaluateBiomechanicalFrame,
  auditCompletedRepetition,
  BiomechanicalTelemetryFrame,
  RepetitionBiomechanicalAudit,
  ResistanceSourceType
} from '../utils/biomechanicsEngine';
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
  defaultExerciseId = 'lat_pulldown',
  defaultExerciseName = 'Espalda (Jalón / Remo)'
}) => {
  // Normalize default exercise key
  const getInitialExerciseKey = (): string => {
    const id = (defaultExerciseId || '').toLowerCase();
    if (id.includes('lat') || id.includes('pull') || id.includes('row') || id.includes('espalda') || id.includes('dorsal')) {
      return 'lat_pulldown';
    }
    if (id.includes('bicep') || id.includes('curl')) return 'biceps_curl';
    if (id.includes('tricep') || id.includes('extension') || id.includes('katana')) return 'triceps_extension';
    if (id.includes('deadlift') || id.includes('rdl') || id.includes('rumano') || id.includes('femoral') || id.includes('isquio')) {
      return 'rdl_deadlift';
    }
    if (id.includes('chest') || id.includes('press') || id.includes('pecho') || id.includes('bench')) return 'bench_press';
    if (id.includes('leg_press') || id.includes('prensa')) return 'leg_press';
    if (id.includes('squat') || id.includes('sentadilla')) return 'squat';
    return 'lat_pulldown';
  };

  const [selectedExerciseKey, setSelectedExerciseKey] = useState<string>(getInitialExerciseKey());
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState(false);

  // Dual Analysis Modes
  const [analysisMode, setAnalysisMode] = useState<'technique' | 'biomechanics'>('technique');

  // Mode 2 Biomechanical Context
  const [targetMuscleBias, setTargetMuscleBias] = useState<'quads' | 'glutes' | 'hamstrings' | 'lats'>('quads');
  const [resistanceSource, setResistanceSource] = useState<ResistanceSourceType>('gravity');

  // AI MediaPipe Vision Model Status
  const [aiModelStatus, setAiModelStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [isRecording, setIsRecording] = useState(false);

  // Dynamic telemetry
  const [currentPrimaryAngle, setCurrentPrimaryAngle] = useState<number>(155);
  const [currentPhase, setCurrentPhase] = useState<FsmPhase>('LOCKOUT');
  const [repCount, setRepCount] = useState<number>(0);
  const [auditedReps, setAuditedReps] = useState<RepetitionBiomechanicalAudit[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [currentTelemetry, setCurrentTelemetry] = useState<BiomechanicalTelemetryFrame | null>(null);

  // Backend Diagnosis
  const [backendDiagnosis, setBackendDiagnosis] = useState<TelemetryAnalysisResponse | null>(null);
  const [isSendingToBackend, setIsSendingToBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Video playback controls state
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoCodecError, setVideoCodecError] = useState<string | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastTimestampRef = useRef<number>(0);
  const isScrubbingRef = useRef<boolean>(false);

  // Adaptive OneEuroFilter smoother for all landmarks (Anti-Jitter)
  const poseSmootherRef = useRef<PoseLandmarkSmoother>(new PoseLandmarkSmoother());

  // Finite State Machine (FSM) with velocity and hysteresis
  const profile: ExercisePoseProfile = EXERCISE_POSE_PROFILES[selectedExerciseKey] || EXERCISE_POSE_PROFILES.lat_pulldown;

  const fsmRef = useRef<BiomechanicalFSM>(
    new BiomechanicalFSM({
      trackingMode: profile.trackingMode,
      lockoutThreshold: profile.standingThreshold,
      inflectionThreshold: profile.inflectionThreshold,
      hysteresisAngleBand: 8,
      velocityThresholdDegPerSec: 15,
      minPhaseDurationMs: 120,
      bounceThresholdMs: 160
    })
  );

  // Initialize MediaPipe Tasks Vision on Modal Open
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setAiModelStatus('loading');
      getPoseLandmarker()
        .then(instance => {
          if (!isMounted) return;
          if (instance) {
            setAiModelStatus('ready');
          } else {
            setAiModelStatus('fallback');
          }
        })
        .catch(() => {
          if (isMounted) setAiModelStatus('fallback');
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Re-initialize FSM when exercise profile changes
  useEffect(() => {
    fsmRef.current = new BiomechanicalFSM({
      trackingMode: profile.trackingMode,
      lockoutThreshold: profile.standingThreshold,
      inflectionThreshold: profile.inflectionThreshold,
      hysteresisAngleBand: 8,
      velocityThresholdDegPerSec: 15,
      minPhaseDurationMs: 120,
      bounceThresholdMs: 160
    });
    poseSmootherRef.current.reset();
  }, [selectedExerciseKey, profile]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
      setBackendDiagnosis(null);
      setAuditedReps([]);
      setRepCount(0);
      stopWebcam();
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
        setUploadedVideoUrl(null);
        setUploadedFileName(null);
      }
    }
  }, [isOpen]);

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
    }
    setUseWebcam(false);
  };

  const handleStartWebcam = async () => {
    try {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
        setUploadedVideoUrl(null);
        setUploadedFileName(null);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: 'user' }
      });
      webcamStreamRef.current = stream;
      setUseWebcam(true);
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(() => {});
      }
      handleReset();
    } catch (err: any) {
      console.warn('Webcam permission denied or error:', err);
      alert('No se pudo acceder a la cámara web. Puedes subir un vídeo grabado en su lugar.');
    }
  };

  // Video File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopWebcam();
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(objectUrl);
    setUploadedFileName(file.name);
    setVideoCodecError(null);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setIsVideoPlaying(false);
    handleReset();
  };

  /**
   * Evaluates a single video frame with full pipeline:
   * 1. MediaPipe Pose Detection
   * 2. Adaptive OneEuroFilter Landmark Smoothing (Anti-Jitter)
   * 3. Joint Angle Calculation on Smoothed Coordinates (Never Raw)
   * 4. FSM with Velocity & Hysteresis Rep Tracking
   * 5. Biomechanical Physics & Moment Arms Evaluation
   * 6. Dual-Mode Canvas Rendering
   */
  const processSingleFrame = async () => {
    const video = videoElementRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize canvas coordinate space with video
    if (video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    try {
      const landmarker = await getPoseLandmarker();
      if (!landmarker) return;

      const now = performance.now();
      const monotonicTime = Math.max(now, lastTimestampRef.current + 1);
      lastTimestampRef.current = monotonicTime;

      const results = landmarker.detectForVideo(video, monotonicTime);
      if (results && results.landmarks && results.landmarks[0] && results.landmarks[0].length >= 33) {
        const frame = extractPoseDataFromLandmarks(results.landmarks[0]);
        if (frame) {
          // 1. STABILIZE KEYPOINTS WITH ONE-EURO FILTER (ANTI-JITTER)
          // No calculation is ever performed on raw keypoints
          const smoothedKeypoints = poseSmootherRef.current.smoothLandmarks(
            frame.keypoints,
            monotonicTime
          );

          // 2. Compute Angles strictly on smoothed coordinates
          let smoothedAngle = 160;
          if (profile.primaryJoint === 'elbow') {
            smoothedAngle = calculateJointAngle(
              smoothedKeypoints['shoulder'],
              smoothedKeypoints['elbow'],
              smoothedKeypoints['wrist']
            );
          } else if (profile.primaryJoint === 'hip') {
            smoothedAngle = calculateJointAngle(
              smoothedKeypoints['shoulder'],
              smoothedKeypoints['hip'],
              smoothedKeypoints['knee']
            );
          } else {
            // knee
            smoothedAngle = calculateJointAngle(
              smoothedKeypoints['hip'],
              smoothedKeypoints['knee'],
              smoothedKeypoints['ankle']
            );
          }

          // 3. FSM Update with Velocity & Hysteresis
          const completedRep = fsmRef.current.update(smoothedAngle, monotonicTime);
          const currentFsmPhase = fsmRef.current.getPhase();
          const angVelocity = fsmRef.current.getSmoothedVelocity();

          if (completedRep) {
            const audit = auditCompletedRepetition(
              completedRep,
              fsmRef.current.getCompletedReps(),
              profile.name,
              targetMuscleBias
            );
            setAuditedReps(prev => [...prev, audit]);
            setRepCount(c => c + 1);
            setActiveAlerts(audit.techniqueVerdict.feedbackCues);
          }

          // 4. Biomechanical Physics Evaluation (Moment Arms, Line of Action, Muscle Bias)
          const telemetry = evaluateBiomechanicalFrame(
            smoothedKeypoints,
            selectedExerciseKey,
            currentFsmPhase,
            smoothedAngle,
            angVelocity,
            resistanceSource,
            targetMuscleBias,
            monotonicTime
          );

          setCurrentPrimaryAngle(Math.round(smoothedAngle));
          setCurrentTelemetry(telemetry);
          setCurrentPhase(currentFsmPhase);

          // 5. Draw Dual Mode Canvas Overlay
          drawDualModeOverlay(
            ctx,
            analysisMode,
            telemetry,
            smoothedKeypoints,
            canvas.width,
            canvas.height,
            analysisMode === 'biomechanics' ? '#F59E0B' : '#10B981'
          );
        }
      }
    } catch (e) {
      // Frame skip error protection
    }
  };

  // Continuous loop when recording or playing video
  useEffect(() => {
    if (!isRecording) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      isProcessingRef.current = false;
      return;
    }

    const processLoop = async () => {
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(processLoop);
        return;
      }
      isProcessingRef.current = true;
      try {
        await processSingleFrame();
      } finally {
        isProcessingRef.current = false;
        animationFrameRef.current = requestAnimationFrame(processLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      isProcessingRef.current = false;
    };
  }, [isRecording, selectedExerciseKey, profile, analysisMode, targetMuscleBias, resistanceSource]);

  // Video transport & playback controls
  const handleTogglePlayPause = () => {
    const video = videoElementRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(err => {
        console.warn('Video play error:', err);
        setVideoCodecError('No se pudo reproducir el vídeo. Si es un archivo .MOV de iPhone grabado en ProRes/HEVC, Windows Chrome requiere convertirlo a MP4 (H.264).');
      });
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleSeekRelative = (seconds: number) => {
    const video = videoElementRef.current;
    if (!video) return;
    const current = video.currentTime || 0;
    const maxDur = video.duration || 100;
    const newTime = Math.max(0, Math.min(maxDur, current + seconds));
    video.currentTime = newTime;
    setVideoCurrentTime(newTime);
    processSingleFrame();
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoElementRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    setVideoCurrentTime(target);
    video.currentTime = target;
    processSingleFrame();
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoElementRef.current;
    setPlaybackSpeed(speed);
    if (video) {
      video.playbackRate = speed;
    }
  };

  const formatVideoTime = (timeInSec: number): string => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const m = Math.floor(timeInSec / 60);
    const s = Math.floor(timeInSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartStop = () => {
    if (uploadedVideoUrl && videoElementRef.current) {
      if (isRecording) {
        videoElementRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoElementRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      }
    }
    setIsRecording(prev => !prev);
  };

  const handleReset = () => {
    setIsRecording(false);
    isProcessingRef.current = false;
    lastTimestampRef.current = 0;
    poseSmootherRef.current.reset();
    fsmRef.current.reset();

    if (videoElementRef.current && !useWebcam) {
      videoElementRef.current.pause();
      videoElementRef.current.currentTime = 0;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setRepCount(0);
    setAuditedReps([]);
    setActiveAlerts([]);
    setCurrentTelemetry(null);
    setBackendDiagnosis(null);
    setCurrentPrimaryAngle(profile.standingThreshold);
    setCurrentPhase('LOCKOUT');
    setVideoCurrentTime(0);
    setIsVideoPlaying(false);
  };

  const handleSendToBackend = async () => {
    if (auditedReps.length === 0) return;
    setIsSendingToBackend(true);
    setBackendError(null);

    const validCount = auditedReps.filter(r => r.isValid).length;
    const payload: VideoTelemetryPayload = {
      userId: 'pablo_athlete',
      exerciseId: selectedExerciseKey,
      exerciseName: profile.name,
      videoDurationSeconds: auditedReps.length * 3.5,
      hardwareModel: uploadedFileName
        ? `Vídeo: ${uploadedFileName} (OneEuroFilter + FSM + MediaPipe)`
        : 'Webcam en Vivo (MediaPipe Pose GPU + OneEuroFilter)',
      metrics: {
        totalRepsCounted: auditedReps.length,
        validRepsCount: validCount,
        failedRepsCount: auditedReps.length - validCount,
        averageRepCadenceSeconds: 3.5,
        romConsistencyScore: Math.round((validCount / auditedReps.length) * 100)
      },
      repsDetail: auditedReps.map(r => ({
        repIndex: r.repIndex,
        isValid: r.isValid,
        eccentricTimeSeconds: r.tempo.eccentricSeconds,
        concentricTimeSeconds: r.tempo.concentricSeconds,
        minElbowAngle: profile.primaryJoint === 'elbow' ? r.techniqueVerdict.romReachedDegrees : undefined,
        minKneeAngle: profile.primaryJoint === 'knee' ? r.techniqueVerdict.romReachedDegrees : undefined,
        minHipAngle: profile.primaryJoint === 'hip' ? r.techniqueVerdict.romReachedDegrees : undefined,
        feedbackAlerts: r.techniqueVerdict.feedbackCues.map(c => ({
          ruleId: 'technique_audit',
          joint: profile.primaryJoint,
          measuredValue: r.techniqueVerdict.romReachedDegrees,
          expectedThreshold: profile.inflectionThreshold,
          message: c
        }))
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

  // Percentage for the scrubber progress bar
  const scrubberProgress = videoDuration > 0
    ? Math.min(100, Math.max(0, (videoCurrentTime / videoDuration) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0f111a] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-3.5 my-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Análisis Biomecánico & Visión Dual</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  aiModelStatus === 'ready'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
                  <Cpu className="w-3 h-3" />
                  {aiModelStatus === 'ready' ? '1€ Filter Anti-Jitter + GPU' : 'Cargando Visión IA...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Filtro temporal OneEuroFilter • FSM con Histéresis • Brazos de Momento & Muscle Bias
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

        {/* Dual Mode Switcher (Botón 1 vs Botón 2) */}
        <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setAnalysisMode('technique')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              analysisMode === 'technique'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Corrección de Técnica</span>
          </button>

          <button
            type="button"
            onClick={() => setAnalysisMode('biomechanics')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              analysisMode === 'biomechanics'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>2. Optimización Biomecánica</span>
          </button>
        </div>

        {/* Mode 2 Biomechanical Context Options (When in Biomechanics Mode) */}
        {analysisMode === 'biomechanics' && (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-2.5 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                Configuración del Contexto Físico (Brazos de Momento & Línea de Fuerza):
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">Fórmula: d = |x_art - x_fuerza|</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Muscle Target Bias Selector */}
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Músculo Objetivo Prioritario:</span>
                <div className="flex gap-1">
                  {[
                    { key: 'quads', label: 'Cuádriceps (Rodilla)' },
                    { key: 'glutes', label: 'Glúteo / Isquios (Cadera)' },
                    { key: 'lats', label: 'Dorsal Ancho' }
                  ].map(b => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setTargetMuscleBias(b.key as any)}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold truncate transition ${
                        targetMuscleBias === b.key
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resistance Source Selector */}
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Tipo de Resistencia Externa:</span>
                <div className="flex gap-1">
                  {[
                    { key: 'gravity', label: 'Gravedad (Barra/Mancuerna)' },
                    { key: 'cable_mid', label: 'Polea / Cable' }
                  ].map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setResistanceSource(r.key as any)}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold truncate transition ${
                        resistanceSource === r.key
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Profile Selector */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Selecciona el ejercicio:
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Foco: {profile.targetJointDescription}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { key: 'lat_pulldown', label: 'Espalda (Jalón/Remo)' },
              { key: 'biceps_curl', label: 'Bíceps (Curl)' },
              { key: 'triceps_extension', label: 'Tríceps (Extensión)' },
              { key: 'rdl_deadlift', label: 'Femoral (Peso Muerto RDL)' },
              { key: 'bench_press', label: 'Press Pecho (Hammer)' },
              { key: 'squat', label: 'Sentadilla Libre' },
              { key: 'leg_press', label: 'Prensa 45°' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setSelectedExerciseKey(item.key);
                  handleReset();
                }}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold text-center truncate transition-all ${
                  selectedExerciseKey === item.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-400 font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video Sources Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadedFileName ? 'Cambiar Vídeo' : 'Subir Vídeo Propio (MP4/MOV)'}</span>
            </button>

            <button
              onClick={handleStartWebcam}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                useWebcam
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{useWebcam ? 'Cámara Activa' : 'Usar Cámara en Vivo'}</span>
            </button>
          </div>

          {uploadedFileName && (
            <span className="text-[11px] text-cyan-300 truncate max-w-xs flex items-center gap-1 font-medium">
              <Film className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{uploadedFileName}</span>
            </span>
          )}
        </div>

        {/* Video Canvas Viewport */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {/* HTML5 Video Element with Full Event Tracking */}
          <video
            ref={videoElementRef}
            src={uploadedVideoUrl || undefined}
            playsInline
            loop={!useWebcam}
            muted
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              const dur = vid.duration || 0;
              setVideoDuration(dur);
              setVideoCodecError(null);
              if (vid.currentTime === 0) {
                vid.currentTime = 0.01;
              }
              setTimeout(() => processSingleFrame(), 80);
            }}
            onDurationChange={(e) => {
              const dur = e.currentTarget.duration || 0;
              if (dur > 0) setVideoDuration(dur);
            }}
            onTimeUpdate={(e) => {
              if (!isScrubbingRef.current) {
                setVideoCurrentTime(e.currentTarget.currentTime);
              }
            }}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onEnded={() => setIsVideoPlaying(false)}
            onError={() => {
              setVideoCodecError('No se pudo decodificar este vídeo en tu navegador. Si es un archivo .MOV de iPhone grabado en ProRes o HEVC/H.265, te sugerimos convertirlo a MP4 (H.264) o usar la cámara web.');
            }}
            onSeeked={() => {
              processSingleFrame();
            }}
            className={`absolute inset-0 w-full h-full object-contain ${
              !uploadedVideoUrl && !useWebcam ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />

          {/* Placeholder when no video is loaded */}
          {!uploadedVideoUrl && !useWebcam && !isRecording && (
            <div className="text-center space-y-2 p-4 z-10">
              <Video className="w-12 h-12 text-cyan-400/60 mx-auto animate-pulse" />
              <p className="text-xs text-slate-300 font-semibold max-w-xs">
                Sube tu vídeo de sentadilla, peso muerto, dorsal o banca para evaluar la técnica y los brazos de momento en tiempo real.
              </p>
              <p className="text-[11px] text-slate-500">
                MediaPipe + OneEuroFilter estabilizan la señal y miden los brazos de palanca articulares.
              </p>
            </div>
          )}

          {/* Real Human Skeleton & Biomechanical Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
          />

          {/* Real-Time Telemetry HUD Overlays */}
          {isRecording && (
            <>
              {/* Primary Joint Angle Gauge */}
              <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 z-30 shadow-lg">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Ángulo {profile.primaryJoint === 'elbow' ? 'de Codo' : profile.primaryJoint === 'hip' ? 'de Cadera' : 'de Rodilla'}
                  </div>
                  <div className="font-mono text-sm font-black text-white">
                    {currentPrimaryAngle}° <span className="text-[10px] text-cyan-400 font-sans font-bold">({currentPhase})</span>
                  </div>
                </div>
              </div>

              {/* Rep Count HUD */}
              <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md border border-blue-500/50 rounded-xl px-3.5 py-1.5 text-right z-30 shadow-lg">
                <div className="text-[10px] text-slate-400 font-semibold">Repeticiones FSM</div>
                <div className="font-mono text-lg font-black text-white">{repCount}</div>
              </div>

              {/* Real-time Status Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5 z-30 pointer-events-none">
                <div className="bg-black/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="text-slate-400">Fase FSM:</span>
                  <span className={`uppercase font-mono font-bold ${
                    currentPhase === 'BOTTOM' ? 'text-amber-400' : currentPhase === 'CONCENTRIC' ? 'text-emerald-400' : 'text-cyan-400'
                  }`}>
                    {currentPhase}
                  </span>
                </div>

                {analysisMode === 'technique' ? (
                  <div className="flex items-center gap-1.5">
                    <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 rounded-xl px-2.5 py-1 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {currentTelemetry?.technique.isSpineNeutral ? 'Columna Neutra' : 'Quiebre Espinal'}
                    </div>

                    <div className="bg-blue-950/80 backdrop-blur-md border border-blue-500/40 rounded-xl px-2.5 py-1 text-[10px] font-bold text-blue-300 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-400" />
                      ROM: {currentTelemetry?.technique.romPercentage ?? 90}%
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl px-2.5 py-1 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-amber-400" />
                      Ratio: {currentTelemetry?.biomechanics.momentArms.hipOverKneeRatio ?? 1.2}
                    </div>

                    <div className="bg-cyan-950/90 backdrop-blur-md border border-cyan-500/50 rounded-xl px-2.5 py-1 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-cyan-400" />
                      Tibia: {currentTelemetry?.biomechanics.tibialAngleDegrees ?? 15}°
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Codec Warning Banner if browser cannot decode */}
        {videoCodecError && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold text-amber-300">Aviso de Compatibilidad de Vídeo:</span>
              <p className="text-[11px] leading-relaxed text-amber-200/90">{videoCodecError}</p>
              <div className="pt-0.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleStartWebcam}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-100 text-[10px] font-bold"
                >
                  Usar Cámara en Vivo
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium"
                >
                  Subir otro archivo (MP4)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Video Navigation Scrubber & Playback Controls Panel */}
        {uploadedVideoUrl && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 space-y-2.5 shadow-lg">
            {/* Visual Progress Scrubber Bar with Fill Indicator */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-cyan-400 font-bold min-w-[38px] text-right">
                {formatVideoTime(videoCurrentTime)}
              </span>

              {/* Custom Track with Active Fill and Overlay Slider */}
              <div className="relative flex-1 flex items-center h-6 select-none">
                {/* Background Track */}
                <div className="absolute inset-x-0 h-2 bg-slate-800 rounded-full overflow-hidden pointer-events-none">
                  {/* Filled Track Segment */}
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-75"
                    style={{ width: `${scrubberProgress}%` }}
                  />
                </div>

                {/* Thumb Indicator */}
                <div
                  className="absolute w-4 h-4 bg-white rounded-full shadow-lg shadow-cyan-500/50 border-2 border-cyan-400 pointer-events-none -ml-2 transition-transform"
                  style={{ left: `${scrubberProgress}%` }}
                />

                {/* Functional Input Range Overlay */}
                <input
                  type="range"
                  min={0}
                  max={videoDuration > 0 ? videoDuration : 1}
                  step={0.01}
                  value={videoCurrentTime}
                  onMouseDown={() => { isScrubbingRef.current = true; }}
                  onTouchStart={() => { isScrubbingRef.current = true; }}
                  onChange={handleScrubChange}
                  onMouseUp={() => {
                    isScrubbingRef.current = false;
                    processSingleFrame();
                  }}
                  onTouchEnd={() => {
                    isScrubbingRef.current = false;
                    processSingleFrame();
                  }}
                  className="w-full h-6 opacity-0 cursor-pointer z-10"
                />
              </div>

              <span className="text-[11px] font-mono text-slate-400 font-medium min-w-[38px]">
                {formatVideoTime(videoDuration)}
              </span>
            </div>

            {/* Playback Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              {/* Transport Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSeekRelative(-0.1)}
                  title="Retroceder 1 fotograma (-0.1s)"
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
                >
                  -0.1s
                </button>

                <button
                  type="button"
                  onClick={() => handleSeekRelative(-5)}
                  title="Retroceder 5 segundos"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-0.5 text-xs font-semibold"
                >
                  <Rewind className="w-3.5 h-3.5" />
                  <span className="text-[10px]">-5s</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  className={`p-2 rounded-xl text-white font-bold transition shadow-md flex items-center justify-center ${
                    isVideoPlaying
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                  title={isVideoPlaying ? 'Pausar vídeo' : 'Reproducir vídeo'}
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSeekRelative(5)}
                  title="Adelantar 5 segundos"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-0.5 text-xs font-semibold"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span className="text-[10px]">+5s</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSeekRelative(0.1)}
                  title="Avanzar 1 fotograma (+0.1s)"
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
                >
                  +0.1s
                </button>
              </div>

              {/* Playback Speeds */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold px-1">Velocidad:</span>
                {[0.25, 0.5, 0.75, 1.0].map(speed => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                      playbackSpeed === speed
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 1: DIAGNOSTIC CARDS (CORRECCIÓN DE TÉCNICA)          */}
        {/* ========================================================= */}
        {analysisMode === 'technique' && (
          <div className="space-y-3">
            {/* Real-time Technique Status */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Rango (ROM)</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {currentTelemetry?.technique.romPercentage ?? 85}%
                </span>
                <span className="text-[9px] text-slate-500 block">del recorrido</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Neutralidad Espinal</span>
                <span className={`text-xs font-black font-mono block mt-0.5 ${
                  currentTelemetry?.technique.isSpineNeutral ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {currentTelemetry?.technique.isSpineNeutral ? '✓ Alineada' : '⚡ Torso Inclinado'}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {currentTelemetry?.technique.spinalAngleDegrees ?? 15}° a la vertical
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Estabilidad Rodilla</span>
                <span className={`text-xs font-black font-mono block mt-0.5 ${
                  currentTelemetry?.technique.isKneeValgusDetected ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {currentTelemetry?.technique.isKneeValgusDetected ? '⚡ Valgo Dinámico' : '✓ Eje Estable'}
                </span>
                <span className="text-[9px] text-slate-500 block">sin colapso interno</span>
              </div>
            </div>

            {/* Active Feedback Alerts */}
            {activeAlerts.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Feedback de Ejecución en Tiempo Real
                </span>
                {activeAlerts.map((msg, i) => {
                  const isSuccess = msg.startsWith('✓') || msg.startsWith('★');
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-xl text-xs flex items-start gap-2 border ${
                        isSuccess
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      )}
                      <span>{msg}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: DIAGNOSTIC CARDS (OPTIMIZACIÓN BIOMECÁNICA)       */}
        {/* ========================================================= */}
        {analysisMode === 'biomechanics' && currentTelemetry && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                Diagnóstico de Brazos de Momento & Sesgo Muscular
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {currentTelemetry.biomechanics.muscleBiasLabel}
              </span>
            </div>

            {/* Moment Arms Numbers */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">d_cadera (Hip)</span>
                <span className="text-base font-black text-amber-300 font-mono">
                  {Math.round(currentTelemetry.biomechanics.momentArms.hip * 100)} cm
                </span>
                <span className="text-[9px] text-slate-500 block">Brazo de momento</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">d_rodilla (Knee)</span>
                <span className="text-base font-black text-cyan-300 font-mono">
                  {Math.round(currentTelemetry.biomechanics.momentArms.knee * 100)} cm
                </span>
                <span className="text-[9px] text-slate-500 block">Brazo de momento</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-purple-400 font-bold uppercase block">Ratio Dominancia</span>
                <span className="text-base font-black text-purple-300 font-mono">
                  {currentTelemetry.biomechanics.momentArms.hipOverKneeRatio}
                </span>
                <span className="text-[9px] text-slate-500 block">d_cadera / d_rodilla</span>
              </div>
            </div>

            {/* Scientific Biomechanical Assessment */}
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/25 text-xs text-amber-200 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Perfil de Resistencia vs Hipertrofia Mediada por Estiramiento:
              </div>
              <p className="text-[11px] leading-relaxed text-amber-100/90">
                {currentTelemetry.biomechanics.momentArms.hipOverKneeRatio > 1.25
                  ? 'Variante con dominancia de cadera: el mayor brazo de palanca horizontal en flexión profunda maximiza la tensión mecánica sobre el glúteo mayor e isquiosurales.'
                  : 'Variante con dominancia de rodilla: el avance tibial y dorsiflexión desplazan el vector de carga hacia el tendón rotuliano, aislando el cuádriceps.'}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Inclinación tibial: <strong className="text-cyan-300">{currentTelemetry.biomechanics.tibialAngleDegrees}°</strong></span>
                <span>Pico de torque: <strong className="text-emerald-300">{currentTelemetry.biomechanics.resistancePeakLocation}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Repetition History Detail Cards (Audited Reps with Tempo & Metrics) */}
        {auditedReps.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Desglose FSM de Repeticiones ({auditedReps.length} registradas)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                Tempo Real vs Planificado
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {auditedReps.map((rep) => (
                <div
                  key={rep.repIndex}
                  className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-cyan-300 text-xs px-1.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800">
                      #{rep.repIndex}
                    </span>
                    <span className="font-semibold text-slate-200">
                      ROM: <strong className="text-emerald-400">{rep.techniqueVerdict.romReachedDegrees}°</strong> ({rep.techniqueVerdict.romConsistencyScore}% consistencia)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tempo: <strong className="text-cyan-300">{rep.tempo.tempoDisplay}</strong>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {rep.biomechanicsVerdict.biasLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
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
            {isRecording ? 'Pausar Detección' : (uploadedFileName ? 'Iniciar Detección Dual' : 'Iniciar Tracking Articular')}
          </button>

          <button
            onClick={handleReset}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>

          <button
            disabled={auditedReps.length === 0 || isSendingToBackend}
            onClick={handleSendToBackend}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {isSendingToBackend ? 'Enviando...' : 'Guardar Análisis'}
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
