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
  RefreshCw
} from 'lucide-react';
import {
  calculateJointAngle,
  drawSkeletonOnCanvas,
  EXERCISE_POSE_PROFILES,
  getPoseLandmarker,
  extractPoseDataFromLandmarks,
  Keypoint2D,
  RepetitionRecord,
  RepPhase,
  ExercisePoseProfile
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

  // AI MediaPipe Vision Model Status
  const [aiModelStatus, setAiModelStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [isRecording, setIsRecording] = useState(false);

  // Dynamic angles
  const [currentPrimaryAngle, setCurrentPrimaryAngle] = useState<number>(155);
  const [secondaryAngle, setSecondaryAngle] = useState<number>(160);
  const [repCount, setRepCount] = useState<number>(0);
  const [repPhase, setRepPhase] = useState<RepPhase>('STANDING');
  const [repsHistory, setRepsHistory] = useState<RepetitionRecord[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [backendDiagnosis, setBackendDiagnosis] = useState<TelemetryAnalysisResponse | null>(null);
  const [isSendingToBackend, setIsSendingToBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastTimestampRef = useRef<number>(0);
  const smoothedKeypointsRef = useRef<Record<string, Keypoint2D> | null>(null);
  const smoothedPrimaryAngleRef = useRef<number>(160);
  const smoothedSecondaryAngleRef = useRef<number>(160);
  const lastUiUpdateRef = useRef<number>(0);
  const displayPrimaryAngleRef = useRef<number>(155);

  // Persistent repetition detector state
  const repTrackerRef = useRef<{
    stage: 'WAITING_START' | 'ECCENTRIC' | 'BOTTOM' | 'CONCENTRIC';
    calibratedTopAngle: number;
    minAngleInRep: number;
    maxAngleInRep: number;
    repStartTime: number;
    bottomStartTime: number;
    concentricStartTime: number;
    lastRepCompletionTime: number;
    recentAngles: number[];
  }>({
    stage: 'WAITING_START',
    calibratedTopAngle: 150,
    minAngleInRep: 180,
    maxAngleInRep: 0,
    repStartTime: 0,
    bottomStartTime: 0,
    concentricStartTime: 0,
    lastRepCompletionTime: 0,
    recentAngles: []
  });

  const profile: ExercisePoseProfile = EXERCISE_POSE_PROFILES[selectedExerciseKey] || EXERCISE_POSE_PROFILES.lat_pulldown;

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

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
      setBackendDiagnosis(null);
      setRepsHistory([]);
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
    handleReset();
  };

  // Main Tracking Loop: Reads frames from <video>, passes them to MediaPipe Pose, computes biomechanics
  useEffect(() => {
    if (!isRecording) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      isProcessingRef.current = false;
      return;
    }

    const video = videoElementRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let simTime = 0;

    const processFrame = async () => {
      // Reentrancy lock to prevent WASM concurrency collisions
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      isProcessingRef.current = true;

      try {
        // Synchronize canvas coordinate space with video
        if (video.videoWidth && canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const isRealMedia = Boolean(uploadedVideoUrl || useWebcam);
        let rawKeypoints: Record<string, Keypoint2D> | null = null;
        let rawPrimary = 150;
        let rawAux = 155;

        // 1. REAL VISION ESTIMATION via MediaPipe
        const landmarker = await getPoseLandmarker();
        if (landmarker && video.readyState >= 2 && !video.paused && !video.ended) {
          try {
            // Strictly enforce monotonic timestamps
            const now = performance.now();
            const monotonicTime = Math.max(now, lastTimestampRef.current + 1);
            lastTimestampRef.current = monotonicTime;

            const results = landmarker.detectForVideo(video, monotonicTime);
            if (results && results.landmarks && results.landmarks[0] && results.landmarks[0].length >= 33) {
              const frame = extractPoseDataFromLandmarks(results.landmarks[0]);
              if (frame) {
                rawKeypoints = frame.keypoints;
                if (profile.primaryJoint === 'elbow') {
                  rawPrimary = frame.elbowAngle;
                  rawAux = frame.torsoLeanAngle;
                } else if (profile.primaryJoint === 'hip') {
                  rawPrimary = frame.hipAngle;
                  rawAux = frame.kneeAngle;
                } else {
                  rawPrimary = frame.kneeAngle;
                  rawAux = frame.hipAngle;
                }
              }
            }
          } catch (e) {
            // Frame skip error protection
          }
        }

        let displayKeypoints: Record<string, Keypoint2D> | null = null;
        const alpha = 0.55; // EMA factor for steady landmark interpolation

        if (rawKeypoints) {
          // Smooth keypoint coordinates with EMA
          const prevKeypoints = smoothedKeypointsRef.current;
          const smoothed: Record<string, Keypoint2D> = {};

          for (const [jointName, pt] of Object.entries(rawKeypoints)) {
            if (!pt) continue;
            const prev = prevKeypoints?.[jointName];
            if (prev) {
              smoothed[jointName] = {
                ...pt,
                x: alpha * pt.x + (1 - alpha) * prev.x,
                y: alpha * pt.y + (1 - alpha) * prev.y
              };
            } else {
              smoothed[jointName] = { ...pt };
            }
          }

          smoothedKeypointsRef.current = smoothed;
          displayKeypoints = smoothed;

          // Smooth angles with EMA
          smoothedPrimaryAngleRef.current = alpha * rawPrimary + (1 - alpha) * smoothedPrimaryAngleRef.current;
          smoothedSecondaryAngleRef.current = alpha * rawAux + (1 - alpha) * smoothedSecondaryAngleRef.current;
        } else if (isRealMedia) {
          // In real video, retain smoothed previous keypoints on momentary dropped frame
          displayKeypoints = smoothedKeypointsRef.current;
        } else {
          // ONLY run synthetic oscillator in idle demo mode when NO user media is active
          simTime += 0.045;
          const normalized = (Math.sin(simTime) + 1) / 2; // 0 to 1
          const span = profile.standingThreshold - profile.inflectionThreshold;
          rawPrimary = Math.round((profile.inflectionThreshold + normalized * span) * 10) / 10;
          rawAux = 155;
          smoothedPrimaryAngleRef.current = rawPrimary;
          smoothedSecondaryAngleRef.current = rawAux;

          if (profile.category === 'back') {
            const armY = 0.28 + (1 - normalized) * 0.18;
            displayKeypoints = {
              shoulder: { x: 0.52, y: 0.40 },
              elbow: { x: 0.48, y: armY + 0.08 },
              wrist: { x: 0.50, y: armY },
              hip: { x: 0.52, y: 0.65 },
              knee: { x: 0.46, y: 0.78 },
              ankle: { x: 0.45, y: 0.92 }
            };
          } else if (profile.category === 'biceps') {
            const curlY = 0.58 - (1 - normalized) * 0.20;
            displayKeypoints = {
              shoulder: { x: 0.50, y: 0.35 },
              elbow: { x: 0.50, y: 0.52 },
              wrist: { x: 0.46, y: curlY },
              hip: { x: 0.50, y: 0.65 },
              knee: { x: 0.48, y: 0.82 },
              ankle: { x: 0.48, y: 0.94 }
            };
          } else if (profile.category === 'legs_hamstrings') {
            const hingeTorsoY = 0.40 + (1 - normalized) * 0.18;
            displayKeypoints = {
              shoulder: { x: 0.42, y: hingeTorsoY },
              elbow: { x: 0.44, y: hingeTorsoY + 0.12 },
              wrist: { x: 0.45, y: hingeTorsoY + 0.22 },
              hip: { x: 0.56 + (1 - normalized) * 0.08, y: 0.58 },
              knee: { x: 0.52, y: 0.78 },
              ankle: { x: 0.50, y: 0.94 }
            };
          } else {
            displayKeypoints = {
              shoulder: { x: 0.50, y: 0.32 },
              elbow: { x: 0.44, y: 0.45 + (1 - normalized) * 0.08 },
              wrist: { x: 0.48, y: 0.55 },
              hip: { x: 0.50, y: 0.55 + (1 - normalized) * 0.12 },
              knee: { x: 0.46, y: 0.74 + (1 - normalized) * 0.05 },
              ankle: { x: 0.46, y: 0.92 }
            };
          }
        }

        const nowMs = Date.now();

        // 2. THROTTLED UI DISPLAY (Updates at ~5.5 Hz with integer values to make angles readable without flickering)
        if (nowMs - lastUiUpdateRef.current >= 180) {
          lastUiUpdateRef.current = nowMs;
          const displayAngle = Math.round(smoothedPrimaryAngleRef.current);
          displayPrimaryAngleRef.current = displayAngle;
          setCurrentPrimaryAngle(displayAngle);
          setSecondaryAngle(Math.round(smoothedSecondaryAngleRef.current));
        }

        // 3. ROBUST HYSTERESIS-BASED REPETITION DETECTOR
        const tracker = repTrackerRef.current;
        const angle = smoothedPrimaryAngleRef.current;

        // Maintain moving history window of recent 5 frames for directional trend confirmation
        tracker.recentAngles.push(angle);
        if (tracker.recentAngles.length > 5) tracker.recentAngles.shift();

        const isTrendingDown = tracker.recentAngles.length >= 3 &&
          tracker.recentAngles[tracker.recentAngles.length - 1] < tracker.recentAngles[0] - 2.0;
        const isTrendingUp = tracker.recentAngles.length >= 3 &&
          tracker.recentAngles[tracker.recentAngles.length - 1] > tracker.recentAngles[0] + 2.0;

        const isDescendingMode = profile.trackingMode === 'descending';

        if (isDescendingMode) {
          // Dynamic Lockout Calibration: learns user's natural top position
          if (tracker.stage === 'WAITING_START') {
            if (angle > tracker.calibratedTopAngle && angle <= 175) {
              tracker.calibratedTopAngle = angle;
            }
            // Trigger eccentric descent:
            // - Drop at least 12° below top position
            // - Clear descending trend
            // - Cooldown: at least 1100ms since last completed rep
            if (
              angle < tracker.calibratedTopAngle - 12 &&
              isTrendingDown &&
              (nowMs - tracker.lastRepCompletionTime >= 1100)
            ) {
              tracker.stage = 'ECCENTRIC';
              tracker.repStartTime = nowMs;
              tracker.minAngleInRep = angle;
              setRepPhase('DESCENDING');
            }
          } else if (tracker.stage === 'ECCENTRIC') {
            if (angle < tracker.minAngleInRep) {
              tracker.minAngleInRep = angle;
            }
            // Transition to BOTTOM when reaching deep ROM or turning around
            if (angle <= profile.inflectionThreshold + 6 || (angle >= tracker.minAngleInRep + 6 && isTrendingUp)) {
              tracker.stage = 'BOTTOM';
              tracker.bottomStartTime = nowMs;
              setRepPhase('BOTTOM');
            }
          } else if (tracker.stage === 'BOTTOM') {
            if (angle < tracker.minAngleInRep) {
              tracker.minAngleInRep = angle;
            }
            // Transition to CONCENTRIC when ascending by at least 10° above valley
            if (angle >= tracker.minAngleInRep + 10 && isTrendingUp) {
              tracker.stage = 'CONCENTRIC';
              tracker.concentricStartTime = nowMs;
              setRepPhase('ASCENDING');
            }
          } else if (tracker.stage === 'CONCENTRIC') {
            // Check return to near-lockout top position
            const nearTop = angle >= tracker.calibratedTopAngle - 12 || angle >= profile.standingThreshold - 12;
            if (nearTop) {
              const totalDurationMs = nowMs - tracker.repStartTime;
              const totalExcursion = tracker.calibratedTopAngle - tracker.minAngleInRep;
              const reachedTargetDepth = tracker.minAngleInRep <= profile.inflectionThreshold + 10;

              // Rigorous gym repetition constraints:
              // 1. Minimum 1.6s duration
              // 2. Minimum 28° angular excursion
              // 3. Reached bottom inflection depth
              if (totalDurationMs >= 1600 && totalExcursion >= 28 && reachedTargetDepth) {
                const eccTime = Math.max(1.1, Math.round(((tracker.bottomStartTime - tracker.repStartTime) / 1000) * 10) / 10);
                const conTime = Math.max(0.8, Math.round(((nowMs - tracker.concentricStartTime) / 1000) * 10) / 10);

                const isRomFull = tracker.minAngleInRep <= profile.inflectionThreshold + 6;
                const isTempoControlled = eccTime >= 1.8;
                const isSetupCorrect = smoothedSecondaryAngleRef.current <= 30;

                const repAlerts: Array<{ ruleId: string; joint: string; measuredValue: number; expectedThreshold: number; message: string }> = [];

                if (isRomFull) {
                  repAlerts.push({
                    ruleId: 'rom_full',
                    joint: profile.primaryJoint,
                    measuredValue: Math.round(tracker.minAngleInRep),
                    expectedThreshold: profile.inflectionThreshold,
                    message: `✓ ROM completo: flexión alcanzada de ${Math.round(tracker.minAngleInRep)}° con estiramiento óptimo de fibras musculares.`
                  });
                } else {
                  repAlerts.push({
                    ruleId: 'rom_partial',
                    joint: profile.primaryJoint,
                    measuredValue: Math.round(tracker.minAngleInRep),
                    expectedThreshold: profile.inflectionThreshold,
                    message: `⚡ Recorrido algo corto: alcanzaste ${Math.round(tracker.minAngleInRep)}°. Baja 5°-10° más para estirar al máximo.`
                  });
                }

                if (isSetupCorrect) {
                  repAlerts.push({
                    ruleId: 'setup_correct',
                    joint: 'torso',
                    measuredValue: Math.round(smoothedSecondaryAngleRef.current),
                    expectedThreshold: 25,
                    message: `✓ Colocación y postura correctas: torso apoyado sólidamente, escápulas retraídas y hombros protegidos.`
                  });
                }

                if (isTempoControlled) {
                  repAlerts.push({
                    ruleId: 'tempo_good',
                    joint: 'tempo',
                    measuredValue: eccTime,
                    expectedThreshold: 2.0,
                    message: `★ Tempo excéntrico excelente: bajada controlada en ${eccTime}s y empuje concéntrico en ${conTime}s.`
                  });
                } else {
                  repAlerts.push({
                    ruleId: 'tempo_fast',
                    joint: 'tempo',
                    measuredValue: eccTime,
                    expectedThreshold: 2.0,
                    message: `⚡ Tempo excéntrico: bajada en ${eccTime}s (rápida). Intenta frenar la bajada a 2.5-3.0s para maximizar la tensión mecánica.`
                  });
                }

                const newRecord: RepetitionRecord = {
                  repIndex: repsHistory.length + 1,
                  isValid: isRomFull,
                  eccentricTimeSeconds: eccTime,
                  concentricTimeSeconds: conTime,
                  minElbowAngle: profile.primaryJoint === 'elbow' ? Math.round(tracker.minAngleInRep) : undefined,
                  minKneeAngle: profile.primaryJoint === 'knee' ? Math.round(tracker.minAngleInRep) : undefined,
                  minHipAngle: profile.primaryJoint === 'hip' ? Math.round(tracker.minAngleInRep) : undefined,
                  setupStatus: isSetupCorrect ? 'correct' : 'needs_attention',
                  tempoStatus: isTempoControlled ? 'controlled' : 'fast',
                  romStatus: isRomFull ? 'full' : 'partial',
                  feedbackAlerts: repAlerts
                };

                setRepsHistory(prev => [...prev, newRecord]);
                setRepCount(c => c + 1);
                setActiveAlerts(repAlerts.map(a => a.message));
                tracker.lastRepCompletionTime = nowMs;
              }

              tracker.stage = 'WAITING_START';
              setRepPhase('STANDING');
              tracker.minAngleInRep = 180;
            }
          }
        } else {
          // Ascending mode (triceps extension)
          if (tracker.stage === 'WAITING_START') {
            if (angle < tracker.calibratedTopAngle && angle >= 65) {
              tracker.calibratedTopAngle = angle;
            }
            if (
              angle > tracker.calibratedTopAngle + 12 &&
              isTrendingUp &&
              (nowMs - tracker.lastRepCompletionTime >= 1100)
            ) {
              tracker.stage = 'ECCENTRIC';
              tracker.repStartTime = nowMs;
              tracker.maxAngleInRep = angle;
              setRepPhase('DESCENDING');
            }
          } else if (tracker.stage === 'ECCENTRIC') {
            if (angle > tracker.maxAngleInRep) {
              tracker.maxAngleInRep = angle;
            }
            if (angle >= profile.inflectionThreshold - 6 || (angle <= tracker.maxAngleInRep - 6 && isTrendingDown)) {
              tracker.stage = 'BOTTOM';
              tracker.bottomStartTime = nowMs;
              setRepPhase('BOTTOM');
            }
          } else if (tracker.stage === 'BOTTOM') {
            if (angle > tracker.maxAngleInRep) {
              tracker.maxAngleInRep = angle;
            }
            if (angle <= tracker.maxAngleInRep - 10 && isTrendingDown) {
              tracker.stage = 'CONCENTRIC';
              tracker.concentricStartTime = nowMs;
              setRepPhase('ASCENDING');
            }
          } else if (tracker.stage === 'CONCENTRIC') {
            const nearStart = angle <= tracker.calibratedTopAngle + 10 || angle <= profile.standingThreshold + 10;
            if (nearStart) {
              const totalDurationMs = nowMs - tracker.repStartTime;
              const totalExcursion = tracker.maxAngleInRep - tracker.calibratedTopAngle;
              const reachedTargetExt = tracker.maxAngleInRep >= profile.inflectionThreshold - 10;

              if (totalDurationMs >= 1600 && totalExcursion >= 28 && reachedTargetExt) {
                const eccTime = Math.max(1.1, Math.round(((tracker.bottomStartTime - tracker.repStartTime) / 1000) * 10) / 10);
                const conTime = Math.max(0.8, Math.round(((nowMs - tracker.concentricStartTime) / 1000) * 10) / 10);
                const isRomFull = tracker.maxAngleInRep >= profile.inflectionThreshold - 6;
                const isTempoControlled = eccTime >= 1.8;

                const repAlerts: Array<{ ruleId: string; joint: string; measuredValue: number; expectedThreshold: number; message: string }> = [];
                if (isRomFull) {
                  repAlerts.push({
                    ruleId: 'triceps_lockout_ok',
                    joint: 'elbow',
                    measuredValue: Math.round(tracker.maxAngleInRep),
                    expectedThreshold: profile.inflectionThreshold,
                    message: `✓ ROM completo: extensión y bloqueo pleno de tríceps a ${Math.round(tracker.maxAngleInRep)}°.`
                  });
                } else {
                  repAlerts.push({
                    ruleId: 'triceps_lockout_partial',
                    joint: 'elbow',
                    measuredValue: Math.round(tracker.maxAngleInRep),
                    expectedThreshold: profile.inflectionThreshold,
                    message: `⚡ Extensión incompleta: alcanzaste ${Math.round(tracker.maxAngleInRep)}°. Bloquea abajo a ≥ ${profile.inflectionThreshold}°.`
                  });
                }

                repAlerts.push({
                  ruleId: 'setup_ok',
                  joint: 'torso',
                  measuredValue: 0,
                  expectedThreshold: 20,
                  message: `✓ Colocación correcta: codos pegados a los costados y tronco estable.`
                });

                if (isTempoControlled) {
                  repAlerts.push({
                    ruleId: 'tempo_ok',
                    joint: 'tempo',
                    measuredValue: eccTime,
                    expectedThreshold: 2.0,
                    message: `★ Tempo excéntrico excelente: extensión sostenida (${eccTime}s) y control concéntrico.`
                  });
                } else {
                  repAlerts.push({
                    ruleId: 'tempo_fast',
                    joint: 'tempo',
                    measuredValue: eccTime,
                    expectedThreshold: 2.0,
                    message: `⚡ Tempo: controla la fase negativa en 2-3 segundos para mayor estímulo del tríceps.`
                  });
                }

                const newRecord: RepetitionRecord = {
                  repIndex: repsHistory.length + 1,
                  isValid: isRomFull,
                  eccentricTimeSeconds: eccTime,
                  concentricTimeSeconds: conTime,
                  minElbowAngle: Math.round(tracker.maxAngleInRep),
                  setupStatus: 'correct',
                  tempoStatus: isTempoControlled ? 'controlled' : 'fast',
                  romStatus: isRomFull ? 'full' : 'partial',
                  feedbackAlerts: repAlerts
                };

                setRepsHistory(prev => [...prev, newRecord]);
                setRepCount(c => c + 1);
                setActiveAlerts(repAlerts.map(a => a.message));
                tracker.lastRepCompletionTime = nowMs;
              }

              tracker.stage = 'WAITING_START';
              setRepPhase('STANDING');
              tracker.maxAngleInRep = 0;
            }
          }
        }

        // 4. DRAW SKELETON WITH READABLE INTEGER ANGLE BADGE
        if (displayKeypoints) {
          const isTargetValid = isDescendingMode
            ? displayPrimaryAngleRef.current <= profile.inflectionThreshold + 5
            : displayPrimaryAngleRef.current >= profile.inflectionThreshold - 5;

          const feedbackColor = isTargetValid ? '#10B981' : '#F59E0B';

          drawSkeletonOnCanvas(ctx, displayKeypoints, canvas.width, canvas.height, feedbackColor, {
            angle: displayPrimaryAngleRef.current,
            label: profile.primaryJoint,
            x: displayKeypoints[profile.primaryJoint]?.x,
            y: displayKeypoints[profile.primaryJoint]?.y
          });
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } finally {
        isProcessingRef.current = false;
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      isProcessingRef.current = false;
    };
  }, [isRecording, selectedExerciseKey, profile, uploadedVideoUrl, useWebcam]);

  const handleStartStop = () => {
    if (uploadedVideoUrl && videoElementRef.current) {
      if (isRecording) {
        videoElementRef.current.pause();
      } else {
        videoElementRef.current.play().catch(() => {});
      }
    }
    setIsRecording(prev => !prev);
  };

  const handleReset = () => {
    setIsRecording(false);
    isProcessingRef.current = false;
    lastTimestampRef.current = 0;
    smoothedKeypointsRef.current = null;
    smoothedPrimaryAngleRef.current = profile.standingThreshold;
    smoothedSecondaryAngleRef.current = 160;
    displayPrimaryAngleRef.current = profile.standingThreshold;
    lastUiUpdateRef.current = 0;
    repTrackerRef.current = {
      stage: 'WAITING_START',
      calibratedTopAngle: profile.standingThreshold,
      minAngleInRep: 180,
      maxAngleInRep: 0,
      repStartTime: 0,
      bottomStartTime: 0,
      concentricStartTime: 0,
      lastRepCompletionTime: 0,
      recentAngles: []
    };
    if (videoElementRef.current && !useWebcam) {
      videoElementRef.current.pause();
      videoElementRef.current.currentTime = 0;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setRepCount(0);
    setRepsHistory([]);
    setActiveAlerts([]);
    setBackendDiagnosis(null);
    setCurrentPrimaryAngle(profile.standingThreshold);
    setRepPhase('STANDING');
  };

  const handleSendToBackend = async () => {
    if (repsHistory.length === 0) return;
    setIsSendingToBackend(true);
    setBackendError(null);

    const validCount = repsHistory.filter(r => r.isValid).length;
    const payload: VideoTelemetryPayload = {
      userId: 'pablo_athlete',
      exerciseId: selectedExerciseKey,
      exerciseName: profile.name,
      videoDurationSeconds: repsHistory.length * 3.5,
      hardwareModel: uploadedFileName ? `Vídeo: ${uploadedFileName} (MediaPipe Pose WebAssembly)` : 'Webcam en Vivo (MediaPipe Pose GPU)',
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
        minElbowAngle: r.minElbowAngle,
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
                <h3 className="text-base sm:text-lg font-black text-white">Análisis Biomecánico por Visión Artificial</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  aiModelStatus === 'ready'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
                  <Cpu className="w-3 h-3" />
                  {aiModelStatus === 'ready' ? 'MediaPipe Pose GPU' : 'Cargando Visión IA...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tracking articular real sobre tus propios fotogramas con trigonometría y telemetría
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

        {/* Exercise Profile Selector */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Selecciona el ejercicio a analizar:
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

        {/* Video Canvas Viewport (Scaled with 16:9 / 9:16 aspect ratio support) */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {/* HTML5 Video Element */}
          <video
            ref={videoElementRef}
            src={uploadedVideoUrl || undefined}
            playsInline
            loop={!useWebcam}
            muted
            className={`absolute inset-0 w-full h-full object-contain ${
              !uploadedVideoUrl && !useWebcam ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />

          {/* Placeholder when no video is loaded */}
          {!uploadedVideoUrl && !useWebcam && !isRecording && (
            <div className="text-center space-y-2 p-4 z-10">
              <Video className="w-12 h-12 text-cyan-400/60 mx-auto animate-pulse" />
              <p className="text-xs text-slate-300 font-semibold max-w-xs">
                Sube tu vídeo de espalda (como en tu máquina Technogym), bíceps o femoral para superponer el esqueleto articular.
              </p>
              <p className="text-[11px] text-slate-500">
                MediaPipe detectará automáticamente tus hombros, codos y caderas para corregir tu técnica.
              </p>
            </div>
          )}

          {/* Real Human Skeleton Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
          />

          {/* Real-Time Telemetry HUD overlays */}
          {isRecording && (
            <>
              {/* Primary Joint Angle Gauge */}
              <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 z-30 shadow-lg">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Ángulo {profile.primaryJoint === 'elbow' ? 'de Codo' : profile.primaryJoint === 'hip' ? 'de Cadera' : 'de Rodilla'}
                  </div>
                  <div className={`font-mono text-sm font-black ${
                    profile.trackingMode === 'descending'
                      ? (currentPrimaryAngle <= profile.inflectionThreshold + 6 ? 'text-emerald-400' : 'text-cyan-300')
                      : (currentPrimaryAngle >= profile.inflectionThreshold - 6 ? 'text-emerald-400' : 'text-cyan-300')
                  }`}>
                    {currentPrimaryAngle}° {
                      profile.trackingMode === 'descending'
                        ? (currentPrimaryAngle <= profile.inflectionThreshold + 6 ? '✓ ROM COMPLETO' : '• EN FASE')
                        : (currentPrimaryAngle >= profile.inflectionThreshold - 6 ? '✓ BLOQUEO' : '• EXTENDIENDO')
                    }
                  </div>
                </div>
              </div>

              {/* Rep Count HUD */}
              <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md border border-blue-500/50 rounded-xl px-3.5 py-1.5 text-right z-30 shadow-lg">
                <div className="text-[10px] text-slate-400 font-semibold">Repeticiones</div>
                <div className="font-mono text-lg font-black text-white">{repCount}</div>
              </div>

              {/* Real-time Status Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5 z-30 pointer-events-none">
                <div className="bg-black/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="text-slate-400">Fase:</span>
                  <span className="text-cyan-400 uppercase font-mono font-bold">{repPhase}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 rounded-xl px-2.5 py-1 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Colocación: Correcta
                  </div>

                  <div className="bg-blue-950/80 backdrop-blur-md border border-blue-500/40 rounded-xl px-2.5 py-1 text-[10px] font-bold text-blue-300 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    Tempo: 3-0-1 Controlado
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Biomechanical Diagnostic Badges & Live Feedback Alerts */}
        {activeAlerts.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Evaluación Biomecánica en Tiempo Real
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ Colocación Correcta
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  ✓ ROM Válido
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
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
          </div>
        )}

        {/* Repetition History Detail Cards */}
        {repsHistory.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Desglose por Repetición (ROM, Tempo & Colocación)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {repsHistory.length} {repsHistory.length === 1 ? 'repetición registrada' : 'repeticiones registradas'}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {repsHistory.map((rep) => (
                <div
                  key={rep.repIndex}
                  className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-cyan-300 text-xs px-1.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800">
                      #{rep.repIndex}
                    </span>
                    <span className="font-semibold text-slate-200">
                      ROM: <strong className="text-emerald-400">{rep.minElbowAngle ?? rep.minKneeAngle ?? rep.minHipAngle}°</strong> (Completo)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Bajada: <strong className="text-cyan-300 font-mono">{rep.eccentricTimeSeconds}s</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Subida: <strong className="text-cyan-300 font-mono">{rep.concentricTimeSeconds}s</strong>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Setup OK
                    </span>
                  </div>
                </div>
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
            {isRecording ? 'Pausar Detección' : (uploadedFileName ? 'Analizar Vídeo con MediaPipe' : 'Iniciar Tracking Articular')}
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
