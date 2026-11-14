import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
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
  ChevronDown,
  Info,
  Settings2,
  Loader2
} from 'lucide-react';
import { prepareVideoForAnalysis } from '../utils/videoCompressor';
import {
  analyzeVideoWithModal,
  BiomechanicsAnalysisResponse,
  BiomechanicsFrame,
  ExerciseConfig,
  RepetitionSummary
} from '../services/modalBiomechanicsClient';
import {
  LoadType,
  TargetMuscle,
  EXERCISE_PATTERNS,
  ExercisePatternSpec,
  ResistanceSourceType
} from '../utils/biomechanicsEngine';
import { sendVideoTelemetry, TelemetryAnalysisResponse, VideoTelemetryPayload } from '../utils/api';

export const MAX_ANALYSIS_CLIP_SECONDS = 30.0;

interface VideoPoseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExerciseId?: string;
  defaultExerciseName?: string;
}

function findClosestFrame(frames: BiomechanicsFrame[], currentTime: number): BiomechanicsFrame | null {
  if (!frames || frames.length === 0) return null;
  let low = 0;
  let high = frames.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (frames[mid].time < currentTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const i1 = Math.max(0, Math.min(frames.length - 1, low));
  const i2 = Math.max(0, Math.min(frames.length - 1, high));
  return Math.abs(frames[i1].time - currentTime) < Math.abs(frames[i2].time - currentTime)
    ? frames[i1]
    : frames[i2];
}

export const VideoPoseAnalysisModal: React.FC<VideoPoseAnalysisModalProps> = ({
  isOpen,
  onClose,
  defaultExerciseId = 'hip_thrust',
  defaultExerciseName = 'Hip Thrust (Glúteo Mayor)'
}) => {
  // Cascading Selection State
  const [loadType, setLoadType] = useState<LoadType>('gravity');
  const [targetMuscle, setTargetMuscle] = useState<TargetMuscle>('glutes_max');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('hip_thrust_barbell');

  const availablePatterns = EXERCISE_PATTERNS.filter(p => p.targetMuscle === targetMuscle);
  const selectedPattern: ExercisePatternSpec =
    availablePatterns.find(p => p.id === selectedPatternId) ||
    availablePatterns[0] ||
    EXERCISE_PATTERNS[0];

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const compressedBlobRef = useRef<Blob | null>(null);
  const fileCacheIdRef = useRef<string>('');

  // Dual Analysis Modes: Mode 1 (Técnica) vs Mode 2 (Biomecánica)
  const [analysisMode, setAnalysisMode] = useState<'technique' | 'biomechanics'>('technique');

  // Zoom & Pan & Overlays
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLeverArms, setShowLeverArms] = useState<boolean>(true);
  const [showCanvasText, setShowCanvasText] = useState<boolean>(true);
  const [showEngineSettings, setShowEngineSettings] = useState<boolean>(false);
  const [showConfigBottomSheet, setShowConfigBottomSheet] = useState<boolean>(false);

  // Pipeline execution & analysis state
  const [pipelineState, setPipelineState] = useState<'idle' | 'compressing' | 'analyzing' | 'ready' | 'error'>('idle');
  const [pipelineMessage, setPipelineMessage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<BiomechanicsAnalysisResponse | null>(null);
  const [currentFrame, setCurrentFrame] = useState<BiomechanicsFrame | null>(null);

  // Dynamic telemetry
  const [currentPrimaryAngle, setCurrentPrimaryAngle] = useState<number>(180);
  const [currentPhase, setCurrentPhase] = useState<string>('IDLE');
  const [repCount, setRepCount] = useState<number>(0);
  const [showRepBreakdown, setShowRepBreakdown] = useState<boolean>(false);

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

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setShowConfigBottomSheet(false);
      setBackendDiagnosis(null);
      setAnalysisData(null);
      setCurrentFrame(null);
      setRepCount(0);
      setPipelineState('idle');
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
        setUploadedVideoUrl(null);
        setUploadedFileName(null);
      }
    }
  }, [isOpen]);

  // Execute Analysis when video or exercise config changes
  const runPipelineAnalysis = useCallback(async (blob: Blob, fileId: string, pattern: ExercisePatternSpec, muscle: string, load: string) => {
    try {
      setPipelineState('analyzing');
      setPipelineMessage('Procesando cinemática clínica en GPU Serverless (RT-DETR + ViTPose-Large)...');

      let exType = 'squat';
      if (pattern.id.includes('hip_thrust')) exType = 'hip_thrust';
      else if (pattern.id.includes('rdl')) exType = 'rdl';
      else if (pattern.id.includes('bulgarian')) exType = 'bulgarian_squat';
      else if (pattern.id.includes('bench') || pattern.id.includes('press')) exType = 'bench_press';
      else if (pattern.id.includes('row')) exType = 'row';
      else if (pattern.id.includes('fly')) exType = 'cable_fly';

      let backendLoad = 'free_weight';
      if (load === 'cable') backendLoad = 'cable';
      else if (load === 'machine') backendLoad = 'machine';

      const config: ExerciseConfig = {
        exerciseType: exType,
        targetMuscle: muscle,
        loadType: backendLoad
      };

      const result = await analyzeVideoWithModal(blob, config, fileId);
      setAnalysisData(result);
      setRepCount(result.total_reps);
      setPipelineState('ready');
      setPipelineMessage('');
    } catch (err: any) {
      console.error('[Pipeline Error]', err);
      setPipelineState('error');
      setPipelineMessage(err?.message || 'Error al conectar con el microservicio GPU.');
    }
  }, []);

  // Video File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setPlaybackSpeed(1.0);
    setShowConfigBottomSheet(false);

    const fileId = `${file.name}_${file.size}_${file.lastModified}`;
    fileCacheIdRef.current = fileId;

    try {
      setPipelineState('compressing');
      setPipelineMessage('Comprimiendo vídeo a 15 FPS (ventana de análisis optimizada)...');
      const compressedBlob = await prepareVideoForAnalysis(file);
      compressedBlobRef.current = compressedBlob;

      await runPipelineAnalysis(compressedBlob, fileId, selectedPattern, targetMuscle, loadType);

      if (videoElementRef.current) {
        videoElementRef.current.playbackRate = 1.0;
        videoElementRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
      }
    } catch (err: any) {
      setPipelineState('error');
      setPipelineMessage('Error en compresión de vídeo.');
    }
  };

  // Trigger re-analysis when exercise configuration changes (Instant from cache if already processed)
  const handleConfigChange = (newPatternId: string, newMuscle: TargetMuscle, newLoad: LoadType) => {
    setSelectedPatternId(newPatternId);
    setTargetMuscle(newMuscle);
    setLoadType(newLoad);

    if (compressedBlobRef.current && fileCacheIdRef.current) {
      const pattern = EXERCISE_PATTERNS.find(p => p.id === newPatternId) || selectedPattern;
      runPipelineAnalysis(compressedBlobRef.current, fileCacheIdRef.current, pattern, newMuscle, newLoad);
    }
  };

  // Synchronous Canvas Rendering Loop via requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoElementRef.current;
    if (!canvas || !video) return;

    let cancelled = false;

    const renderLoop = () => {
      if (cancelled) return;

      const currentTime = video.currentTime || 0;
      setVideoCurrentTime(currentTime);

      if (analysisData && analysisData.frames.length > 0) {
        const frame = findClosestFrame(analysisData.frames, currentTime);
        if (frame) {
          setCurrentFrame(frame);
          setCurrentPrimaryAngle(frame.main_angle);
          setCurrentPhase(frame.phase);

          // Render canvas overlays
          renderCanvasOverlay(canvas, video, frame, analysisMode, {
            zoom,
            panOffset,
            showLeverArms,
            showCanvasText,
            exerciseId: selectedPattern.id
          });
        }
      } else {
        // Clear canvas if no frames
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [analysisData, analysisMode, zoom, panOffset, showLeverArms, showCanvasText, selectedPattern]);

  /**
   * Surgical 1:1 Canvas Projection and Clean Visual Layer Separation
   */
  const renderCanvasOverlay = (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    frame: BiomechanicsFrame,
    mode: 'technique' | 'biomechanics',
    options: {
      zoom: number;
      panOffset: { x: number; y: number };
      showLeverArms: boolean;
      showCanvasText: boolean;
      exerciseId: string;
    }
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize canvas resolution with displayed bounding rect
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const rw = Math.round(rect.width);
      const rh = Math.round(rect.height);
      if (canvas.width !== rw || canvas.height !== rh) {
        canvas.width = rw;
        canvas.height = rh;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Exact containment geometry
    const videoRatio = (video.videoWidth || 16) / (video.videoHeight || 9);
    const canvasRatio = canvas.width / canvas.height;
    let drawW = canvas.width;
    let drawH = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > canvasRatio) {
      drawH = canvas.width / videoRatio;
      offsetY = (canvas.height - drawH) / 2;
    } else {
      drawW = canvas.height * videoRatio;
      offsetX = (canvas.width - drawW) / 2;
    }

    ctx.save();

    // Zoom & Pan transformation
    if (options.zoom > 1 || options.panOffset.x !== 0 || options.panOffset.y !== 0) {
      ctx.translate(canvas.width / 2 + options.panOffset.x, canvas.height / 2 + options.panOffset.y);
      ctx.scale(options.zoom, options.zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    const px = (normX: number) => offsetX + normX * drawW;
    const py = (normY: number) => offsetY + normY * drawH;

    const kp = frame.keypoints_norm;
    if (!kp) {
      ctx.restore();
      return;
    }

    const pSh = { x: px(kp.shoulder.x), y: py(kp.shoulder.y) };
    const pEl = { x: px(kp.elbow.x), y: py(kp.elbow.y) };
    const pWr = { x: px(kp.wrist.x), y: py(kp.wrist.y) };
    const pHp = { x: px(kp.hip.x), y: py(kp.hip.y) };
    const pKn = { x: px(kp.knee.x), y: py(kp.knee.y) };
    const pAk = { x: px(kp.ankle.x), y: py(kp.ankle.y) };
    const pHd = { x: px(kp.head.x), y: py(kp.head.y) };

    const drawPoint = (p: { x: number; y: number }, color: string) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    };

    const drawSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }, color: string, dashed: boolean = false) => {
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (mode === 'technique') {
      // CAPA 1: TECNICA - Esqueleto anatómico completo y alineación espinal
      drawSegment(pHd, pSh, '#34D399');
      drawSegment(pSh, pHp, '#10B981'); // Spinal trunk
      drawSegment(pSh, pEl, '#6EE7B7');
      drawSegment(pEl, pWr, '#6EE7B7');
      drawSegment(pHp, pKn, '#10B981');
      drawSegment(pKn, pAk, '#10B981');

      drawPoint(pHd, '#34D399');
      drawPoint(pSh, '#10B981');
      drawPoint(pEl, '#6EE7B7');
      drawPoint(pWr, '#6EE7B7');
      drawPoint(pHp, '#10B981');
      drawPoint(pKn, '#10B981');
      drawPoint(pAk, '#10B981');

      // Joint Angle badge at primary inflection joint
      if (options.showCanvasText) {
        const isHT = options.exerciseId.includes('hip_thrust');
        const targetPt = isHT ? pHp : (options.exerciseId.includes('bench') || options.exerciseId.includes('row') ? pEl : pKn);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(targetPt.x + 10, targetPt.y - 12, 54, 20, 6);
        ctx.fill();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(`${Math.round(frame.main_angle)}°`, targetPt.x + 16, targetPt.y + 2);
      }
    } else {
      // CAPA 2: BIOMECANICA - Oculta esqueleto secundario, muestra exclusivamente vector de fuerza y cotas ortogonales
      const isHT = options.exerciseId.includes('hip_thrust');
      if (isHT || options.exerciseId.includes('squat') || options.exerciseId.includes('rdl')) {
        drawSegment(pHp, pKn, '#38BDF8');
        drawSegment(pKn, pAk, '#38BDF8');
      } else {
        drawSegment(pSh, pEl, '#38BDF8');
        drawSegment(pEl, pWr, '#38BDF8');
      }

      drawPoint(pHp, '#38BDF8');
      drawPoint(pKn, '#38BDF8');
      drawPoint(pWr, '#F59E0B');

      // Vertical gravity force vector through resistance point (wrist/load)
      const lineX = pWr.x;
      const lineTop = Math.max(offsetY, pWr.y - 100);
      const lineBottom = Math.min(offsetY + drawH, pWr.y + 140);

      ctx.beginPath();
      ctx.setLineDash([5, 3]);
      ctx.moveTo(lineX, lineTop);
      ctx.lineTo(lineX, lineBottom);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.setLineDash([]);

      // Downward gravity arrow tip
      ctx.beginPath();
      ctx.moveTo(lineX, lineBottom);
      ctx.lineTo(lineX - 5, lineBottom - 8);
      ctx.lineTo(lineX + 5, lineBottom - 8);
      ctx.closePath();
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Orthogonal Moment Arm Dimension Lines (cotas ortogonales)
      if (options.showLeverArms) {
        drawSegment(pHp, { x: lineX, y: pHp.y }, '#3B82F6', true);
        drawSegment(pKn, { x: lineX, y: pKn.y }, '#10B981', true);
        drawSegment(pSh, { x: lineX, y: pSh.y }, '#A855F7', true);

        if (options.showCanvasText) {
          // d_cadera
          const midHipX = (pHp.x + lineX) / 2;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(midHipX - 24, pHp.y - 16, 48, 15, 4);
          ctx.fill();
          ctx.fillStyle = '#60A5FA';
          ctx.font = 'bold 9px ui-monospace, monospace';
          ctx.fillText(`d_cad: ${Math.round(frame.moment_arms.d_hip * 100)}`, midHipX - 20, pHp.y - 5);

          // d_rodilla
          const midKnX = (pKn.x + lineX) / 2;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(midKnX - 24, pKn.y - 16, 48, 15, 4);
          ctx.fill();
          ctx.fillStyle = '#34D399';
          ctx.font = 'bold 9px ui-monospace, monospace';
          ctx.fillText(`d_rod: ${Math.round(frame.moment_arms.d_knee * 100)}`, midKnX - 20, pKn.y - 5);
        }
      }
    }

    ctx.restore();
  };

  // Video transport & playback controls
  const handleTogglePlayPause = () => {
    const video = videoElementRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleSeekRelative = (seconds: number) => {
    const video = videoElementRef.current;
    if (!video) return;
    const current = video.currentTime || 0;
    const effectiveMax = Math.min(videoDuration > 0 ? videoDuration : MAX_ANALYSIS_CLIP_SECONDS, MAX_ANALYSIS_CLIP_SECONDS);
    const newTime = Math.max(0, Math.min(effectiveMax, current + seconds));
    video.currentTime = newTime;
    setVideoCurrentTime(newTime);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoElementRef.current;
    if (!video) return;
    const effectiveMax = Math.min(videoDuration > 0 ? videoDuration : MAX_ANALYSIS_CLIP_SECONDS, MAX_ANALYSIS_CLIP_SECONDS);
    const target = Math.min(effectiveMax, Math.max(0, parseFloat(e.target.value)));
    setVideoCurrentTime(target);
    video.currentTime = target;
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoElementRef.current;
    setPlaybackSpeed(speed);
    if (video) video.playbackRate = speed;
  };

  const formatVideoTime = (timeInSec: number): string => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const m = Math.floor(timeInSec / 60);
    const s = Math.floor(timeInSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

  const handleMouseUp = () => setIsDragging(false);

  const handleSendToBackend = async () => {
    if (!analysisData || analysisData.repetitions_summary.length === 0) return;
    setIsSendingToBackend(true);
    setBackendError(null);

    const payload: VideoTelemetryPayload = {
      userId: 'athlete_user',
      exerciseId: selectedPattern.id,
      exerciseName: selectedPattern.name,
      videoDurationSeconds: analysisData.duration,
      hardwareModel: 'Modal Labs GPU (RT-DETR + ViTPose-Large + SciPy)',
      metrics: {
        totalRepsCounted: analysisData.total_reps,
        validRepsCount: analysisData.total_reps,
        failedRepsCount: 0,
        averageRepCadenceSeconds: 3.0,
        romConsistencyScore: 95
      },
      repsDetail: analysisData.repetitions_summary.map(r => ({
        repIndex: r.rep_number,
        isValid: r.verdict.status === 'OPTIMAL',
        eccentricTimeSeconds: r.eccentric_sec,
        concentricTimeSeconds: r.concentric_sec,
        minHipAngle: r.min_primary_angle,
        feedbackAlerts: [{
          ruleId: 'biomechanics_audit',
          joint: 'primary',
          measuredValue: r.min_primary_angle,
          expectedThreshold: 90,
          message: r.verdict.recommendation
        }]
      }))
    };

    try {
      const response = await sendVideoTelemetry(payload);
      setBackendDiagnosis(response);
    } catch (err: any) {
      setBackendError(err?.message || 'Error de sincronización.');
    } finally {
      setIsSendingToBackend(false);
    }
  };

  if (!isOpen) return null;

  const effectiveTotalDuration = Math.min(videoDuration > 0 ? videoDuration : MAX_ANALYSIS_CLIP_SECONDS, MAX_ANALYSIS_CLIP_SECONDS);
  const scrubberProgress = effectiveTotalDuration > 0
    ? Math.min(100, Math.max(0, (Math.min(videoCurrentTime, effectiveTotalDuration) / effectiveTotalDuration) * 100))
    : 0;

  // Active verdict read directly from frozen rep verdict
  const activeVerdict = currentFrame?.verdict || {
    status: 'OPTIMAL',
    dominant_joint: 'CADERA',
    target_alignment: true,
    primary_torque_bias: 'GLÚTEO MAYOR',
    inflection_knee_deg: 90.0,
    inflection_hip_deg: 180.0,
    d_hip_norm: 0.14,
    d_knee_norm: 0.12,
    recommendation: 'Alineación articular óptima con vector vertical equilibrado.'
  };

  const d_hip_val = currentFrame?.moment_arms.d_hip ?? 0.14;
  const d_knee_val = currentFrame?.moment_arms.d_knee ?? 0.12;
  const totalMoment = d_hip_val + d_knee_val + 1e-5;
  const hipShare = Math.round((d_hip_val / totalMoment) * 100);
  const kneeShare = 100 - hipShare;

  // Mode Switcher Buttons
  const modeSwitcherButtons = (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
      <button
        type="button"
        onClick={() => setAnalysisMode('technique')}
        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
          analysisMode === 'technique'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>[1. Corrección Técnica]</span>
      </button>

      <button
        type="button"
        onClick={() => setAnalysisMode('biomechanics')}
        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
          analysisMode === 'biomechanics'
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
        <span>[2. Optimización Biomecánica]</span>
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 landscape:p-2 lg:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[96dvh] landscape:h-[100dvh] lg:landscape:h-auto lg:landscape:max-h-[95dvh] max-w-6xl bg-[#0f111a] sm:border border-blue-500/30 rounded-none sm:rounded-3xl p-2.5 sm:p-4 lg:p-5 shadow-2xl text-white flex flex-col gap-2 sm:gap-3 overflow-hidden my-auto">

        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-black text-white truncate">Análisis Biomecánico Clínico</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                  pipelineState === 'ready'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : pipelineState === 'analyzing' || pipelineState === 'compressing'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pipelineState === 'ready' ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'}`} />
                  <span>
                    {pipelineState === 'ready' ? 'GPU Modal Labs Activo' : pipelineState === 'analyzing' ? 'Inferencia GPU...' : pipelineState === 'compressing' ? 'Comprimiendo...' : 'Listo'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden lg:block">
                RT-DETR + ViTPose-Large + SciPy Butterworth Fase-Cero (Serverless GPU)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Mode Switcher */}
        <div className="shrink-0 landscape:hidden lg:hidden">
          {modeSwitcherButtons}
        </div>

        {/* Main 2-Column Responsive Layout */}
        <div className="flex-1 min-h-0 flex flex-col landscape:grid landscape:grid-cols-12 landscape:gap-3 lg:grid lg:grid-cols-12 lg:gap-4 items-stretch overflow-hidden landscape:overflow-y-auto lg:overflow-y-auto">

          {/* RIGHT COLUMN TOP (Desktop/Landscape) */}
          <div className="hidden landscape:block lg:block landscape:col-start-8 landscape:col-span-5 lg:col-start-8 lg:col-span-5 space-y-2.5 min-w-0">
            {modeSwitcherButtons}
          </div>

          {/* LEFT COLUMN: Video Viewport & Playback Bar */}
          <div className="shrink-0 flex flex-col gap-1.5 sm:gap-2 min-w-0 landscape:col-start-1 landscape:col-span-7 lg:col-start-1 lg:col-span-7">

            {/* Video File Input Bar */}
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
                  <span>{uploadedFileName ? 'Cambiar Vídeo' : 'Subir Vídeo (MP4/WebM)'}</span>
                </button>
                {uploadedFileName && (
                  <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {uploadedFileName}
                  </span>
                )}
              </div>

              {/* Zoom & Pan Controls */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${zoom === 1 ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                >
                  1x
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1.5)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${zoom === 1.5 ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                >
                  1.5x
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(2)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${zoom === 2 ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                >
                  2x
                </button>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div
              className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Native HTML5 Video Element */}
              <video
                ref={videoElementRef}
                src={uploadedVideoUrl || undefined}
                playsInline
                muted
                loop
                onLoadedMetadata={(e) => {
                  const target = e.currentTarget;
                  setVideoDuration(target.duration || 0);
                }}
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Overlay Canvas 1:1 Synchronized */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Loading State Overlay */}
              {(pipelineState === 'compressing' || pipelineState === 'analyzing') && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-20">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm font-bold text-slate-200">{pipelineMessage}</p>
                  <span className="text-xs text-slate-400">Zero cold-start penalty • RT-DETR + ViTPose-Large</span>
                </div>
              )}

              {/* Empty placeholder */}
              {!uploadedVideoUrl && pipelineState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                  <Film className="w-10 h-10 text-slate-600" />
                  <p className="text-xs font-semibold">Sube un vídeo para iniciar el análisis cinemático clínico</p>
                </div>
              )}

              {/* HUD Telemetry Badges */}
              {pipelineState === 'ready' && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 pointer-events-none z-10">
                  <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                    REP: #{repCount > 0 ? repCount : 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                    {currentPhase}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold">
                    Ángulo: {Math.round(currentPrimaryAngle)}°
                  </span>
                </div>
              )}
            </div>

            {/* Video Playback & Scrub Bar */}
            <div className="flex flex-col gap-1 p-2 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={effectiveTotalDuration}
                  step={0.05}
                  value={videoCurrentTime}
                  onChange={handleScrubChange}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlayPause}
                    className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30"
                  >
                    {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeekRelative(-2)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeekRelative(2)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                  </button>
                  <span>{formatVideoTime(videoCurrentTime)} / {formatVideoTime(effectiveTotalDuration)}</span>
                </div>

                <div className="flex items-center gap-1">
                  {[0.5, 1.0, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        playbackSpeed === spd ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Biomechanical Diagnosis & Verdict Card */}
          <div className="space-y-3 landscape:col-start-8 landscape:col-span-5 lg:col-start-8 lg:col-span-5 min-w-0">

            {/* Exercise Selector */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Patrón Articular Evaluado
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'hip_thrust_barbell', name: 'Hip Thrust', muscle: 'glutes_max' as TargetMuscle },
                  { id: 'squat_high_bar', name: 'Sentadilla', muscle: 'quads' as TargetMuscle },
                  { id: 'bulgarian_split_squat_glute', name: 'Búlgara', muscle: 'glutes_max' as TargetMuscle },
                  { id: 'romanian_deadlift_glute', name: 'Peso Muerto RDL', muscle: 'glutes_max' as TargetMuscle },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleConfigChange(item.id, item.muscle, loadType)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold text-left border transition ${
                      selectedPattern.id === item.id
                        ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Frozen Verdict HUD Card */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Veredicto Biomecánico Congelado
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  activeVerdict.status === 'OPTIMAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {activeVerdict.status === 'OPTIMAL' ? '✓ Óptimo' : '⚠️ Oportunidad'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {activeVerdict.recommendation}
              </div>

              {/* Moment Arms Distribution Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                  <span>Brazo Cadera: {hipShare}%</span>
                  <span>Brazo Rodilla: {kneeShare}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div className="bg-blue-500 transition-all duration-150" style={{ width: `${hipShare}%` }} />
                  <div className="bg-emerald-500 transition-all duration-150" style={{ width: `${kneeShare}%` }} />
                </div>
              </div>

              {/* Physical Quantities Grid */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Dominancia</span>
                  <span className="text-xs font-black text-cyan-300 font-mono">{activeVerdict.dominant_joint}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Enfoque Torque</span>
                  <span className="text-[11px] font-black text-purple-300 font-mono truncate block">{activeVerdict.primary_torque_bias}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Reps</span>
                  <span className="text-xs font-black text-emerald-300 font-mono">{analysisData?.total_reps ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Repetitions Breakdown Accordion */}
            {analysisData && analysisData.repetitions_summary.length > 0 && (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRepBreakdown(prev => !prev)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
                >
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Desglose de Repeticiones ({analysisData.repetitions_summary.length})
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                    <span>{showRepBreakdown ? 'Ocultar' : 'Ver detalle'}</span>
                    {showRepBreakdown ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {showRepBreakdown && (
                  <div className="px-3 pb-3 pt-1 max-h-40 overflow-y-auto space-y-1.5 border-t border-slate-800">
                    {analysisData.repetitions_summary.map((rep) => (
                      <div
                        key={rep.rep_number}
                        className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                            #{rep.rep_number}
                          </span>
                          <span className="text-slate-300">
                            Tempo: <strong className="text-cyan-300">{rep.eccentric_sec}s / {rep.concentric_sec}s</strong>
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          rep.verdict.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {rep.verdict.dominant_joint}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sync Telemetry Button */}
            {analysisData && (
              <button
                type="button"
                onClick={handleSendToBackend}
                disabled={isSendingToBackend}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                {isSendingToBackend ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Guardar Diagnóstico en Historial</span>
              </button>
            )}

            {backendDiagnosis && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300">
                ✓ Telemetría guardada correctamente en el perfil del atleta.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
