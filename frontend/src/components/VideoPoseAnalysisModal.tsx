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

export interface ExerciseItem {
  id: string;
  name: string;
  exerciseType: string;
  targetMuscle: TargetMuscle;
  loadType: LoadType;
  patternId: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  exercises: ExerciseItem[];
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: 'glutes_hamstrings',
    name: 'Glúteo e Isquios',
    exercises: [
      { id: 'hip_thrust', name: 'Hip Thrust', exerciseType: 'hip_thrust', targetMuscle: 'glutes_max', loadType: 'gravity', patternId: 'hip_thrust_barbell' },
      { id: 'rdl', name: 'Peso Muerto Rumano', exerciseType: 'rdl', targetMuscle: 'hamstrings', loadType: 'gravity', patternId: 'rdl_strict_hamstring' },
      { id: 'hamstring_curl', name: 'Curl Femoral', exerciseType: 'hamstring_curl', targetMuscle: 'hamstrings', loadType: 'machine', patternId: 'seated_leg_curl_machine' }
    ]
  },
  {
    id: 'quads',
    name: 'Cuádriceps',
    exercises: [
      { id: 'squat', name: 'Sentadilla Libre', exerciseType: 'squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'squat_high_bar' },
      { id: 'leg_press', name: 'Prensa', exerciseType: 'leg_press', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'leg_press_high_feet' },
      { id: 'bulgarian_squat', name: 'Zancada Búlgara', exerciseType: 'bulgarian_squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'bulgarian_split_squat_glute' }
    ]
  },
  {
    id: 'back',
    name: 'Espalda',
    exercises: [
      { id: 'barbell_row', name: 'Remo con Barra', exerciseType: 'barbell_row', targetMuscle: 'lats', loadType: 'gravity', patternId: 'chest_supported_lat_row' },
      { id: 'lat_pulldown', name: 'Jalón al Pecho', exerciseType: 'lat_pulldown', targetMuscle: 'lats', loadType: 'cable', patternId: 'lat_pulldown_unilateral' }
    ]
  },
  {
    id: 'chest',
    name: 'Pecho',
    exercises: [
      { id: 'bench_press', name: 'Press Banca', exerciseType: 'bench_press', targetMuscle: 'pectorals', loadType: 'gravity', patternId: 'converging_chest_press_machine' },
      { id: 'cable_fly', name: 'Aperturas en Polea', exerciseType: 'cable_fly', targetMuscle: 'pectorals', loadType: 'cable', patternId: 'cable_fly_mid_sternal' }
    ]
  },
  {
    id: 'shoulders',
    name: 'Hombro',
    exercises: [
      { id: 'overhead_press', name: 'Press Militar', exerciseType: 'overhead_press', targetMuscle: 'upper_back', loadType: 'gravity', patternId: 'incline_dumbbell_press' },
      { id: 'lateral_raise', name: 'Elevaciones Laterales', exerciseType: 'lateral_raise', targetMuscle: 'upper_back', loadType: 'cable', patternId: 'straight_arm_cable_pulldown' }
    ]
  },
  {
    id: 'arms',
    name: 'Brazos',
    exercises: [
      { id: 'biceps_curl', name: 'Curl Bíceps', exerciseType: 'biceps_curl', targetMuscle: 'biceps', loadType: 'cable', patternId: 'biceps_curl_cable' },
      { id: 'triceps_extension', name: 'Extensión Tríceps', exerciseType: 'triceps_extension', targetMuscle: 'triceps', loadType: 'cable', patternId: 'triceps_pushdown_cable' }
    ]
  }
];

export const ALL_EXERCISES: ExerciseItem[] = MUSCLE_GROUPS.flatMap(g => g.exercises);

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
  // Cascading Selection State & Catalog Mapping
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string>('glutes_hamstrings');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(defaultExerciseId);

  const activeMuscleGroup = MUSCLE_GROUPS.find(g => g.id === selectedMuscleGroupId) || MUSCLE_GROUPS[0];
  const activeExercise = ALL_EXERCISES.find(e => e.id === selectedExerciseId) || ALL_EXERCISES[0];

  const selectedPattern: ExercisePatternSpec =
    EXERCISE_PATTERNS.find(p => p.id === activeExercise.patternId) ||
    EXERCISE_PATTERNS[0];

  const [loadType, setLoadType] = useState<LoadType>(activeExercise.loadType);
  const [targetMuscle, setTargetMuscle] = useState<TargetMuscle>(activeExercise.targetMuscle);

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const compressedBlobRef = useRef<Blob | null>(null);
  const fileCacheIdRef = useRef<string>('');
  const uploadedFileRef = useRef<File | null>(null);

  // Range Trimmer State
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(15);
  const [showTrimmer, setShowTrimmer] = useState<boolean>(false);

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
  const runPipelineAnalysis = useCallback(async (
    blob: Blob,
    fileId: string,
    exType: string,
    muscle: string,
    load: string,
    range?: { startTime: number; endTime: number }
  ) => {
    try {
      setPipelineState('analyzing');
      setPipelineMessage('Procesando cinemática clínica en GPU Serverless (RT-DETR + ViTPose-Large)...');

      let backendLoad = 'free_weight';
      if (load === 'cable') backendLoad = 'cable';
      else if (load === 'machine') backendLoad = 'machine';

      const config: ExerciseConfig = {
        exerciseType: exType,
        targetMuscle: muscle,
        loadType: backendLoad
      };

      const result = await analyzeVideoWithModal(blob, config, fileId, { range });
      setAnalysisData(result);
      setRepCount(result.total_reps);
      setPipelineState('ready');
      setPipelineMessage('');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.info('[Pipeline] Análisis cancelado por nueva petición.');
        return;
      }
      console.error('[Pipeline Error]', err);
      setPipelineState('error');
      setPipelineMessage(err?.message || 'Error al conectar con el microservicio GPU.');
    }
  }, []);

  // Video File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadedFileRef.current = file;

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

      await runPipelineAnalysis(
        compressedBlob,
        fileId,
        activeExercise.exerciseType,
        activeExercise.targetMuscle,
        activeExercise.loadType
      );

      if (videoElementRef.current) {
        videoElementRef.current.playbackRate = 1.0;
        videoElementRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setPipelineState('error');
      setPipelineMessage('Error en compresión de vídeo.');
    }
  };

  // Analyze trimmed range
  const handleAnalyzeTrimmedRange = async () => {
    if (!uploadedFileRef.current) return;
    try {
      setPipelineState('compressing');
      setPipelineMessage(`Recortando y preparando tramo (${trimStart.toFixed(1)}s - ${trimEnd.toFixed(1)}s)...`);

      const file = uploadedFileRef.current;
      const fileId = fileCacheIdRef.current || `${file.name}_${file.size}_${file.lastModified}`;

      const compressedBlob = await prepareVideoForAnalysis(file, {
        range: { startTime: trimStart, endTime: trimEnd }
      });
      compressedBlobRef.current = compressedBlob;

      await runPipelineAnalysis(
        compressedBlob,
        fileId,
        activeExercise.exerciseType,
        activeExercise.targetMuscle,
        activeExercise.loadType,
        { startTime: trimStart, endTime: trimEnd }
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setPipelineState('error');
      setPipelineMessage('Error al recortar y procesar tramo seleccionado.');
    }
  };

  // Trigger re-analysis when exercise configuration changes (Instant from cache if already processed)
  const handleExerciseSelect = (item: ExerciseItem) => {
    setSelectedExerciseId(item.id);
    setTargetMuscle(item.targetMuscle);
    setLoadType(item.loadType);

    if (compressedBlobRef.current && fileCacheIdRef.current) {
      const range = showTrimmer ? { startTime: trimStart, endTime: trimEnd } : undefined;
      runPipelineAnalysis(
        compressedBlobRef.current,
        fileCacheIdRef.current,
        item.exerciseType,
        item.targetMuscle,
        item.loadType,
        range
      );
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

    const isLowerBody = options.exerciseId.includes('hip_thrust') ||
      options.exerciseId.includes('squat') ||
      options.exerciseId.includes('rdl') ||
      options.exerciseId.includes('bulgarian');

    if (mode === 'technique') {
      if (isLowerBody) {
        // Lower-body clean kinetic chain: Shoulder -> Hip -> Knee -> Ankle
        drawSegment(pSh, pHp, '#10B981'); // Spinal trunk
        drawSegment(pHp, pKn, '#10B981'); // Thigh
        drawSegment(pKn, pAk, '#10B981'); // Shin

        drawPoint(pSh, '#10B981');
        drawPoint(pHp, '#10B981');
        drawPoint(pKn, '#10B981');
        drawPoint(pAk, '#10B981');
        drawPoint(pHd, '#34D399');
      } else {
        // Upper-body kinetic chain
        drawSegment(pHd, pSh, '#34D399');
        drawSegment(pSh, pHp, '#10B981');
        drawSegment(pSh, pEl, '#6EE7B7');
        drawSegment(pEl, pWr, '#6EE7B7');

        drawPoint(pHd, '#34D399');
        drawPoint(pSh, '#10B981');
        drawPoint(pEl, '#6EE7B7');
        drawPoint(pWr, '#6EE7B7');
        drawPoint(pHp, '#10B981');
      }

      // Joint Angle badge at primary inflection joint
      if (options.showCanvasText) {
        const isHT = options.exerciseId.includes('hip_thrust');
        if (isHT) {
          // Hip extension angle badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(pHp.x + 8, pHp.y - 12, 54, 20, 6);
          ctx.fill();
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(`${Math.round(frame.main_angle)}°`, pHp.x + 14, pHp.y + 2);

          // Knee angle badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(pKn.x - 62, pKn.y - 12, 54, 20, 6);
          ctx.fill();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(`${Math.round(frame.secondary_angle)}°`, pKn.x - 56, pKn.y + 2);
        } else {
          const targetPt = options.exerciseId.includes('bench') || options.exerciseId.includes('row') ? pEl : pKn;
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
      drawPoint(pAk, '#38BDF8');
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
      exerciseId: activeExercise.id,
      exerciseName: activeExercise.name,
      videoDurationSeconds: analysisData.duration,
      hardwareModel: 'Cerebrium Serverless T4 GPU (RT-DETR + ViTPose-Large + SciPy)',
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
                    : pipelineState === 'error'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pipelineState === 'ready' ? 'bg-emerald-400' : pipelineState === 'error' ? 'bg-rose-400' : 'bg-cyan-400 animate-ping'}`} />
                  <span>
                    {pipelineState === 'ready' ? 'Cerebrium GPU T4 Activo' : pipelineState === 'analyzing' ? 'Inferencia GPU...' : pipelineState === 'compressing' ? 'Comprimiendo...' : pipelineState === 'error' ? 'Error' : 'Listo'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden lg:block">
                RT-DETR + ViTPose-Large + SciPy Butterworth Fase-Cero (Cerebrium T4 GPU)
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
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start overflow-y-auto">

          {/* LEFT COLUMN: Video Viewport & Playback Bar */}
          <div className="flex flex-col gap-2 min-w-0 lg:col-span-7">

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
              className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none"
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
                  const dur = target.duration || 0;
                  setVideoDuration(dur);
                  setTrimStart(0);
                  const end = Math.min(dur, 30);
                  setTrimEnd(end);
                  if (dur > 15.0) {
                    setShowTrimmer(true);
                  }
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
                  <span className="text-xs text-slate-400">Zero cold-start • RT-DETR + ViTPose-Large (Cerebrium T4 GPU)</span>
                </div>
              )}

              {/* Error State Overlay with real error details */}
              {pipelineState === 'error' && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <p className="text-sm font-black text-rose-300">Error en Análisis Biomecánico</p>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/80 p-3 rounded-xl border border-rose-500/30 text-left whitespace-pre-wrap break-words max-h-36 overflow-y-auto">
                      {pipelineMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (compressedBlobRef.current && fileCacheIdRef.current) {
                        const range = showTrimmer ? { startTime: trimStart, endTime: trimEnd } : undefined;
                        runPipelineAnalysis(
                          compressedBlobRef.current,
                          fileCacheIdRef.current,
                          activeExercise.exerciseType,
                          activeExercise.targetMuscle,
                          activeExercise.loadType,
                          range
                        );
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition"
                  >
                    Reintentar Análisis
                  </button>
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
                    {currentFrame && currentFrame.rep_number > 0 ? `REP: #${currentFrame.rep_number}` : 'PREPARACIÓN'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                    {currentFrame?.phase || 'IDLE'}
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

            {/* Range Trimmer Component (Interactive Dual Slider & Controls) */}
            {uploadedVideoUrl && (
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-300">Recortador de Rango (Dual-Range Trimmer)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      (trimEnd - trimStart) <= 30
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      Ventana: {(trimEnd - trimStart).toFixed(1)}s (Máx 30s)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTrimmer(prev => !prev)}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700"
                    >
                      {showTrimmer ? 'Ocultar' : 'Ajustar'}
                    </button>
                  </div>
                </div>

                {showTrimmer && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Inicio:</span>
                          <span className="text-cyan-300 font-bold">{trimStart.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, trimEnd - 0.5)}
                          step={0.1}
                          value={trimStart}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTrimStart(val);
                            if (videoElementRef.current) {
                              videoElementRef.current.currentTime = val;
                            }
                          }}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Fin:</span>
                          <span className="text-cyan-300 font-bold">{trimEnd.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min={Math.min(effectiveTotalDuration, trimStart + 0.5)}
                          max={effectiveTotalDuration || 30}
                          step={0.1}
                          value={trimEnd}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTrimEnd(val);
                            if (videoElementRef.current) {
                              videoElementRef.current.currentTime = val;
                            }
                          }}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Rango activo: <strong className="text-white">{trimStart.toFixed(1)}s</strong> a <strong className="text-white">{trimEnd.toFixed(1)}s</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAnalyzeTrimmedRange}
                        disabled={pipelineState === 'compressing' || pipelineState === 'analyzing'}
                        className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${pipelineState === 'analyzing' ? 'animate-spin' : ''}`} />
                        <span>Analizar tramo seleccionado</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Mode Switcher, Exercise Selector & Biomechanical Diagnosis */}
          <div className="flex flex-col gap-3 min-w-0 lg:col-span-5">
            <div className="hidden lg:block">
              {modeSwitcherButtons}
            </div>

            {/* Muscle Group & Exercise Catalog Selector */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Grupo Muscular y Ejercicio Evaluado
              </label>

              {/* Muscle Group Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                {MUSCLE_GROUPS.map((group) => {
                  const isSelected = selectedMuscleGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setSelectedMuscleGroupId(group.id);
                        const firstEx = group.exercises[0];
                        if (firstEx) {
                          handleExerciseSelect(firstEx);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>

              {/* Exercises Grid for Selected Group */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {activeMuscleGroup?.exercises.map((item) => {
                  const isSelected = selectedExerciseId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleExerciseSelect(item)}
                      className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600/25 border-blue-500 text-blue-200 shadow-sm shadow-blue-500/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">{item.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                        {item.loadType === 'gravity' ? 'Peso Libre' : item.loadType === 'cable' ? 'Polea' : 'Máquina'}
                      </span>
                    </button>
                  );
                })}
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
