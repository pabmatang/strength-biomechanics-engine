import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { ErrorBoundary } from './ErrorBoundary';

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
    id: 'back',
    name: 'Espalda',
    exercises: [
      { id: 'machine_row', name: 'Remo en Máquina', exerciseType: 'machine_row', targetMuscle: 'lats', loadType: 'machine', patternId: 'chest_supported_lat_row' },
      { id: 'barbell_row', name: 'Remo con Barra', exerciseType: 'barbell_row', targetMuscle: 'lats', loadType: 'gravity', patternId: 'chest_supported_lat_row' },
      { id: 'cable_row', name: 'Remo Gironda en Polea', exerciseType: 'cable_row', targetMuscle: 'lats', loadType: 'cable', patternId: 'chest_supported_lat_row' },
      { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', exerciseType: 'dumbbell_row', targetMuscle: 'lats', loadType: 'gravity', patternId: 'chest_supported_lat_row' },
      { id: 't_bar_row', name: 'Remo en Punta / Barra T', exerciseType: 't_bar_row', targetMuscle: 'upper_back', loadType: 'gravity', patternId: 'chest_supported_t_bar_row_upper_back' },
      { id: 'lat_pulldown', name: 'Jalón al Pecho', exerciseType: 'lat_pulldown', targetMuscle: 'lats', loadType: 'cable', patternId: 'lat_pulldown_unilateral' },
      { id: 'single_lat_pulldown', name: 'Jalón Unilateral en Polea', exerciseType: 'single_lat_pulldown', targetMuscle: 'lats', loadType: 'cable', patternId: 'lat_pulldown_unilateral' },
      { id: 'pullup', name: 'Dominadas', exerciseType: 'pullup', targetMuscle: 'lats', loadType: 'gravity', patternId: 'lat_pulldown_unilateral' },
      { id: 'pullover', name: 'Pullover en Polea', exerciseType: 'pullover', targetMuscle: 'lats', loadType: 'cable', patternId: 'straight_arm_cable_pulldown' }
    ]
  },
  {
    id: 'glutes_hamstrings',
    name: 'Glúteo e Isquios',
    exercises: [
      { id: 'hip_thrust', name: 'Hip Thrust con Barra', exerciseType: 'hip_thrust', targetMuscle: 'glutes_max', loadType: 'gravity', patternId: 'hip_thrust_barbell' },
      { id: 'machine_hip_thrust', name: 'Hip Thrust en Máquina', exerciseType: 'machine_hip_thrust', targetMuscle: 'glutes_max', loadType: 'machine', patternId: 'hip_thrust_barbell' },
      { id: 'kas_glute_bridge', name: 'Kas Glute Bridge', exerciseType: 'kas_glute_bridge', targetMuscle: 'glutes_max', loadType: 'gravity', patternId: 'hip_thrust_barbell' },
      { id: 'rdl', name: 'Peso Muerto Rumano (RDL)', exerciseType: 'rdl', targetMuscle: 'hamstrings', loadType: 'gravity', patternId: 'rdl_strict_hamstring' },
      { id: 'deadlift', name: 'Peso Muerto Convencional', exerciseType: 'deadlift', targetMuscle: 'hamstrings', loadType: 'gravity', patternId: 'rdl_strict_hamstring' },
      { id: 'seated_leg_curl', name: 'Curl Femoral Sentado', exerciseType: 'seated_leg_curl', targetMuscle: 'hamstrings', loadType: 'machine', patternId: 'seated_leg_curl_machine' },
      { id: 'lying_leg_curl', name: 'Curl Femoral Tumbado', exerciseType: 'lying_leg_curl', targetMuscle: 'hamstrings', loadType: 'machine', patternId: 'lying_leg_curl_machine' },
      { id: 'cable_kickback', name: 'Patada de Glúteo en Polea', exerciseType: 'cable_kickback', targetMuscle: 'glutes_max', loadType: 'cable', patternId: 'cable_kickback_glute' },
      { id: 'hip_abduction', name: 'Abducción en Máquina', exerciseType: 'hip_abduction', targetMuscle: 'glutes_max', loadType: 'machine', patternId: 'cable_kickback_glute' }
    ]
  },
  {
    id: 'quads',
    name: 'Cuádriceps',
    exercises: [
      { id: 'squat', name: 'Sentadilla Libre con Barra', exerciseType: 'squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'squat_high_bar' },
      { id: 'hack_squat', name: 'Sentadilla Hack en Máquina', exerciseType: 'hack_squat', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'hack_squat_machine' },
      { id: 'leg_press', name: 'Prensa Inclinada 45°', exerciseType: 'leg_press', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'leg_press_high_feet' },
      { id: 'leg_extension', name: 'Extensión de Cuádriceps', exerciseType: 'leg_extension', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'leg_extension_machine' },
      { id: 'bulgarian_squat', name: 'Zancada Búlgara', exerciseType: 'bulgarian_squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'bulgarian_split_squat_glute' },
      { id: 'front_squat', name: 'Sentadilla Frontal', exerciseType: 'front_squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'squat_high_bar' },
      { id: 'sissy_squat', name: 'Sissy Squat', exerciseType: 'sissy_squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'sissy_squat_bodyweight' }
    ]
  },
  {
    id: 'chest',
    name: 'Pecho',
    exercises: [
      { id: 'bench_press', name: 'Press Banca Plano con Barra', exerciseType: 'bench_press', targetMuscle: 'pectorals', loadType: 'gravity', patternId: 'converging_chest_press_machine' },
      { id: 'incline_press', name: 'Press Inclinado con Mancuernas', exerciseType: 'incline_press', targetMuscle: 'pectorals', loadType: 'gravity', patternId: 'incline_dumbbell_press' },
      { id: 'machine_chest_press', name: 'Press en Máquina Convergente', exerciseType: 'machine_chest_press', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'converging_chest_press_machine' },
      { id: 'cable_fly', name: 'Aperturas / Cruces en Polea', exerciseType: 'cable_fly', targetMuscle: 'pectorals', loadType: 'cable', patternId: 'cable_fly_mid_sternal' },
      { id: 'pec_deck', name: 'Pec Deck / Contractora', exerciseType: 'pec_deck', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'cable_fly_mid_sternal' },
      { id: 'chest_dips', name: 'Fondos en Paralelas para Pecho', exerciseType: 'chest_dips', targetMuscle: 'pectorals', loadType: 'gravity', patternId: 'dips_chest_lean' }
    ]
  },
  {
    id: 'shoulders',
    name: 'Hombro',
    exercises: [
      { id: 'overhead_press', name: 'Press Militar', exerciseType: 'overhead_press', targetMuscle: 'upper_back', loadType: 'gravity', patternId: 'incline_dumbbell_press' },
      { id: 'shoulder_press_machine', name: 'Press de Hombro en Máquina', exerciseType: 'shoulder_press_machine', targetMuscle: 'upper_back', loadType: 'machine', patternId: 'incline_dumbbell_press' },
      { id: 'lateral_raise', name: 'Elevaciones Laterales con Mancuernas', exerciseType: 'lateral_raise', targetMuscle: 'upper_back', loadType: 'gravity', patternId: 'straight_arm_cable_pulldown' },
      { id: 'cable_lateral_raise', name: 'Elevaciones Laterales en Polea', exerciseType: 'cable_lateral_raise', targetMuscle: 'upper_back', loadType: 'cable', patternId: 'straight_arm_cable_pulldown' },
      { id: 'rear_delt_fly', name: 'Pájaros / Deltoides Posterior', exerciseType: 'rear_delt_fly', targetMuscle: 'upper_back', loadType: 'machine', patternId: 'chest_supported_row_wide_upper_back' },
      { id: 'face_pull', name: 'Face Pull en Polea', exerciseType: 'face_pull', targetMuscle: 'upper_back', loadType: 'cable', patternId: 'chest_supported_row_wide_upper_back' }
    ]
  },
  {
    id: 'arms',
    name: 'Brazos',
    exercises: [
      { id: 'biceps_curl', name: 'Curl Bíceps con Barra / Mancuernas', exerciseType: 'biceps_curl', targetMuscle: 'biceps', loadType: 'gravity', patternId: 'biceps_curl_dumbbell' },
      { id: 'preacher_curl', name: 'Curl en Banco Scott / Predicador', exerciseType: 'preacher_curl', targetMuscle: 'biceps', loadType: 'machine', patternId: 'biceps_curl_dumbbell' },
      { id: 'cable_biceps_curl', name: 'Curl de Bíceps en Polea', exerciseType: 'cable_biceps_curl', targetMuscle: 'biceps', loadType: 'cable', patternId: 'biceps_curl_cable' },
      { id: 'hammer_curl', name: 'Curl Martillo', exerciseType: 'hammer_curl', targetMuscle: 'biceps', loadType: 'gravity', patternId: 'biceps_curl_dumbbell' },
      { id: 'triceps_extension', name: 'Extensión Tríceps en Polea Alta', exerciseType: 'triceps_extension', targetMuscle: 'triceps', loadType: 'cable', patternId: 'triceps_pushdown_cable' },
      { id: 'skull_crushers', name: 'Press Francés con Barra / Mancuernas', exerciseType: 'skull_crushers', targetMuscle: 'triceps', loadType: 'gravity', patternId: 'triceps_overhead_extension' },
      { id: 'overhead_triceps_extension', name: 'Extensión Tríceps Trasnuca en Polea', exerciseType: 'overhead_triceps_extension', targetMuscle: 'triceps', loadType: 'cable', patternId: 'triceps_overhead_extension' },
      { id: 'triceps_dips', name: 'Fondos para Tríceps', exerciseType: 'triceps_dips', targetMuscle: 'triceps', loadType: 'gravity', patternId: 'dips_chest_lean' }
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
  const closest = Math.abs(frames[i1].time - currentTime) < Math.abs(frames[i2].time - currentTime)
    ? frames[i1]
    : frames[i2];
  
  // Return null if playback time is outside the analyzed frame window
  if (Math.abs(closest.time - currentTime) > 0.45) {
    return null;
  }
  return closest;
}

function getInterpolatedFrame(frames: BiomechanicsFrame[], currentTime: number): BiomechanicsFrame | null {
  if (!frames || frames.length === 0) return null;
  if (currentTime <= frames[0].time) return frames[0];
  if (currentTime >= frames[frames.length - 1].time) return frames[frames.length - 1];

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

  const idx0 = Math.max(0, Math.min(frames.length - 1, high));
  const idx1 = Math.max(0, Math.min(frames.length - 1, low));
  if (idx0 === idx1) return frames[idx0];

  const f0 = frames[idx0];
  const f1 = frames[idx1];
  const dt = f1.time - f0.time;
  if (dt <= 0.0001) return f0;

  const alpha = Math.max(0, Math.min(1, (currentTime - f0.time) / dt));
  const lerp = (a: number, b: number) => a + (b - a) * alpha;

  const kp0 = f0.keypoints_norm as unknown as Record<string, { x: number; y: number; score: number }>;
  const kp1 = f1.keypoints_norm as unknown as Record<string, { x: number; y: number; score: number }>;
  const interpolatedKp: Record<string, { x: number; y: number; score: number }> = {};

  if (kp0 && kp1) {
    for (const k of Object.keys(kp0)) {
      if (kp0[k] && kp1[k]) {
        interpolatedKp[k] = {
          x: lerp(kp0[k].x, kp1[k].x),
          y: lerp(kp0[k].y, kp1[k].y),
          score: Math.min(kp0[k].score, kp1[k].score)
        };
      } else {
        interpolatedKp[k] = kp0[k] || kp1[k];
      }
    }
  }

  return {
    ...f1,
    time: currentTime,
    main_angle: lerp(f0.main_angle, f1.main_angle),
    secondary_angle: lerp(f0.secondary_angle, f1.secondary_angle),
    keypoints_norm: Object.keys(interpolatedKp).length > 0 ? (interpolatedKp as any) : f1.keypoints_norm,
    moment_arms: {
      d_hip: lerp(f0.moment_arms?.d_hip ?? 0, f1.moment_arms?.d_hip ?? 0),
      d_knee: lerp(f0.moment_arms?.d_knee ?? 0, f1.moment_arms?.d_knee ?? 0),
      d_shoulder: lerp(f0.moment_arms?.d_shoulder ?? 0, f1.moment_arms?.d_shoulder ?? 0),
      d_elbow: lerp((f0.moment_arms as any)?.d_elbow ?? 0, (f1.moment_arms as any)?.d_elbow ?? 0)
    } as any
  };
}

export function resolveExercise(exerciseId?: string | null, exerciseName?: string | null): ExerciseItem {
  const targetId = String(exerciseId || '').toLowerCase().trim();
  const targetName = String(exerciseName || '').toLowerCase().trim();

  // 1. Direct match on item.id
  if (targetId) {
    const directMatch = ALL_EXERCISES.find(e => e.id.toLowerCase() === targetId);
    if (directMatch) return directMatch;
  }

  // 2. Direct match on item.exerciseType
  if (targetId) {
    const typeMatch = ALL_EXERCISES.find(e => e.exerciseType.toLowerCase() === targetId);
    if (typeMatch) return typeMatch;
  }

  // 3. Substring / semantic heuristic match on ID or Name
  const combined = `${targetId} ${targetName}`;

  if (combined.includes('hip_thrust') || combined.includes('thrust') || combined.includes('bridge') || combined.includes('glute')) {
    if (combined.includes('mach') || combined.includes('máquina')) {
      return ALL_EXERCISES.find(e => e.id === 'machine_hip_thrust') || ALL_EXERCISES[0];
    }
    return ALL_EXERCISES.find(e => e.id === 'hip_thrust') || ALL_EXERCISES[0];
  }
  if (combined.includes('rdl') || combined.includes('rumano') || combined.includes('deadlift') || combined.includes('muerto')) {
    return ALL_EXERCISES.find(e => e.id === 'rdl') || ALL_EXERCISES[0];
  }
  if (combined.includes('hack') || combined.includes('squat') || combined.includes('sentadilla') || combined.includes('prensa') || combined.includes('leg_press')) {
    if (combined.includes('hack')) return ALL_EXERCISES.find(e => e.id === 'hack_squat') || ALL_EXERCISES[0];
    if (combined.includes('prensa') || combined.includes('press')) return ALL_EXERCISES.find(e => e.id === 'leg_press') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'barbell_squat') || ALL_EXERCISES[0];
  }
  if (combined.includes('extension') || combined.includes('cuadriceps')) {
    return ALL_EXERCISES.find(e => e.id === 'leg_extension') || ALL_EXERCISES[0];
  }
  if (combined.includes('bench') || combined.includes('banca') || combined.includes('chest') || combined.includes('pecho')) {
    if (combined.includes('inclin')) return ALL_EXERCISES.find(e => e.id === 'incline_press') || ALL_EXERCISES[0];
    if (combined.includes('mach') || combined.includes('máquina')) return ALL_EXERCISES.find(e => e.id === 'machine_chest_press') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'bench_press') || ALL_EXERCISES[0];
  }
  if (combined.includes('row') || combined.includes('remo') || combined.includes('gironda') || combined.includes('dorsal')) {
    if (combined.includes('mach') || combined.includes('máquina')) return ALL_EXERCISES.find(e => e.id === 'machine_row') || ALL_EXERCISES[0];
    if (combined.includes('barbell') || combined.includes('barra')) return ALL_EXERCISES.find(e => e.id === 'barbell_row') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'machine_row') || ALL_EXERCISES[0];
  }
  if (combined.includes('jalon') || combined.includes('pulldown') || combined.includes('dominada') || combined.includes('pullup')) {
    return ALL_EXERCISES.find(e => e.id === 'lat_pulldown') || ALL_EXERCISES[0];
  }
  if (combined.includes('militar') || combined.includes('overhead') || combined.includes('shoulder') || combined.includes('hombro')) {
    if (combined.includes('mach') || combined.includes('máquina')) return ALL_EXERCISES.find(e => e.id === 'shoulder_press_machine') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'overhead_press') || ALL_EXERCISES[0];
  }
  if (combined.includes('lateral')) {
    return ALL_EXERCISES.find(e => e.id === 'lateral_raise') || ALL_EXERCISES[0];
  }
  if (combined.includes('biceps') || combined.includes('curl')) {
    return ALL_EXERCISES.find(e => e.id === 'biceps_curl') || ALL_EXERCISES[0];
  }
  if (combined.includes('triceps') || combined.includes('pushdown') || combined.includes('frances') || combined.includes('dip')) {
    return ALL_EXERCISES.find(e => e.id === 'triceps_extension') || ALL_EXERCISES[0];
  }

  // 4. Default fallback: Hip Thrust
  return ALL_EXERCISES.find(e => e.id === 'hip_thrust') || ALL_EXERCISES[0];
}

const VideoPoseAnalysisModalInner: React.FC<VideoPoseAnalysisModalProps> = ({
  isOpen,
  onClose,
  defaultExerciseId = 'hip_thrust',
  defaultExerciseName = 'Hip Thrust (Glúteo Mayor)'
}) => {
  // Cascading Selection State & Safe Catalog Mapping
  const initialExercise = useMemo(() => {
    return resolveExercise(defaultExerciseId, defaultExerciseName);
  }, [defaultExerciseId, defaultExerciseName]);

  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string>(() => {
    const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === initialExercise.id));
    return parentGroup ? parentGroup.id : 'glutes_hamstrings';
  });
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExercise.id);

  // Synchronize exercise and group when modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      const resolved = resolveExercise(defaultExerciseId, defaultExerciseName);
      setSelectedExerciseId(resolved.id);
      const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === resolved.id));
      if (parentGroup) {
        setSelectedMuscleGroupId(parentGroup.id);
      }
      setLoadType(resolved.loadType);
      setTargetMuscle(resolved.targetMuscle);
    }
  }, [isOpen, defaultExerciseId, defaultExerciseName]);

  const activeMuscleGroup =
    MUSCLE_GROUPS.find(g => g.id === selectedMuscleGroupId) || MUSCLE_GROUPS[0];
  const activeExercise =
    ALL_EXERCISES.find(e => e.id === selectedExerciseId) ||
    initialExercise ||
    ALL_EXERCISES[0];

  const selectedPattern: ExercisePatternSpec =
    (activeExercise?.patternId && EXERCISE_PATTERNS.find(p => p.id === activeExercise.patternId)) ||
    EXERCISE_PATTERNS[0] ||
    ({
      id: 'hip_thrust_barbell',
      name: 'Hip Thrust con Barra',
      primaryTarget: 'glutes_max',
      jointSequence: ['hip', 'knee'],
      optimalAngleWindow: { min: 80, max: 180, inflection: 90 },
      primaryPlane: 'sagittal'
    } as unknown as ExercisePatternSpec);

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
  const smoothLineXRef = useRef<number | null>(null);

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

  // Video File Upload Handler - Loads video preview and shows Trimmer before analyzing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setShowTrimmer(true);
    setAnalysisData(null);
    setCurrentFrame(null);
    setPipelineState('idle');
    setPipelineMessage('');

    const fileId = `${file.name}_${file.size}_${file.lastModified}`;
    fileCacheIdRef.current = fileId;
  };

  // Launch Analysis on the chosen trimmed range
  const handleStartAnalysis = async () => {
    if (!uploadedFileRef.current) return;
    try {
      setPipelineState('compressing');
      setPipelineMessage(`Preparando tramo (${trimStart.toFixed(1)}s - ${trimEnd.toFixed(1)}s)...`);

      const file = uploadedFileRef.current;
      const fileId = fileCacheIdRef.current || `${file.name}_${file.size}_${file.lastModified}`;

      const range = { startTime: trimStart, endTime: trimEnd };
      const preparedBlob = await prepareVideoForAnalysis(file, { range });
      compressedBlobRef.current = preparedBlob;

      await runPipelineAnalysis(
        preparedBlob,
        fileId,
        activeExercise.exerciseType,
        activeExercise.targetMuscle,
        activeExercise.loadType,
        range
      );

      if (videoElementRef.current) {
        videoElementRef.current.currentTime = trimStart;
        videoElementRef.current.playbackRate = 1.0;
        videoElementRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setPipelineState('error');
      setPipelineMessage('Error al preparar o analizar el vídeo.');
    }
  };

  // Trigger re-analysis when exercise configuration changes (Instant from cache if already processed)
  const handleExerciseSelect = (item: ExerciseItem) => {
    setSelectedExerciseId(item.id);
    setTargetMuscle(item.targetMuscle);
    setLoadType(item.loadType);

    if (analysisData && uploadedFileRef.current && fileCacheIdRef.current) {
      const range = { startTime: trimStart, endTime: trimEnd };
      const blob = compressedBlobRef.current || uploadedFileRef.current;
      runPipelineAnalysis(
        blob,
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

      // Seamless video loop inside trimmed range [trimStart, trimEnd]
      if (!video.seeking && trimEnd > trimStart && (currentTime >= trimEnd || currentTime < trimStart - 0.2)) {
        video.currentTime = trimStart;
      }

      if (analysisData && analysisData.frames.length > 0) {
        const frame = getInterpolatedFrame(analysisData.frames, currentTime) || findClosestFrame(analysisData.frames, currentTime);
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
            exerciseId: selectedExerciseId || activeExercise?.id || '',
            muscleGroupId: selectedMuscleGroupId
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
  }, [analysisData, analysisMode, zoom, panOffset, showLeverArms, showCanvasText, selectedMuscleGroupId, selectedExerciseId, activeExercise, trimStart, trimEnd]);

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
      muscleGroupId?: string;
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

    const kp = frame.keypoints_norm as any;
    if (!kp) {
      ctx.restore();
      return;
    }

    const pSh = { x: px(kp.shoulder?.x ?? 0.5), y: py(kp.shoulder?.y ?? 0.5), score: kp.shoulder?.score ?? 1 };
    const pEl = { x: px(kp.elbow?.x ?? 0.5), y: py(kp.elbow?.y ?? 0.5), score: kp.elbow?.score ?? 1 };
    const pWr = { x: px(kp.wrist?.x ?? 0.5), y: py(kp.wrist?.y ?? 0.5), score: kp.wrist?.score ?? 1 };
    const pHp = { x: px(kp.hip?.x ?? 0.5), y: py(kp.hip?.y ?? 0.5), score: kp.hip?.score ?? 1 };
    const pKn = { x: px(kp.knee?.x ?? 0.5), y: py(kp.knee?.y ?? 0.5), score: kp.knee?.score ?? 1 };
    const pAk = { x: px(kp.ankle?.x ?? 0.5), y: py(kp.ankle?.y ?? 0.5), score: kp.ankle?.score ?? 1 };
    const pHd = { x: px(kp.head?.x ?? 0.5), y: py(kp.head?.y ?? 0.3), score: kp.head?.score ?? 1 };

    const pLSh = kp.left_shoulder ? { x: px(kp.left_shoulder.x), y: py(kp.left_shoulder.y), score: kp.left_shoulder.score } : pSh;
    const pRSh = kp.right_shoulder ? { x: px(kp.right_shoulder.x), y: py(kp.right_shoulder.y), score: kp.right_shoulder.score } : pSh;
    const pLEl = kp.left_elbow ? { x: px(kp.left_elbow.x), y: py(kp.left_elbow.y), score: kp.left_elbow.score } : pEl;
    const pREl = kp.right_elbow ? { x: px(kp.right_elbow.x), y: py(kp.right_elbow.y), score: kp.right_elbow.score } : pEl;
    const pLWr = kp.left_wrist ? { x: px(kp.left_wrist.x), y: py(kp.left_wrist.y), score: kp.left_wrist.score } : pWr;
    const pRWr = kp.right_wrist ? { x: px(kp.right_wrist.x), y: py(kp.right_wrist.y), score: kp.right_wrist.score } : pWr;
    const pLHp = kp.left_hip ? { x: px(kp.left_hip.x), y: py(kp.left_hip.y), score: kp.left_hip.score } : pHp;
    const pRHp = kp.right_hip ? { x: px(kp.right_hip.x), y: py(kp.right_hip.y), score: kp.right_hip.score } : pHp;
    const pLKn = kp.left_knee ? { x: px(kp.left_knee.x), y: py(kp.left_knee.y), score: kp.left_knee.score } : pKn;
    const pRKn = kp.right_knee ? { x: px(kp.right_knee.x), y: py(kp.right_knee.y), score: kp.right_knee.score } : pKn;
    const pLAk = kp.left_ankle ? { x: px(kp.left_ankle.x), y: py(kp.left_ankle.y), score: kp.left_ankle.score } : pAk;
    const pRAk = kp.right_ankle ? { x: px(kp.right_ankle.x), y: py(kp.right_ankle.y), score: kp.right_ankle.score } : pAk;

    // Both sides must have reasonable confidence to render bilateral skeleton, otherwise use primary tracked limbs
    const hasBilateral = Boolean(
      (kp.left_shoulder?.score ?? 0) >= 0.28 && (kp.right_shoulder?.score ?? 0) >= 0.28 &&
      (kp.left_elbow?.score ?? 0) >= 0.28 && (kp.right_elbow?.score ?? 0) >= 0.28
    );

    const drawPoint = (p: { x: number; y: number; score?: number }, color: string) => {
      if (p.score !== undefined && p.score < 0.25) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.0, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    };

    const drawSegment = (p1: { x: number; y: number; score?: number }, p2: { x: number; y: number; score?: number }, color: string, dashed: boolean = false) => {
      if ((p1.score !== undefined && p1.score < 0.25) || (p2.score !== undefined && p2.score < 0.25)) return;
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const clampX = (x: number, w: number = 64) => Math.max(10, Math.min(canvas.width - w - 10, x));
    const clampY = (y: number, h: number = 22) => Math.max(10, Math.min(canvas.height - h - 10, y));

    const drawPillTag = (x: number, y: number, text: string, borderColor: string, textColor: string = '#FFFFFF') => {
      ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
      const textW = ctx.measureText(text).width;
      const pillW = textW + 14;
      const pillH = 20;
      const pillX = clampX(x, pillW);
      const pillY = clampY(y, pillH);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(text, pillX + 7, pillY + 14);
    };

    const drawAngleArc = (pCenter: { x: number; y: number; score?: number }, p1: { x: number; y: number; score?: number }, p2: { x: number; y: number; score?: number }, radius: number, color: string) => {
      if ((pCenter.score !== undefined && pCenter.score < 0.25) ||
          (p1.score !== undefined && p1.score < 0.25) ||
          (p2.score !== undefined && p2.score < 0.25)) return;
      const a1 = Math.atan2(p1.y - pCenter.y, p1.x - pCenter.x);
      const a2 = Math.atan2(p2.y - pCenter.y, p2.x - pCenter.x);
      ctx.beginPath();
      ctx.arc(pCenter.x, pCenter.y, radius, Math.min(a1, a2), Math.max(a1, a2));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    };

    const grpId = options.muscleGroupId || selectedMuscleGroupId || '';
    const exIdStr = String(options.exerciseId || safeExerciseId || '').toLowerCase();

    const isUpperBody = grpId === 'chest' || grpId === 'back' || grpId === 'shoulders' || grpId === 'arms' ||
      exIdStr.includes('bench') || exIdStr.includes('chest') || exIdStr.includes('press') ||
      exIdStr.includes('row') || exIdStr.includes('pulldown') || exIdStr.includes('pullup') ||
      exIdStr.includes('pullover') || exIdStr.includes('curl') || exIdStr.includes('triceps') ||
      exIdStr.includes('dips');
    const isLowerBody = !isUpperBody;

    if (mode === 'technique') {
      // -------------------------------------------------------------
      // MODO 1: CORRECCIÓN TÉCNICA (ESQUELETO COMPLETO Y AJUSTADO AL CUERPO)
      // -------------------------------------------------------------
      if (hasBilateral) {
        // Cuello y cabeza
        const midNeck = { x: (pLSh.x + pRSh.x) / 2, y: (pLSh.y + pRSh.y) / 2, score: Math.min(pLSh.score ?? 1, pRSh.score ?? 1) };
        drawSegment(pHd, midNeck, '#34D399');
        drawPoint(pHd, '#34D399');

        // Clavícula / Unión de hombros
        drawSegment(pLSh, pRSh, '#34D399');
        drawPoint(pLSh, '#10B981');
        drawPoint(pRSh, '#10B981');

        if (isLowerBody) {
          // Tren inferior: piernas y cadera resaltadas
          drawSegment(pLSh, pLEl, 'rgba(148, 163, 184, 0.40)');
          drawSegment(pLEl, pLWr, 'rgba(148, 163, 184, 0.40)');
          drawSegment(pRSh, pREl, 'rgba(148, 163, 184, 0.40)');
          drawSegment(pREl, pRWr, 'rgba(148, 163, 184, 0.40)');
          drawPoint(pLEl, '#94A3B8');
          drawPoint(pREl, '#94A3B8');

          // Torso y pelvis
          drawSegment(pLSh, pLHp, '#10B981');
          drawSegment(pRSh, pRHp, '#10B981');
          drawSegment(pLHp, pRHp, '#10B981');
          drawPoint(pLHp, '#10B981');
          drawPoint(pRHp, '#10B981');

          // Piernas
          drawSegment(pLHp, pLKn, '#10B981');
          drawSegment(pLKn, pLAk, '#10B981');
          drawSegment(pRHp, pRKn, '#10B981');
          drawSegment(pRKn, pRAk, '#10B981');
          drawPoint(pLKn, '#10B981');
          drawPoint(pRKn, '#10B981');
          drawPoint(pLAk, '#38BDF8');
          drawPoint(pRAk, '#38BDF8');

          drawAngleArc(pKn, pHp, pAk, 20, '#38BDF8');
          if (options.showCanvasText) {
            drawPillTag(pKn.x - 76, pKn.y - 12, `Rodilla: ${Math.round(frame.secondary_angle || frame.main_angle)}°`, '#38BDF8', '#7DD3FC');
          }
        } else {
          // Tren superior: brazos, codos, hombros y torso resaltados
          drawSegment(pLHp, pLKn, 'rgba(148, 163, 184, 0.35)');
          drawSegment(pLKn, pLAk, 'rgba(148, 163, 184, 0.35)');
          drawSegment(pRHp, pRKn, 'rgba(148, 163, 184, 0.35)');
          drawSegment(pRKn, pRAk, 'rgba(148, 163, 184, 0.35)');
          drawPoint(pLKn, '#94A3B8');
          drawPoint(pRKn, '#94A3B8');

          // Torso y pelvis
          drawSegment(pLSh, pLHp, '#10B981');
          drawSegment(pRSh, pRHp, '#10B981');
          drawSegment(pLHp, pRHp, '#10B981');
          drawPoint(pLHp, '#10B981');
          drawPoint(pRHp, '#10B981');

          // Ambos brazos completos
          drawSegment(pLSh, pLEl, '#34D399');
          drawSegment(pLEl, pLWr, '#6EE7B7');
          drawSegment(pRSh, pREl, '#34D399');
          drawSegment(pREl, pRWr, '#6EE7B7');
          drawPoint(pLEl, '#38BDF8');
          drawPoint(pREl, '#38BDF8');
          drawPoint(pLWr, '#6EE7B7');
          drawPoint(pRWr, '#6EE7B7');

          // Arco y etiqueta limpia de Codo en el brazo activo (despeja hombro y torso)
          drawAngleArc(pEl, pSh, pWr, 20, '#38BDF8');
          if (options.showCanvasText) {
            drawPillTag(pEl.x + 12, pEl.y - 12, `Codo: ${Math.round(frame.main_angle)}°`, '#38BDF8', '#7DD3FC');
          }
        }
      } else {
        // Fallback unilateral suave y centrado en la articulación dominante
        if (isLowerBody) {
          drawSegment(pSh, pHp, '#10B981');
          drawSegment(pHp, pKn, '#10B981');
          drawSegment(pKn, pAk, '#10B981');
          drawPoint(pSh, '#10B981');
          drawPoint(pHp, '#10B981');
          drawPoint(pKn, '#10B981');
          drawPoint(pAk, '#10B981');
          drawPoint(pHd, '#34D399');
          drawAngleArc(pKn, pHp, pAk, 20, '#38BDF8');
          if (options.showCanvasText) {
            drawPillTag(pKn.x - 76, pKn.y - 12, `Rodilla: ${Math.round(frame.secondary_angle || frame.main_angle)}°`, '#38BDF8', '#7DD3FC');
          }
        } else {
          drawSegment(pHd, pSh, '#34D399');
          drawSegment(pSh, pHp, '#10B981');
          drawSegment(pSh, pEl, '#6EE7B7');
          drawSegment(pEl, pWr, '#6EE7B7');
          drawPoint(pHd, '#34D399');
          drawPoint(pSh, '#10B981');
          drawPoint(pEl, '#6EE7B7');
          drawPoint(pWr, '#6EE7B7');
          drawPoint(pHp, '#10B981');
          drawAngleArc(pEl, pSh, pWr, 20, '#38BDF8');
          if (options.showCanvasText) {
            drawPillTag(pEl.x + 12, pEl.y - 12, `Codo: ${Math.round(frame.main_angle)}°`, '#38BDF8', '#7DD3FC');
          }
        }
      }
    } else {
      // -------------------------------------------------------------
      // MODO 2: OPTIMIZACIÓN BIOMECÁNICA
      // -------------------------------------------------------------
      ctx.save();
      ctx.globalAlpha = 0.35;
      if (hasBilateral) {
        drawSegment(pLSh, pRSh, '#94A3B8');
        drawSegment(pLSh, pLEl, '#94A3B8');
        drawSegment(pLEl, pLWr, '#94A3B8');
        drawSegment(pRSh, pREl, '#94A3B8');
        drawSegment(pREl, pRWr, '#94A3B8');
        drawSegment(pLSh, pLHp, '#94A3B8');
        drawSegment(pRSh, pRHp, '#94A3B8');
        drawSegment(pLHp, pLKn, '#94A3B8');
        drawSegment(pLKn, pLAk, '#94A3B8');
        drawSegment(pRHp, pRKn, '#94A3B8');
        drawSegment(pRKn, pRAk, '#94A3B8');
      } else {
        if (isLowerBody) {
          drawSegment(pSh, pHp, '#94A3B8');
          drawSegment(pHp, pKn, '#94A3B8');
          drawSegment(pKn, pAk, '#94A3B8');
        } else {
          drawSegment(pSh, pHp, '#94A3B8');
          drawSegment(pSh, pEl, '#94A3B8');
          drawSegment(pEl, pWr, '#94A3B8');
        }
      }
      ctx.restore();

      const isHipThrust =
        (grpId === 'glutes_hamstrings' || grpId === '') && (
          exIdStr.includes('hip_thrust') ||
          exIdStr.includes('kas_glute') ||
          exIdStr.includes('glute_bridge') ||
          exIdStr.includes('bridge')
        );

      if (!isLowerBody) {
        // TREN SUPERIOR (Pecho, Espalda, Hombros, Brazos):
        drawPoint(pSh, '#3B82F6');
        drawPoint(pEl, '#10B981');
        drawPoint(pWr, '#FBBF24');
        if (pHp.score !== undefined && pHp.score > 0.35) {
          drawPoint(pHp, '#64748B');
        }

        // Live Elbow Angle Arc
        drawAngleArc(pEl, pSh, pWr, 24, '#10B981');

        if (options.showCanvasText) {
          const liveElbow = Math.round(frame.main_angle || 90);
          if (grpId === 'chest' || exIdStr.includes('bench') || exIdStr.includes('chest') || exIdStr.includes('press')) {
            const biasTag = liveElbow < 78 ? 'Tríceps +' : (liveElbow <= 96 ? 'Pectoral +' : 'Recorrido Corto');
            drawPillTag(pEl.x - 45, pEl.y + 16, `Codo: ${liveElbow}° (${biasTag})`, '#10B981', '#6EE7B7');
          } else if (grpId === 'back' || exIdStr.includes('row') || exIdStr.includes('pull')) {
            const biasTag = liveElbow < 80 ? 'Bíceps +' : (liveElbow <= 112 ? 'Dorsal +' : 'Tracción Parcial');
            drawPillTag(pEl.x - 45, pEl.y + 16, `Codo: ${liveElbow}° (${biasTag})`, '#10B981', '#6EE7B7');
          }
        }

        // Línea vertical de fuerza de carga con suavizado temporal anti-vibración
        const rawLineX = pWr.x;
        if (smoothLineXRef.current === null || isNaN(smoothLineXRef.current)) {
          smoothLineXRef.current = rawLineX;
        } else {
          smoothLineXRef.current = smoothLineXRef.current * 0.85 + rawLineX * 0.15;
        }
        const lineX = smoothLineXRef.current;

        const lineTop = Math.max(offsetY + 10, Math.min(pSh.y, pWr.y) - 60);
        const lineBottom = Math.min(offsetY + drawH - 10, Math.max(pSh.y, pEl.y, pWr.y, pHp.y) + 40);

        ctx.beginPath();
        ctx.setLineDash([6, 3]);
        ctx.moveTo(lineX, lineTop);
        ctx.lineTo(lineX, lineBottom);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Flecha vertical de carga descendente
        ctx.beginPath();
        ctx.moveTo(lineX, lineBottom);
        ctx.lineTo(lineX - 6, lineBottom - 10);
        ctx.lineTo(lineX + 6, lineBottom - 10);
        ctx.closePath();
        ctx.fillStyle = '#FBBF24';
        ctx.fill();

        if (options.showLeverArms) {
          // Brazo de momento a Hombro (azul)
          drawSegment(pSh, { x: lineX, y: pSh.y, score: pSh.score }, '#3B82F6', true);
          // Brazo de momento a Codo (verde)
          drawSegment(pEl, { x: lineX, y: pEl.y, score: pEl.score }, '#10B981', true);

          if (options.showCanvasText) {
            const dSh = Math.round(
              ((frame.moment_arms?.d_shoulder ?? (Math.abs(pSh.x - lineX) / (drawW * 0.4))) * 100) || 28
            );
            const dEl = Math.round(
              (((frame.moment_arms as any)?.d_elbow ?? (Math.abs(pEl.x - lineX) / (drawW * 0.4))) * 100) || 14
            );

            const midShX = (pSh.x + lineX) / 2;
            const midElX = (pEl.x + lineX) / 2;

            // Separación vertical anti-colisión
            let tagShY = pSh.y - 18;
            let tagElY = pEl.y - 18;
            if (Math.abs(tagShY - tagElY) < 28) {
              if (tagShY <= tagElY) {
                tagShY -= 14;
                tagElY += 14;
              } else {
                tagShY += 14;
                tagElY -= 14;
              }
            }

            drawPillTag(midShX - 28, tagShY, `d_hombro: ${dSh}`, '#3B82F6', '#93C5FD');
            drawPillTag(midElX - 28, tagElY, `d_codo: ${dEl}`, '#10B981', '#6EE7B7');
          }
        }
      } else if (!isHipThrust) {
        // TREN INFERIOR CON CARGA VERTICAL (Sentadilla, Prensa, Hack, RDL, Búlgara, etc.):
        drawPoint(pHp, '#3B82F6');
        drawPoint(pKn, '#10B981');
        drawPoint(pAk, '#38BDF8');
        drawPoint(pWr, '#FBBF24');

        const rawLineX = (pWr.score !== undefined && pWr.score > 0.35) ? pWr.x : pAk.x;
        if (smoothLineXRef.current === null || isNaN(smoothLineXRef.current)) {
          smoothLineXRef.current = rawLineX;
        } else {
          smoothLineXRef.current = smoothLineXRef.current * 0.85 + rawLineX * 0.15;
        }
        const lineX = smoothLineXRef.current;

        const lineTop = Math.max(offsetY + 10, Math.min(pHp.y, pWr.y) - 60);
        const lineBottom = Math.min(offsetY + drawH - 10, Math.max(pHp.y, pKn.y, pAk.y) + 30);

        ctx.beginPath();
        ctx.setLineDash([6, 3]);
        ctx.moveTo(lineX, lineTop);
        ctx.lineTo(lineX, lineBottom);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Flecha vertical de carga descendente
        ctx.beginPath();
        ctx.moveTo(lineX, lineBottom);
        ctx.lineTo(lineX - 6, lineBottom - 10);
        ctx.lineTo(lineX + 6, lineBottom - 10);
        ctx.closePath();
        ctx.fillStyle = '#FBBF24';
        ctx.fill();

        if (options.showLeverArms) {
          // Brazo de momento a la cadera (azul)
          drawSegment(pHp, { x: lineX, y: pHp.y, score: pHp.score }, '#3B82F6', true);
          // Brazo de momento a la rodilla (verde)
          drawSegment(pKn, { x: lineX, y: pKn.y, score: pKn.score }, '#10B981', true);

          if (options.showCanvasText) {
            const midHipX = (pHp.x + lineX) / 2;
            const midKnX = (pKn.x + lineX) / 2;

            // Separación vertical anti-colisión
            let tagHipY = pHp.y - 18;
            let tagKnY = pKn.y - 18;
            if (Math.abs(tagHipY - tagKnY) < 28) {
              if (tagHipY <= tagKnY) {
                tagHipY -= 14;
                tagKnY += 14;
              } else {
                tagHipY += 14;
                tagKnY -= 14;
              }
            }

            drawPillTag(
              midHipX - 28,
              tagHipY,
              `d_cadera: ${Math.round(((frame.moment_arms?.d_hip) || 0) * 100)}`,
              '#3B82F6',
              '#93C5FD'
            );

            drawPillTag(
              midKnX - 28,
              tagKnY,
              `d_rodilla: ${Math.round(((frame.moment_arms?.d_knee) || 0) * 100)}`,
              '#10B981',
              '#6EE7B7'
            );
          }
        }
      } else {
        // VARIANTES DE HIP THRUST / PUENTE DE GLÚTEO:
        // No se dibujan brazos de momento ni línea de carga vertical
        drawPoint(pHp, '#38BDF8');
        drawPoint(pKn, '#10B981');
        drawPoint(pAk, '#38BDF8');

        drawAngleArc(pKn, pHp, pAk, 22, '#10B981');
        drawAngleArc(pHp, pSh, pKn, 22, '#38BDF8');

        if (options.showCanvasText) {
          drawPillTag(
            pKn.x - 70,
            pKn.y - 14,
            `Alineación Rodilla: ${Math.round(frame.secondary_angle || 90)}°`,
            '#10B981',
            '#6EE7B7'
          );
          drawPillTag(
            pHp.x - 65,
            pHp.y - 18,
            `Bloqueo Cadera: ${Math.round(frame.main_angle || 180)}°`,
            '#38BDF8',
            '#93C5FD'
          );
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

  const safeExerciseId = String(selectedExerciseId || activeExercise?.id || 'hip_thrust').toLowerCase();
  const safePatternId = String(selectedPattern?.id || '').toLowerCase();

  const kinematicMeta = useMemo(() => {
    const groupId = selectedMuscleGroupId || 'glutes_hamstrings';
    const exId = safeExerciseId;

    if (groupId === 'chest' || exId.includes('bench') || exId.includes('chest') || exId.includes('pec') || exId.includes('dip')) {
      return {
        isLowerBody: false,
        primaryJointName: 'Codo',
        secondaryJointName: 'Hombro',
        primaryMetric: 'Flexión/Extensión Codo',
        secondaryMetric: 'Apertura Glenohumeral',
        dominantLabel: 'Pectoral Mayor',
        rows: [
          { label: 'Alineación Glenohumeral:', value: 'Ángulo codo-torso ~50°-60° (sin pinzamiento)', color: 'text-emerald-400' },
          { label: 'Bloqueo Concéntrico:', value: 'Extensión completa sin hiperextensión pasiva', color: 'text-cyan-300' },
          { label: 'Control Excéntrico:', value: 'Descenso sostenido con escápulas retraídas', color: 'text-slate-200' },
        ],
        torqueTitle: 'Reparto de Torque y Palancas',
        torqueShare: '76% Pectoral vs 24% Tríceps / Hombro',
        barLabel1: 'Brazo Pectoral',
        barLabel2: 'Brazo Tríceps',
        torqueFocus: 'PECTORAL MAYOR'
      };
    }
    if (groupId === 'back' || exId.includes('row') || exId.includes('pulldown') || exId.includes('pullup') || exId.includes('pullover')) {
      return {
        isLowerBody: false,
        primaryJointName: 'Codo',
        secondaryJointName: 'Torso',
        primaryMetric: 'Tracción de Codo',
        secondaryMetric: 'Inclinación de Torso',
        dominantLabel: 'Dorsal Ancho',
        rows: [
          { label: 'Retracción Escapular:', value: 'Depresión y aducción escapular activa', color: 'text-emerald-400' },
          { label: 'Rigidez de Torso:', value: 'Columna neutra sin balanceo lumbar', color: 'text-cyan-300' },
          { label: 'Recorrido de Tracción:', value: 'Codos superando la línea del torso', color: 'text-slate-200' },
        ],
        torqueTitle: 'Reparto de Palanca y Tracción',
        torqueShare: '82% Dorsal Ancho vs 18% Flexores de Codo',
        barLabel1: 'Brazo Dorsal',
        barLabel2: 'Brazo Bíceps',
        torqueFocus: 'DORSAL ANCHO'
      };
    }
    if (groupId === 'shoulders' || exId.includes('shoulder') || exId.includes('overhead') || exId.includes('lateral') || exId.includes('raise') || exId.includes('face_pull') || exId.includes('rear_delt')) {
      const isRaise = exId.includes('lateral') || exId.includes('raise') || exId.includes('rear_delt');
      return {
        isLowerBody: false,
        primaryJointName: isRaise ? 'Hombro' : 'Codo',
        secondaryJointName: isRaise ? 'Torso' : 'Hombro',
        primaryMetric: isRaise ? 'Abducción Humeral' : 'Empuje Vertical',
        secondaryMetric: isRaise ? 'Estabilidad Torso' : 'Plano Escapular',
        dominantLabel: 'Deltoides',
        rows: [
          { label: 'Plano Escapular:', value: 'Húmero guiado en 30° anterior', color: 'text-emerald-400' },
          { label: 'Estabilidad de Torso:', value: 'Pelvis y columna neutras sin arqueo lumbar', color: 'text-cyan-300' },
          { label: 'Bloqueo Articular:', value: 'Carga centrada sobre coronilla', color: 'text-slate-200' },
        ],
        torqueTitle: 'Enfoque Muscular y Palanca',
        torqueShare: '85% Deltoides vs 15% Asistente',
        barLabel1: 'Brazo Deltoides',
        barLabel2: 'Brazo Asistente',
        torqueFocus: 'DELTOIDES'
      };
    }
    if (groupId === 'quadriceps' || groupId === 'quads' || exId.includes('squat') || exId.includes('hack') || exId.includes('leg_press') || exId.includes('bulgarian') || exId.includes('leg_extension')) {
      return {
        isLowerBody: true,
        primaryJointName: 'Rodilla',
        secondaryJointName: 'Cadera',
        primaryMetric: 'Flexión de Rodilla',
        secondaryMetric: 'Flexión de Cadera',
        dominantLabel: 'Cuádriceps',
        rows: [
          { label: 'Profundidad Articular:', value: 'Pliegue de cadera bajo la rodilla (≤90°)', color: 'text-emerald-400' },
          { label: 'Desplazamiento Tibial:', value: 'Avance de rodilla coordinado sobre empeine', color: 'text-cyan-300' },
          { label: 'Estabilidad de Apoyo:', value: 'Apoyo plantar trípode firme sin valgo', color: 'text-slate-200' },
        ],
        torqueTitle: 'Reparto de Torque y Palancas',
        torqueShare: '78% Rodilla (Cuádriceps) vs 22% Cadera (Glúteo)',
        barLabel1: 'Brazo Rodilla',
        barLabel2: 'Brazo Cadera',
        torqueFocus: 'CUÁDRICEPS'
      };
    }
    if (groupId === 'arms' || exId.includes('biceps') || exId.includes('triceps') || exId.includes('curl') || exId.includes('pushdown')) {
      const isTriceps = exId.includes('triceps') || exId.includes('pushdown') || exId.includes('skull');
      return {
        isLowerBody: false,
        primaryJointName: 'Codo',
        secondaryJointName: 'Hombro',
        primaryMetric: 'Flexión / Extensión',
        secondaryMetric: 'Oscilación Humeral',
        dominantLabel: isTriceps ? 'Tríceps Braquial' : 'Bíceps Braquial',
        rows: [
          { label: 'Aislamiento Humeral:', value: 'Codos bloqueados al torso sin balanceo', color: 'text-emerald-400' },
          { label: 'Rango de Movimiento:', value: 'Flexión y extensión articular completa', color: 'text-cyan-300' },
          { label: 'Tensión Continua:', value: 'Cadencia sostenida sin tirones inerciales', color: 'text-slate-200' },
        ],
        torqueTitle: 'Aislamiento y Palanca',
        torqueShare: '90% Brazo vs 10% Inercia / Balanceo',
        barLabel1: isTriceps ? 'Tríceps' : 'Bíceps',
        barLabel2: 'Inercia',
        torqueFocus: isTriceps ? 'TRÍCEPS BRAQUIAL' : 'BÍCEPS BRAQUIAL'
      };
    }
    // Default Glúteo e Isquios
    const isCurl = exId.includes('curl');
    return {
      isLowerBody: true,
      primaryJointName: isCurl ? 'Rodilla' : 'Cadera',
      secondaryJointName: isCurl ? 'Cadera' : 'Rodilla',
      primaryMetric: isCurl ? 'Flexión Isquios' : 'Extensión de Cadera',
      secondaryMetric: isCurl ? 'Estabilidad Pelvis' : 'Alineación Tibial',
      dominantLabel: 'Glúteo Mayor',
      rows: [
        { label: 'Estabilidad Tibial:', value: 'Vertical fija (sin deslizamiento anterior)', color: 'text-emerald-400' },
        { label: 'Bloqueo Pélvico:', value: 'Retroversión completa en lockout (≥158°)', color: 'text-cyan-300' },
        { label: 'Control Excéntrico:', value: 'Cadencia sostenida con bisagra de cadera', color: 'text-slate-200' },
      ],
      torqueTitle: 'Palanca Articular y Enfoque',
      torqueShare: 'Alineación Tibial: ~90° en rodilla',
      barLabel1: 'Extensión Cadera',
      barLabel2: 'Alineación Tibial',
      torqueFocus: 'GLÚTEO MAYOR'
    };
  }, [selectedMuscleGroupId, selectedExerciseId]);

  const primaryJointName = kinematicMeta.primaryJointName;
  const secondaryJointName = kinematicMeta.secondaryJointName;
  const isLowerBody = kinematicMeta.isLowerBody;

  const isHipThrustVariant =
    selectedMuscleGroupId === 'glutes_hamstrings' && (
      safeExerciseId.includes('hip_thrust') ||
      safeExerciseId.includes('kas') ||
      safeExerciseId.includes('bridge') ||
      (activeExercise?.patternId && activeExercise.patternId.includes('hip_thrust'))
    );

  // Dynamically calculate leverage and moment arm share for Upper Body or Lower Body
  const d_hip_val = currentFrame?.moment_arms?.d_hip ?? 0.14;
  const d_knee_val = currentFrame?.moment_arms?.d_knee ?? 0.12;
  const d_sh_val = currentFrame?.moment_arms?.d_shoulder ?? 0.15;
  const d_el_val = (currentFrame?.moment_arms as any)?.d_elbow ?? 0.08;

  let shoulderShare = 76;
  let elbowShare = 24;
  if (d_sh_val + d_el_val > 0.005) {
    shoulderShare = Math.max(10, Math.min(90, Math.round((d_sh_val / (d_sh_val + d_el_val)) * 100)));
    elbowShare = 100 - shoulderShare;
  }

  let hipShare = 55;
  let kneeShare = 45;
  if (d_hip_val + d_knee_val > 0.005) {
    hipShare = Math.max(10, Math.min(90, Math.round((d_hip_val / (d_hip_val + d_knee_val)) * 100)));
    kneeShare = 100 - hipShare;
  }

  let primaryLeverName = 'Brazo Cadera';
  let secondaryLeverName = 'Brazo Rodilla';
  let primaryLeverShare = hipShare;
  let secondaryLeverShare = kneeShare;
  let torqueBadgeText = `${hipShare}% Cadera vs ${kneeShare}% Rodilla`;

  const rawVerdict = currentFrame?.verdict;
  const curElbowDeg = currentFrame ? currentFrame.main_angle : (rawVerdict?.inflection_elbow_deg || 90.0);

  if (!isLowerBody) {
    if (selectedMuscleGroupId === 'chest' || safeExerciseId.includes('bench') || safeExerciseId.includes('chest') || safeExerciseId.includes('press')) {
      let pectShare = 78;
      let tricShare = 22;
      if (rawVerdict?.pectoral_share && rawVerdict?.triceps_share) {
        pectShare = Math.round(rawVerdict.pectoral_share);
        tricShare = Math.round(rawVerdict.triceps_share);
      } else {
        if (curElbowDeg < 78) {
          tricShare = Math.min(68, Math.round(52 + (78 - curElbowDeg) * 1.1));
          pectShare = 100 - tricShare;
        } else if (curElbowDeg <= 96) {
          pectShare = Math.min(84, Math.round(76 + (96 - Math.abs(curElbowDeg - 88)) * 0.7));
          tricShare = 100 - pectShare;
        } else {
          pectShare = 72;
          tricShare = 28;
        }
      }
      primaryLeverName = 'Brazo Pectoral';
      secondaryLeverName = 'Brazo Tríceps';
      primaryLeverShare = pectShare;
      secondaryLeverShare = tricShare;
      torqueBadgeText = `${pectShare}% Pectoral vs ${tricShare}% Tríceps`;
    } else if (selectedMuscleGroupId === 'back' || safeExerciseId.includes('row') || safeExerciseId.includes('pull')) {
      let dorsShare = 82;
      let bicShare = 18;
      if (rawVerdict?.dorsal_share && rawVerdict?.biceps_share) {
        dorsShare = Math.round(rawVerdict.dorsal_share);
        bicShare = Math.round(rawVerdict.biceps_share);
      } else {
        if (curElbowDeg < 80) {
          bicShare = Math.min(65, Math.round(50 + (80 - curElbowDeg) * 1.0));
          dorsShare = 100 - bicShare;
        } else if (curElbowDeg <= 112) {
          dorsShare = Math.min(88, Math.round(82 + (112 - Math.abs(curElbowDeg - 95)) * 0.5));
          bicShare = 100 - dorsShare;
        } else {
          dorsShare = 75;
          bicShare = 25;
        }
      }
      primaryLeverName = 'Brazo Dorsal';
      secondaryLeverName = 'Brazo Bíceps';
      primaryLeverShare = dorsShare;
      secondaryLeverShare = bicShare;
      torqueBadgeText = `${dorsShare}% Dorsal vs ${bicShare}% Bíceps`;
    } else if (selectedMuscleGroupId === 'shoulders') {
      primaryLeverName = 'Brazo Deltoides';
      secondaryLeverName = 'Brazo Asistente';
      primaryLeverShare = shoulderShare;
      secondaryLeverShare = elbowShare;
      torqueBadgeText = `${shoulderShare}% Deltoides vs ${elbowShare}% Asistente`;
    } else {
      primaryLeverName = 'Brazo Principal';
      secondaryLeverName = 'Inercia';
      primaryLeverShare = 90;
      secondaryLeverShare = 10;
      torqueBadgeText = '90% Aislamiento vs 10% Inercia';
    }
  } else if (selectedMuscleGroupId === 'quadriceps' || selectedMuscleGroupId === 'quads') {
    primaryLeverName = 'Brazo Rodilla';
    secondaryLeverName = 'Brazo Cadera';
    primaryLeverShare = kneeShare;
    secondaryLeverShare = hipShare;
    torqueBadgeText = `${kneeShare}% Rodilla vs ${hipShare}% Cadera`;
  }

  // Active verdict read directly from frozen rep verdict with high-confidence fallbacks
  const activeVerdict = {
    status: rawVerdict?.status || 'OPTIMAL',
    dominant_joint: (rawVerdict?.dominant_joint && rawVerdict.dominant_joint !== 'NEUTRO')
      ? rawVerdict.dominant_joint
      : kinematicMeta.dominantLabel.toUpperCase(),
    target_alignment: rawVerdict?.target_alignment ?? true,
    primary_torque_bias: (rawVerdict?.primary_torque_bias && rawVerdict.primary_torque_bias !== 'CALIBRANDO')
      ? rawVerdict.primary_torque_bias
      : kinematicMeta.torqueFocus,
    inflection_knee_deg: rawVerdict?.inflection_knee_deg ?? 90.0,
    inflection_hip_deg: rawVerdict?.inflection_hip_deg ?? 180.0,
    inflection_elbow_deg: rawVerdict?.inflection_elbow_deg ?? curElbowDeg,
    pectoral_share: rawVerdict?.pectoral_share,
    triceps_share: rawVerdict?.triceps_share,
    dorsal_share: rawVerdict?.dorsal_share,
    biceps_share: rawVerdict?.biceps_share,
    d_hip_norm: rawVerdict?.d_hip_norm ?? 0.14,
    d_knee_norm: rawVerdict?.d_knee_norm ?? 0.12,
    recommendation: (rawVerdict?.recommendation && !rawVerdict.recommendation.includes('Mapeando cinemática'))
      ? rawVerdict.recommendation
      : (!isLowerBody
        ? (selectedMuscleGroupId === 'chest'
          ? (curElbowDeg < 78
            ? `Ángulo de codo cerrado (${Math.round(curElbowDeg)}° < 78°): sobrecarga mecánica en Tríceps Braquial. Abre el agarre o separa codos ~50°-60° para aislar Pectoral Mayor.`
            : `Palanca óptima sobre Pectoral Mayor (~${Math.round(curElbowDeg)}° en codo): antebrazo perpendicular con mínima palanca parásita de tríceps.`)
          : selectedMuscleGroupId === 'back'
          ? (curElbowDeg < 80
            ? `Codos excesivamente flexionados (${Math.round(curElbowDeg)}° < 80°): tirón excesivo de brazos que sobrecarga Bíceps. Conduce codos hacia la cadera para aislar Dorsal Ancho.`
            : `Tracción óptima de Dorsal Ancho (~${Math.round(curElbowDeg)}° en codo): codos cerrados hacia la pelvis con máxima activación dorsal.`)
          : 'Trayectoria vertical centrada en el plano escapular con tronco rígido para optimizar torque en deltoides.')
        : 'Alineación articular óptima (~90° en rodilla). Bloqueo concéntrico directo sin compensación lumbar.')
  };

  // Real clinical statistics from repetition summaries
  const minRomAngle = analysisData?.repetitions_summary?.length
    ? Math.round(Math.min(...analysisData.repetitions_summary.map(r => r.min_primary_angle)))
    : (currentFrame ? Math.round(currentFrame.main_angle) : 0);
  const maxRomAngle = analysisData?.repetitions_summary?.length
    ? Math.round(Math.max(...analysisData.repetitions_summary.map(r => r.max_primary_angle)))
    : (currentFrame ? Math.round(currentFrame.main_angle) : 0);
  const deltaRom = Math.max(0, maxRomAngle - minRomAngle);

  const avgEccentric = analysisData?.repetitions_summary?.length
    ? (analysisData.repetitions_summary.reduce((acc, r) => acc + (r.eccentric_sec || 0), 0) / analysisData.repetitions_summary.length).toFixed(1)
    : '1.8';
  const avgPause = analysisData?.repetitions_summary?.length
    ? (analysisData.repetitions_summary.reduce((acc, r) => acc + (r.pause_sec || 0), 0) / analysisData.repetitions_summary.length).toFixed(1)
    : '0.4';
  const avgConcentric = analysisData?.repetitions_summary?.length
    ? (analysisData.repetitions_summary.reduce((acc, r) => acc + (r.concentric_sec || 0), 0) / analysisData.repetitions_summary.length).toFixed(1)
    : '1.1';

  // Velocity Based Training (VBT) & Intensity metrics
  const intensity = analysisData?.intensity_metrics || (() => {
    if (!analysisData?.repetitions_summary?.length) {
      return {
        estimated_rir: 'N/A',
        estimated_rpe: 0,
        velocity_loss_pct: 0,
        first_rep_vel: 0,
        last_rep_vel: 0,
        max_rep_vel: 0,
        rep_velocities: []
      };
    }
    const vels = analysisData.repetitions_summary.map(r => r.concentric_velocity_deg_s || 0).filter(v => v > 0);
    const maxV = vels.length ? Math.max(...vels) : 0;
    const lastV = vels.length ? vels[vels.length - 1] : 0;
    const loss = maxV > 0 ? Math.round(Math.max(0, ((maxV - lastV) / maxV) * 100) * 10) / 10 : 0;
    let rir = '4+';
    let rpe = 6.0;
    if (loss >= 40) { rir = '0'; rpe = 10.0; }
    else if (loss >= 30) { rir = '1'; rpe = 9.0; }
    else if (loss >= 20) { rir = '2'; rpe = 8.0; }
    else if (loss >= 10) { rir = '3'; rpe = 7.0; }
    return {
      estimated_rir: rir,
      estimated_rpe: rpe,
      velocity_loss_pct: loss,
      first_rep_vel: vels[0] || 0,
      last_rep_vel: lastV,
      max_rep_vel: maxV,
      rep_velocities: vels
    };
  })();

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

              {/* Alignment Status Badge + Zoom Controls */}
              <div className="flex items-center gap-2">
                {currentFrame && (
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition ${
                    activeVerdict.status === 'OPTIMAL'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeVerdict.status === 'OPTIMAL' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>{activeVerdict.status === 'OPTIMAL' ? '✓ Alineación Articular Óptima' : '⚠️ Ajustar Alineación'}</span>
                  </span>
                )}

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

              {/* Ready to Analyze Overlay / Call to Action */}
              {uploadedVideoUrl && pipelineState === 'idle' && !analysisData && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-20">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="text-sm font-black text-white">Recorte Previo y Configuración</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ajusta los deslizadores de inicio ({trimStart.toFixed(1)}s) y fin ({trimEnd.toFixed(1)}s) en el panel inferior para delimitar la serie de trabajo. Selecciona el ejercicio a la derecha y pulsa iniciar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-cyan-500/30 transition transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Iniciar Análisis Biomecánico</span>
                  </button>
                </div>
              )}

              {/* HUD Telemetry Badges */}
              {pipelineState === 'ready' && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 pointer-events-none z-10">
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold shadow-md">
                    {currentFrame && currentFrame.rep_number > 0 ? `REP: #${currentFrame.rep_number}` : 'PREPARACIÓN'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold shadow-md">
                    {currentFrame?.phase || 'IDLE'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold shadow-md">
                    {primaryJointName}: {Math.round(currentFrame?.main_angle ?? currentPrimaryAngle)}° · {secondaryJointName}: {Math.round(currentFrame?.secondary_angle ?? 0)}°
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
                      {showTrimmer ? 'Ocultar' : '✂️ Recortar tramo'}
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
                        onClick={handleStartAnalysis}
                        disabled={pipelineState === 'compressing' || pipelineState === 'analyzing'}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${pipelineState === 'analyzing' ? 'animate-spin' : ''}`} />
                        <span>{analysisData ? 'Re-analizar tramo' : 'Iniciar Análisis Biomecánico'}</span>
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

            {/* DYNAMIC MODE-SEPARATED METRIC CARDS */}
            {analysisMode === 'technique' ? (
              <>
                {/* CARD 1: Diagnóstico Postural Clínico */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Diagnóstico Postural
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      activeVerdict.status === 'OPTIMAL'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {activeVerdict.status === 'OPTIMAL' ? '✓ Óptimo' : '⚠️ Oportunidad'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed break-words whitespace-normal">
                    {activeVerdict.recommendation}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-800/60 text-[11px]">
                    {kinematicMeta.rows.map((row: { label: string; value: string; color: string }, rIdx: number) => (
                      <div key={rIdx} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5 text-slate-400 leading-relaxed">
                        <span className="font-medium text-slate-300">{row.label}</span>
                        <span className={`font-bold ${row.color} break-words whitespace-normal`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD 2: Métricas de Ejecución Técnica (ROM y Tempo Real) */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      Métricas de Ejecución Técnica
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {analysisData?.total_reps ?? 0} Reps Validadas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Rango de Movimiento (ROM)</span>
                      <span className="text-sm font-black text-cyan-300 font-mono">
                        {minRomAngle}° → {maxRomAngle}°
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Δ Recorrido: {deltaRom}°</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Tempo Medio Real</span>
                      <div className="text-[11px] font-mono text-slate-200 mt-1 space-y-0.5">
                        <div>Excéntrica: <strong className="text-cyan-300">{avgEccentric}s</strong></div>
                        <div>Pausa: <strong className="text-purple-300">{avgPause}s</strong></div>
                        <div>Concéntrica: <strong className="text-emerald-300">{avgConcentric}s</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* CARD 1: Reparto de Torque y Palancas Articulares */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-blue-400" />
                      {isHipThrustVariant ? 'Palanca Articular y Enfoque' : kinematicMeta.torqueTitle}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {isHipThrustVariant ? `Rodilla ~${Math.round(activeVerdict.inflection_knee_deg || 90)}°` : torqueBadgeText}
                    </span>
                  </div>

                  {/* Moment Arms Distribution Bar - Only shown for non-hip thrust exercises */}
                  {!isHipThrustVariant ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                        <span>{primaryLeverName}: {primaryLeverShare}%</span>
                        <span>{secondaryLeverName}: {secondaryLeverShare}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div className="bg-blue-500 transition-all duration-150" style={{ width: `${primaryLeverShare}%` }} />
                        <div className="bg-emerald-500 transition-all duration-150" style={{ width: `${secondaryLeverShare}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Alineación Tibial (Rodilla):</span>
                      <span className="font-bold text-cyan-300">{Math.round(activeVerdict.inflection_knee_deg || 90)}° (Objetivo ~90°)</span>
                    </div>
                  )}

                  {/* Physical Quantities Grid */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Dominancia</span>
                      <span className="text-xs font-black text-cyan-300 font-mono truncate block" title={activeVerdict.dominant_joint}>
                        {activeVerdict.dominant_joint}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Enfoque Muscular</span>
                      <span className="text-[11px] font-black text-purple-300 font-mono break-words block" title={activeVerdict.primary_torque_bias}>
                        {activeVerdict.primary_torque_bias}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Reps</span>
                      <span className="text-xs font-black text-emerald-300 font-mono">{analysisData?.total_reps ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Intensidad Estimada (VBT) */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Intensidad Estimada (VBT)
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      intensity.estimated_rpe >= 9
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : intensity.estimated_rpe >= 8
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      RIR {intensity.estimated_rir} · RPE {intensity.estimated_rpe.toFixed(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Pérdida de Velocidad</span>
                      <span className="text-sm font-black text-amber-300 font-mono">
                        -{intensity.velocity_loss_pct}%
                      </span>
                      <span className="text-[9px] text-slate-500 block">Fatiga concéntrica en serie</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Velocidad Ini / Fin</span>
                      <span className="text-sm font-black text-cyan-300 font-mono">
                        {Math.round(intensity.first_rep_vel)}°/s → {Math.round(intensity.last_rep_vel)}°/s
                      </span>
                      <span className="text-[9px] text-slate-500 block">Velocidad angular media</span>
                    </div>
                  </div>

                  {/* Mini SVG Sparkline / Bar Chart */}
                  {intensity.rep_velocities && intensity.rep_velocities.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold">
                        <span>Curva de Fatiga Concéntrica</span>
                        <span className="text-cyan-400">Pico: {Math.round(intensity.max_rep_vel)}°/s</span>
                      </div>

                      {/* Visible SVG Sparkline Curve with Area Fill */}
                      <div className="w-full h-11 relative flex items-center">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const vels = intensity.rep_velocities;
                            const maxV = Math.max(...vels, 1);
                            const minV = Math.min(...vels, 0);
                            const rangeV = Math.max(maxV - minV, 10);
                            const pts = vels.map((v, i) => {
                              const x = vels.length === 1 ? 50 : (i / (vels.length - 1)) * 94 + 3;
                              const y = 32 - ((v - minV) / rangeV) * 26;
                              return { x, y, v };
                            });
                            const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
                            const areaD = `${pathD} L ${pts[pts.length - 1].x.toFixed(1)} 36 L ${pts[0].x.toFixed(1)} 36 Z`;
                            return (
                              <>
                                <path d={areaD} fill="url(#fatigueGrad)" />
                                <path d={pathD} fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                {pts.map((p, i) => (
                                  <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r="2.5"
                                    className={i === vels.length - 1 && intensity.velocity_loss_pct >= 20 ? 'fill-amber-400' : 'fill-cyan-300'}
                                    stroke="#0F172A"
                                    strokeWidth="1"
                                  />
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Rep Bar Indicators with guaranteed heights */}
                      <div className="h-6 w-full flex items-end gap-1.5 pt-0.5">
                        {intensity.rep_velocities.map((vel, idx) => {
                          const maxV = intensity.max_rep_vel || 1;
                          const barHeightPct = Math.max(25, Math.min(100, Math.round((vel / maxV) * 100)));
                          const isLast = idx === intensity.rep_velocities.length - 1;
                          return (
                            <div
                              key={idx}
                              className="flex-1 h-full flex flex-col justify-end items-center gap-0.5 group relative"
                            >
                              <div
                                className={`w-full rounded-t transition-all duration-300 ${
                                  isLast && intensity.velocity_loss_pct >= 20
                                    ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                                    : 'bg-gradient-to-t from-cyan-600 to-blue-400'
                                }`}
                                style={{ height: `${barHeightPct}%`, minHeight: '6px' }}
                              />
                              <span className="text-[8px] font-mono text-slate-400 group-hover:text-white">
                                #{idx + 1}
                              </span>
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 whitespace-nowrap z-30 shadow-lg">
                                {Math.round(vel)}°/s
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 3: Ajuste Mecánico Recomendado */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-amber-400" />
                      Ajuste Mecánico Recomendado
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed break-words whitespace-normal">
                    {activeVerdict.recommendation || "Alineación articular óptima (~90° en rodilla): máxima palanca sobre el glúteo mayor."}
                  </div>
                </div>
              </>
            )}

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
                  <div className="px-3 pb-3 pt-1 max-h-48 overflow-y-auto space-y-1.5 border-t border-slate-800">
                    {analysisData.repetitions_summary.map((rep) => (
                      <button
                        key={rep.rep_number}
                        type="button"
                        onClick={() => {
                          if (videoElementRef.current) {
                            videoElementRef.current.currentTime = rep.start_time;
                            videoElementRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 transition flex items-center justify-between text-xs text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 group-hover:border-cyan-400">
                            #{rep.rep_number}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-slate-300">
                              Concéntrico: <strong className="text-emerald-400">{rep.concentric_time_s ?? rep.concentric_sec}s</strong> · Excéntrico: <span className="text-slate-400">{rep.eccentric_time_s ?? rep.eccentric_sec}s</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Velocidad: <strong className="text-cyan-300">{rep.concentric_velocity_deg_s ? `${rep.concentric_velocity_deg_s}°/s` : '—'}</strong>
                              {rep.pause_time_s ? ` · Pausa: ${rep.pause_time_s}s` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rep.verdict.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {rep.verdict.dominant_joint}
                          </span>
                          <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                        </div>
                      </button>
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

export const VideoPoseAnalysisModal: React.FC<VideoPoseAnalysisModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ErrorBoundary onReset={props.onClose}>
      <VideoPoseAnalysisModalInner {...props} />
    </ErrorBoundary>
  );
};
