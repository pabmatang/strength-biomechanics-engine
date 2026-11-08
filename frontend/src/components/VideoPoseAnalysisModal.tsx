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
  drawDualModeOverlay,
  RenderOverlayOptions
} from '../utils/videoPoseEstimator';
import { PoseLandmarkSmoother } from '../utils/oneEuroFilter';
import { BiomechanicalFSM, CompletedRepetition, FsmPhase } from '../utils/biomechanicalFSM';
import {
  evaluateBiomechanicalFrame,
  auditCompletedRepetition,
  BiomechanicalTelemetryFrame,
  RepetitionBiomechanicalAudit,
  ResistanceSourceType,
  LoadType,
  TargetMuscle,
  CameraPlane,
  EXERCISE_PATTERNS,
  ExercisePatternSpec,
  evaluateBiomechanicalVerdict,
  detectCameraPlane,
  calculateTibialAngle
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
  // Cascading Selection State
  const [loadType, setLoadType] = useState<LoadType>('gravity');
  const [targetMuscle, setTargetMuscle] = useState<TargetMuscle>('glutes_max');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('bulgarian_split_squat_glute');

  // Available patterns filtered for selected target muscle
  const availablePatterns = EXERCISE_PATTERNS.filter(p => p.targetMuscle === targetMuscle);
  const selectedPattern: ExercisePatternSpec =
    availablePatterns.find(p => p.id === selectedPatternId) ||
    availablePatterns[0] ||
    EXERCISE_PATTERNS[0];

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState(false);

  // Dual Analysis Modes: Mode 1 (Técnica) vs Mode 2 (Biomecánica)
  const [analysisMode, setAnalysisMode] = useState<'technique' | 'biomechanics'>('technique');

  // Zoom & Pan & Lever Overlays State
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLeverArms, setShowLeverArms] = useState<boolean>(true);

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
  const smoothedTibialAngleRef = useRef<number>(14);

  // Finite State Machine (FSM) initialized with selected pattern
  const fsmRef = useRef<BiomechanicalFSM>(
    new BiomechanicalFSM({
      trackingMode: selectedPattern.trackingMode,
      lockoutThreshold: selectedPattern.standingThreshold,
      inflectionThreshold: selectedPattern.inflectionThreshold,
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

  // Re-initialize FSM when selectedPattern changes
  useEffect(() => {
    fsmRef.current = new BiomechanicalFSM({
      trackingMode: selectedPattern.trackingMode,
      lockoutThreshold: selectedPattern.standingThreshold,
      inflectionThreshold: selectedPattern.inflectionThreshold,
      hysteresisAngleBand: 8,
      velocityThresholdDegPerSec: 15,
      minPhaseDurationMs: 120,
      bounceThresholdMs: 160
    });
    poseSmootherRef.current.reset();
  }, [selectedPattern]);

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

    // Clear canvas before processing and drawing new frame to prevent ghosting/overlapping
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
          if (selectedPattern.primaryJoint === 'elbow') {
            smoothedAngle = calculateJointAngle(
              smoothedKeypoints['shoulder'],
              smoothedKeypoints['elbow'],
              smoothedKeypoints['wrist']
            );
          } else if (selectedPattern.primaryJoint === 'hip') {
            smoothedAngle = calculateJointAngle(
              smoothedKeypoints['shoulder'],
              smoothedKeypoints['hip'],
              smoothedKeypoints['knee']
            );
          } else if (selectedPattern.primaryJoint === 'shoulder') {
            smoothedAngle = calculateJointAngle(
              smoothedKeypoints['elbow'],
              smoothedKeypoints['shoulder'],
              smoothedKeypoints['hip']
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
              selectedPattern.name,
              targetMuscle === 'glutes_max' ? 'glutes' : targetMuscle === 'quadriceps' ? 'quads' : targetMuscle === 'hamstrings' ? 'hamstrings' : 'lats'
            );
            setAuditedReps(prev => [...prev, audit]);
            setRepCount(c => c + 1);
            setActiveAlerts(audit.techniqueVerdict.feedbackCues);
          }

          // Smooth tibial angle across frames with EMA filter (persistence 0.88)
          // Eliminates rapid jittering/flickering even at 0.25x playback speed
          const rawTibial = (smoothedKeypoints['ankle'] && smoothedKeypoints['knee'])
            ? calculateTibialAngle(smoothedKeypoints['ankle'], smoothedKeypoints['knee'])
            : 14;
          smoothedTibialAngleRef.current = 0.88 * smoothedTibialAngleRef.current + 0.12 * rawTibial;

          // 4. Biomechanical Physics Evaluation (Moment Arms, Line of Action, Muscle Bias)
          const resistanceParam: ResistanceSourceType =
            loadType === 'gravity' ? 'gravity' :
            loadType === 'cable' ? 'cable_mid' :
            'machine';
          const targetBiasParam = targetMuscle === 'glutes_max' ? 'glutes' : targetMuscle === 'quadriceps' ? 'quads' : targetMuscle === 'hamstrings' ? 'hamstrings' : 'lats';

          const telemetry = evaluateBiomechanicalFrame(
            smoothedKeypoints,
            selectedPattern.id,
            currentFsmPhase,
            smoothedAngle,
            angVelocity,
            resistanceParam,
            targetBiasParam as any,
            monotonicTime,
            smoothedTibialAngleRef.current
          );

          setCurrentPrimaryAngle(Math.round(smoothedAngle));
          setCurrentTelemetry(telemetry);
          setCurrentPhase(currentFsmPhase);

          // 5. Draw Dual Mode Canvas Overlay with Zoom, Pan & Levers
          drawDualModeOverlay(
            ctx,
            analysisMode,
            telemetry,
            smoothedKeypoints,
            canvas.width,
            canvas.height,
            analysisMode === 'biomechanics' ? '#EF4444' : '#10B981',
            {
              showLeverArms,
              zoom,
              panOffset,
              primaryJointKey: selectedPattern.primaryJoint,
              patternFamily: selectedPattern.patternFamily,
              targetMuscle: selectedPattern.targetMuscle,
              loadType,
              exerciseId: selectedPattern.id,
              useInternalCanvasTransform: false // Handled synchronously by parent DOM transform
            },
            selectedPattern.primaryJoint
          );
        }
      } else {
        // Clear canvas if no person/landmarks detected so old lines don't freeze
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch (e) {
      // Frame skip error protection
    }
  };

  // Continuous loop when recording or playing video
  useEffect(() => {
    const shouldRunLoop = isRecording || isVideoPlaying;
    if (!shouldRunLoop) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      isProcessingRef.current = false;
      return;
    }

    const processLoop = async () => {
      const video = videoElementRef.current;
      if (!isRecording && !isVideoPlaying) {
        isProcessingRef.current = false;
        return;
      }
      if (video && video.paused && !isRecording) {
        isProcessingRef.current = false;
        return;
      }

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
  }, [isRecording, isVideoPlaying, selectedPattern, analysisMode, targetMuscle, loadType, showLeverArms, zoom, panOffset]);

  // Re-render single frame when zoom, pan, or lever toggles change while paused
  useEffect(() => {
    if (!isRecording && !isVideoPlaying && (uploadedVideoUrl || useWebcam)) {
      processSingleFrame();
    }
  }, [zoom, panOffset, showLeverArms, analysisMode]);

  // When AI model is ready or video url changes, trigger initial frame detection
  useEffect(() => {
    if (aiModelStatus === 'ready' && (uploadedVideoUrl || useWebcam)) {
      const timer = setTimeout(() => {
        processSingleFrame();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [aiModelStatus, uploadedVideoUrl]);

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
      if (isRecording || isVideoPlaying) {
        videoElementRef.current.pause();
        setIsVideoPlaying(false);
        setIsRecording(false);
      } else {
        setIsRecording(true);
        videoElementRef.current.play().then(() => {
          setIsVideoPlaying(true);
        }).catch(() => {});
      }
    } else {
      setIsRecording(prev => !prev);
    }
  };

  // Mouse / Touch Dragging for Pan Controls when Zoom > 1x
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      const maxPan = 180 * (zoom - 1);
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches[0]) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches[0]) {
      const newX = e.touches[0].clientX - dragStartRef.current.x;
      const newY = e.touches[0].clientY - dragStartRef.current.y;
      const maxPan = 180 * (zoom - 1);
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY))
      });
    }
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
    setCurrentPrimaryAngle(selectedPattern.standingThreshold);
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
      exerciseId: selectedPattern.id,
      exerciseName: selectedPattern.name,
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
        minElbowAngle: selectedPattern.primaryJoint === 'elbow' ? r.techniqueVerdict.romReachedDegrees : undefined,
        minKneeAngle: selectedPattern.primaryJoint === 'knee' ? r.techniqueVerdict.romReachedDegrees : undefined,
        minHipAngle: selectedPattern.primaryJoint === 'hip' ? r.techniqueVerdict.romReachedDegrees : undefined,
        feedbackAlerts: r.techniqueVerdict.feedbackCues.map(c => ({
          ruleId: 'technique_audit',
          joint: selectedPattern.primaryJoint,
          measuredValue: r.techniqueVerdict.romReachedDegrees,
          expectedThreshold: selectedPattern.inflectionThreshold,
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

  // Real-time camera plane & applied biomechanical verdict
  const currentCameraPlane: CameraPlane = currentTelemetry
    ? detectCameraPlane(poseSmootherRef.current.getLastSmoothed())
    : 'sagittal';

  const meanHipMoment = currentTelemetry?.biomechanics.momentArms.hip ?? 0.35;
  const meanKneeMoment = currentTelemetry?.biomechanics.momentArms.knee ?? 0.22;
  const isInitialSetup = repCount === 0 && currentPhase === 'LOCKOUT';

  const rawVerdict = evaluateBiomechanicalVerdict(
    targetMuscle,
    meanHipMoment,
    meanKneeMoment,
    currentTelemetry?.biomechanics.tibialAngleDegrees ?? 14,
    currentTelemetry?.technique.spinalAngleDegrees ?? 20,
    75,
    currentTelemetry?.technique.isSpineNeutral ?? true
  );

  const currentVerdict = isInitialSetup
    ? {
        isOptimal: true,
        ratio: 1.0,
        verdictTitle: 'Posición Inicial: Esperando inicio de repetición',
        verdictDescription: 'Inicia el descenso controlado para evaluar la trayectoria de fuerza y los brazos de momento en máxima elongación.'
      }
    : rawVerdict;

  const hipRaw = currentTelemetry?.biomechanics.momentArms.hip ?? 0.35;
  const kneeRaw = currentTelemetry?.biomechanics.momentArms.knee ?? 0.22;
  const totalMoment = hipRaw + kneeRaw + 1e-5;
  const hipShare = isInitialSetup || (hipRaw + kneeRaw < 0.05)
    ? 50
    : Math.round((hipRaw / totalMoment) * 100);
  const kneeShare = 100 - hipShare;

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

        {/* Cascading Filter Hierarchy (Tipo de Carga -> Músculo Objetivo -> Patrón/Ejercicio) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-md">
          {/* 1. Tipo de Carga (Segmented Button) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                1. Tipo de Carga
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {loadType === 'gravity' ? 'Gravedad [0, 1]' : loadType === 'cable' ? 'Vector Polea' : 'Brazo de Palanca'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { key: 'gravity' as LoadType, label: 'Peso Libre (Gravedad)' },
                { key: 'cable' as LoadType, label: 'Polea / Cable' },
                { key: 'machine' as LoadType, label: 'Máquina / Palanca' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setLoadType(item.key)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center truncate transition-all ${
                    loadType === item.key
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Músculo Objetivo (Individual chips, NUNCA agrupar Glúteo con Femoral) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                2. Músculo Objetivo
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Chips independientes</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'quadriceps' as TargetMuscle, label: 'Cuádriceps' },
                { key: 'glutes_max' as TargetMuscle, label: 'Glúteo Mayor' },
                { key: 'hamstrings' as TargetMuscle, label: 'Isquiosurales' },
                { key: 'lats' as TargetMuscle, label: 'Dorsal' },
                { key: 'pectorals' as TargetMuscle, label: 'Pectoral' }
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setTargetMuscle(m.key);
                    const patterns = EXERCISE_PATTERNS.filter(p => p.targetMuscle === m.key);
                    if (patterns.length > 0) setSelectedPatternId(patterns[0].id);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    targetMuscle === m.key
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/25'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Patrón / Ejercicio Dependiente */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                3. Patrón / Ejercicio
              </span>
              <span className="text-[10px] text-blue-300 font-mono">
                {selectedPattern.targetRatioDescription}
              </span>
            </div>
            <select
              value={selectedPattern.id}
              onChange={e => setSelectedPatternId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500 transition"
            >
              {availablePatterns.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 pl-1">
              {selectedPattern.description}
            </p>
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
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className={`relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {/* Viewport Zoom & Levers Toolbar */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-40 bg-black/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center gap-0.5 border-r border-slate-700/80 pr-1 mr-0.5">
              {[1, 1.5, 2].map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    setZoom(z);
                    if (z === 1) setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                    zoom === z ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Zoom ${z}x`}
                >
                  {z}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowLeverArms(prev => !prev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                showLeverArms
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={showLeverArms ? 'Ocultar líneas de palancas' : 'Mostrar líneas de palancas'}
            >
              <Sliders className="w-3 h-3" />
              <span>{showLeverArms ? 'Palancas ON' : 'Palancas OFF'}</span>
            </button>
          </div>

          {/* Synchronized Zoom & Pan Transform Viewport for BOTH Video & Analysis Overlay */}
          <div
            className="w-full h-full relative flex items-center justify-center transition-transform duration-75 origin-center will-change-transform"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`
            }}
          >
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
              onPause={() => {
                setIsVideoPlaying(false);
                setTimeout(() => processSingleFrame(), 20);
              }}
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
              <div className="text-center space-y-2 p-4 z-10 pointer-events-none">
                <Video className="w-12 h-12 text-cyan-400/60 mx-auto animate-pulse" />
                <p className="text-xs text-slate-300 font-semibold max-w-xs">
                  Sube tu vídeo de sentadilla búlgara, RDL, press o dominada para evaluar los brazos de palanca y sesgo muscular.
                </p>
                <p className="text-[11px] text-slate-500">
                  MediaPipe + OneEuroFilter estabilizan la señal sin jitter y calculan d_cadera vs d_rodilla.
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
          </div>

          {/* Real-Time Telemetry HUD Overlays */}
          {(isRecording || isVideoPlaying || (uploadedVideoUrl && currentTelemetry)) && (
            <>
              {/* Primary Joint Angle Gauge */}
              <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 z-30 shadow-lg">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Ángulo {selectedPattern.primaryJoint === 'elbow' ? 'de Codo' : selectedPattern.primaryJoint === 'hip' ? 'de Cadera' : selectedPattern.primaryJoint === 'shoulder' ? 'de Hombro' : 'de Rodilla'}
                  </div>
                  <div className="font-mono text-sm font-black text-white">
                    {currentPrimaryAngle}° <span className="text-[10px] text-cyan-400 font-sans font-bold">({currentPhase})</span>
                  </div>
                </div>
              </div>

              {/* Rep Count HUD */}
              <div className="absolute bottom-12 right-3 bg-black/85 backdrop-blur-md border border-blue-500/50 rounded-xl px-3.5 py-1.5 text-right z-30 shadow-lg">
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
                      {currentTelemetry?.technique.isSpineNeutral ? 'Columna Neutra' : 'Quiebre Curvatura'}
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

            {/* Active Feedback Alerts & Real-time Pattern Biomechanical Audit */}
            {((currentTelemetry?.technique.alerts && currentTelemetry.technique.alerts.length > 0) || activeAlerts.length > 0) && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Auditoría Técnica en Tiempo Real ({selectedPattern.name})
                </span>

                {/* Specific Real-Time Rule Alerts */}
                {currentTelemetry?.technique.alerts?.map((alert, i) => (
                  <div
                    key={`realtime-${alert.code}-${i}`}
                    className={`p-2 rounded-xl text-xs flex items-start gap-2 border ${
                      alert.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {alert.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <span className="font-semibold block">{alert.message}</span>
                      <span className="text-[10px] opacity-60 font-mono">[{alert.code}]</span>
                    </div>
                  </div>
                ))}

                {/* Completed Repetition Cues */}
                {activeAlerts.map((msg, i) => {
                  const isSuccess = msg.startsWith('✓') || msg.startsWith('★');
                  return (
                    <div
                      key={`hist-${i}`}
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
            {/* Direct Biomechanical Applied Verdict */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${currentVerdict.isOptimal ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <h4 className="text-xs font-black text-white">{currentVerdict.verdictTitle}</h4>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {currentVerdict.verdictDescription}
                </p>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                currentVerdict.isOptimal
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {currentVerdict.isOptimal ? 'ÓPTIMO' : 'AJUSTAR'}
              </span>
            </div>

            {/* Muscle Dominance Comparison Bar (Cadera vs Rodilla) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Cadera (Glúteo): {hipShare}% ({Math.round(currentTelemetry.biomechanics.momentArms.hip * 640)}px)
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  Rodilla (Cuádriceps): {kneeShare}% ({Math.round(currentTelemetry.biomechanics.momentArms.knee * 640)}px)
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div className="bg-blue-500 transition-all duration-100" style={{ width: `${hipShare}%` }} />
                <div className="bg-emerald-500 transition-all duration-100" style={{ width: `${kneeShare}%` }} />
              </div>
            </div>

            {/* High-density Physical Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Inclinación Tibial</span>
                <span className="text-xs font-black text-cyan-300 font-mono">
                  {currentTelemetry.biomechanics.tibialAngleDegrees}°
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {currentTelemetry.biomechanics.tibialAngleDegrees <= 18 ? 'Vertical (Glúteo)' : 'Avance (Cuádriceps)'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Plano de Grabación</span>
                <span className="text-xs font-black text-purple-300 font-mono">
                  {currentCameraPlane === 'sagittal' ? 'Sagital (Perfil)' : currentCameraPlane === 'frontal' ? 'Frontal' : 'Oblicuo'}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {currentCameraPlane === 'sagittal' ? 'Valgo no aplicable' : 'Valgo frontal'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Columna / Curvatura</span>
                <span className={`text-xs font-black font-mono block ${
                  currentTelemetry.technique.isSpineNeutral ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {currentTelemetry.technique.isSpineNeutral ? '✓ Neutra' : '⚡ Quiebre (>15°)'}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {currentTelemetry.technique.spinalAngleDegrees}° inclinación
                </span>
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
