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
  Loader2,
  Eye,
  EyeOff,
  Dna,
  Flame
} from 'lucide-react';
import { AnthropometricProfileModal } from './AnthropometricProfileModal';
import { EffectiveVolumeAudit } from './EffectiveVolumeAudit';
import { prepareVideoForAnalysis } from '../utils/videoCompressor';
import {
  analyzeVideoWithModal,
  BiomechanicsAnalysisResponse,
  BiomechanicsFrame,
  ExerciseConfig,
  IntensityMetrics,
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
      { id: 'chest_dips', name: 'Fondos en Paralelas para Pecho', exerciseType: 'chest_dips', targetMuscle: 'pectorals', loadType: 'gravity', patternId: 'dips_chest_lean' },
      { id: 'machine_dips', name: 'Fondos en Máquina para Pecho', exerciseType: 'machine_dips', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'dips_chest_lean' }
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

  const baseFrame = alpha < 0.5 ? f0 : f1;
  return {
    ...baseFrame,
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

  // VBT & Clinical Personalization States
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);
  const [targetReps, setTargetReps] = useState<number | undefined>(undefined);
  const [showAnthropometryModal, setShowAnthropometryModal] = useState<boolean>(false);
  const [showVolumeAuditModal, setShowVolumeAuditModal] = useState<boolean>(false);
  const [showGhostSkeleton, setShowGhostSkeleton] = useState<boolean>(false);
  const [previousSessionData, setPreviousSessionData] = useState<any>(null);

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
  const smoothLineYRef = useRef<number | null>(null);

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

  // Load previous session for ghost skeleton
  useEffect(() => {
    const exId = selectedExerciseId || activeExercise?.id || 'exercise';
    try {
      const saved = localStorage.getItem(`biomechanics_history_${exId}`);
      if (saved) {
        setPreviousSessionData(JSON.parse(saved));
      } else {
        setPreviousSessionData(null);
      }
    } catch (e) {
      setPreviousSessionData(null);
    }
  }, [selectedExerciseId, activeExercise]);

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
      setPipelineMessage('Procesando cinemática clínica en GPU Serverless (RT-DETR + ViTPose 2D + SciPy)...');

      let backendLoad = 'free_weight';
      if (load === 'cable') backendLoad = 'cable';
      else if (load === 'machine') backendLoad = 'machine';

      let userProfile = null;
      try {
        const pSaved = localStorage.getItem('client_anthropometric_profile');
        if (pSaved) userProfile = JSON.parse(pSaved);
      } catch (e) {}

      const config: ExerciseConfig = {
        exerciseType: exType,
        targetMuscle: muscle,
        loadType: backendLoad,
        weightKg: weightKg && weightKg > 0 ? weightKg : undefined,
        targetReps: targetReps && targetReps > 0 ? targetReps : undefined,
        anthropometry: userProfile
      };

      const result = await analyzeVideoWithModal(blob, config, fileId, { range });
      setAnalysisData(result);
      setRepCount(result.total_reps);
      setPipelineState('ready');
      setPipelineMessage('');

      // Persist session to local history for zero-storage ghost comparison
      try {
        const histKey = `biomechanics_history_${exType}`;
        const lastVerdict = result.repetitions_summary?.[result.repetitions_summary.length - 1]?.verdict;
        const dSh = lastVerdict?.d_shoulder_norm || 0;
        const dEl = lastVerdict?.d_knee_norm || lastVerdict?.d_hip_norm || 0;
        const totalD = dSh + dEl;
        const primaryPct = totalD > 0 ? Math.round((dSh / totalD) * 100) : 65;

        const allF = result.frames || [];
        const step = Math.max(1, Math.ceil(allF.length / 30));
        const r3 = (n: any) => typeof n === 'number' ? Math.round(n * 1000) / 1000 : n;
        const sampledFrames = allF.filter((_, idx) => idx % step === 0).slice(0, 30).map(f => {
          const kp = f.keypoints_norm || {};
          return {
            time: r3(f.time),
            phase: f.phase,
            main_angle: r3(f.main_angle),
            keypoints_norm: {
              shoulder: kp.shoulder ? { x: r3(kp.shoulder.x), y: r3(kp.shoulder.y) } : undefined,
              elbow: kp.elbow ? { x: r3(kp.elbow.x), y: r3(kp.elbow.y) } : undefined,
              wrist: kp.wrist ? { x: r3(kp.wrist.x), y: r3(kp.wrist.y) } : undefined,
              hip: kp.hip ? { x: r3(kp.hip.x), y: r3(kp.hip.y) } : undefined,
              knee: kp.knee ? { x: r3(kp.knee.x), y: r3(kp.knee.y) } : undefined,
              ankle: kp.ankle ? { x: r3(kp.ankle.x), y: r3(kp.ankle.y) } : undefined
            }
          };
        });

        const histRecord = {
          date: new Date().toISOString(),
          exerciseId: exType,
          weightKg,
          targetReps,
          v_best: result.intensity_metrics?.v_best,
          exact_rir: result.intensity_metrics?.exact_rir,
          exact_rpe: result.intensity_metrics?.exact_rpe,
          torque_split: `${primaryPct}% vs ${100 - primaryPct}%`,
          frames: sampledFrames
        };
        try {
          localStorage.setItem(histKey, JSON.stringify(histRecord));
        } catch (storageErr) {
          try { localStorage.clear(); } catch {}
        }
        setPreviousSessionData(histRecord);
      } catch (e) {
        console.warn('Could not save session to local history', e);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.info('[Pipeline] Análisis cancelado por nueva petición.');
        return;
      }
      console.error('[Pipeline Error]', err);
      setPipelineState('error');
      setPipelineMessage(err?.message || 'Error al conectar con el microservicio GPU.');
    }
  }, [weightKg, targetReps]);

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
      let videoBlobToSend: Blob = file;

      // Always compress client-side to 480p / 15 FPS / 800 kbps to prevent V8 "Invalid string length"
      const isAlreadyTiny = file.size <= 1.5 * 1024 * 1024 && trimStart === 0 && (!trimEnd || trimEnd >= 30);
      if (!isAlreadyTiny) {
        setPipelineMessage(`Optimizando y preparando vídeo (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`);
        const preparedBlob = await prepareVideoForAnalysis(file, { range, maxWidth: 480, targetFps: 15, bitrate: 800_000 });
        videoBlobToSend = preparedBlob;
      }
      compressedBlobRef.current = videoBlobToSend;

      await runPipelineAnalysis(
        videoBlobToSend,
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
      const maxAnalyzedTime = analysisData?.frames?.length
        ? analysisData.frames[analysisData.frames.length - 1].time
        : trimEnd;
      const effectiveLoopEnd = Math.min(trimEnd, maxAnalyzedTime > 0 ? maxAnalyzedTime : trimEnd);
      if (!video.seeking && effectiveLoopEnd > trimStart && (currentTime >= effectiveLoopEnd || currentTime < trimStart - 0.2)) {
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
            showGhost: showGhostSkeleton,
            previousSession: previousSessionData,
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
  }, [analysisData, analysisMode, zoom, panOffset, showLeverArms, showCanvasText, showGhostSkeleton, previousSessionData, selectedMuscleGroupId, selectedExerciseId, activeExercise, trimStart, trimEnd]);

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
      showGhost?: boolean;
      previousSession?: any;
      exerciseId: string;
      muscleGroupId?: string;
    }
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize internal canvas buffer with CSS layout dimensions (unaffected by parent CSS scale transforms)
    const rect = canvas.getBoundingClientRect();
    const cWidth = canvas.clientWidth || (rect.width > 0 ? Math.round(rect.width / Math.max(0.1, zoom)) : 800);
    const cHeight = canvas.clientHeight || (rect.height > 0 ? Math.round(rect.height / Math.max(0.1, zoom)) : 600);
    if (cWidth > 0 && cHeight > 0 && (canvas.width !== cWidth || canvas.height !== cHeight)) {
      canvas.width = cWidth;
      canvas.height = cHeight;
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

    // Note: Zoom & Pan transformation is performed synchronously on the viewport container wrapper

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


    const grpId = options.muscleGroupId || selectedMuscleGroupId || '';
    const exIdStr = String(options.exerciseId || safeExerciseId || '').toLowerCase();

    const pHand = {
      x: pWr.x,
      y: pWr.y,
      score: pWr.score
    };

    const isUpperBody = (
      grpId === 'chest' || grpId === 'back' || grpId === 'shoulders' || grpId === 'arms' ||
      exIdStr.includes('bench') || exIdStr.includes('chest') ||
      (exIdStr.includes('press') && !exIdStr.includes('leg_press')) ||
      exIdStr.includes('row') || exIdStr.includes('pulldown') || exIdStr.includes('pullup') ||
      exIdStr.includes('pullover') || exIdStr.includes('curl') || exIdStr.includes('triceps') ||
      exIdStr.includes('dips') || exIdStr.includes('t_bar') || exIdStr.includes('gironda')
    ) && !exIdStr.includes('leg_press') && !exIdStr.includes('leg_extension');
    const isLowerBody = !isUpperBody;
    const isHipThrust =
      exIdStr.includes('hip_thrust') ||
      exIdStr.includes('kas_glute') ||
      exIdStr.includes('glute_bridge') ||
      exIdStr.includes('bridge') ||
      exIdStr.includes('thrust') ||
      exIdStr.includes('kas') ||
      Boolean((frame as any)?.is_hip_thrust);

    // Check if the exercise is unilateral or detected by backend as unilateral (e.g. seated row with one arm active, one resting)
    const isUnilateralMotion = Boolean((frame as any)?.is_unilateral) || exIdStr.includes('unilateral');
    const isChestOrTBar = exIdStr.includes('press') || exIdStr.includes('bench') || exIdStr.includes('incline') || exIdStr.includes('chest') || exIdStr.includes('dip') || exIdStr.includes('t_bar');
    const hideTorsoLine = Boolean((frame as any)?.hide_torso_line) || isChestOrTBar || (isUpperBody && (pHp.score ?? 0) < 0.60);

    // Torso reference length for anatomical outlier rejection
    const torsoLen = Math.hypot(pSh.x - pHp.x, pSh.y - pHp.y);

    // Lateral profile view check: if horizontal distance between shoulders and hips is small, view is in profile
    const shoulderSpanX = Math.abs(pLSh.x - pRSh.x);
    const hipSpanX = Math.abs(pLHp.x - pRHp.x);
    const isProfileView = isUnilateralMotion || (shoulderSpanX < drawW * 0.08 && hipSpanX < drawW * 0.08);

    // Human outlier span rejection: if shoulders or hips span across > 40% of canvas, it's connecting to background people
    const isSpuriousBackgroundSpan = shoulderSpanX > drawW * 0.40 || hipSpanX > drawW * 0.40;

    // Only mark equipment occluded if body is physically against a chest pad in a machine row
    const isChestSupportedPad = isUpperBody && (
      exIdStr.includes('t_bar') || exIdStr.includes('remo_punta') || (exIdStr.includes('row') && exIdStr.includes('machine'))
    );

    // Anatomical segment check: limb segment must be within plausible human bounds [0.10, 1.15] * torsoLen
    const isLimbPlausible = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      if (torsoLen < 20) return true;
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      return d >= torsoLen * 0.10 && d <= torsoLen * 1.15;
    };

    // Both sides must have reasonable confidence to render bilateral skeleton, otherwise use primary tracked limbs
    const hasBilateral = !isProfileView && !isSpuriousBackgroundSpan && Boolean(
      (kp.left_shoulder?.score ?? 0) >= 0.40 && (kp.right_shoulder?.score ?? 0) >= 0.40 &&
      (kp.left_elbow?.score ?? 0) >= 0.40 && (kp.right_elbow?.score ?? 0) >= 0.40 &&
      isLimbPlausible(pLSh, pLEl) && isLimbPlausible(pRSh, pREl)
    );

    const drawPoint = (p: { x: number; y: number; score?: number }, color: string) => {
      if (p.score !== undefined && p.score < 0.35) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.0, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    };

    const drawSegment = (p1: { x: number; y: number; score?: number }, p2: { x: number; y: number; score?: number }, color: string, dashed: boolean = false) => {
      if ((p1.score !== undefined && p1.score < 0.35) || (p2.score !== undefined && p2.score < 0.35)) return;
      if (!isLimbPlausible(p1, p2)) return; // Suppress spurious limbs connecting to background gym members
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
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      const textW = ctx.measureText(text).width;
      const pillW = textW + 12;
      const pillH = 16;
      const pillX = clampX(x, pillW);
      const pillY = clampY(y, pillH);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.fill();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(text, pillX + 6, pillY + 11);
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

    if (mode === 'technique') {
      // -------------------------------------------------------------
      // MODO 1: CORRECCIÓN TÉCNICA
      // Esqueleto limpio del miembro activo (3.5px) + arco articular y grados
      // OCULTA por completo la flecha amarilla de fuerza y brazos de momento
      // -------------------------------------------------------------
      const drawThickSegment = (p1: { x: number; y: number; score?: number }, p2: { x: number; y: number; score?: number }, color: string) => {
        if ((p1.score !== undefined && p1.score < 0.25) || (p2.score !== undefined && p2.score < 0.25)) return;
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.stroke();
      };

      const drawBigPoint = (p: { x: number; y: number; score?: number }, color: string) => {
        if (p.score !== undefined && p.score < 0.25) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.0, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      };

      // Segmento Cuello-Cabeza y Alineación Cervical
      const currentNeckAngle = typeof (frame as any)?.neck_angle === 'number'
        ? (frame as any).neck_angle
        : (() => {
            const vTx = pSh.x - pHp.x;
            const vTy = pSh.y - pHp.y;
            const vNx = pHd.x - pSh.x;
            const vNy = pHd.y - pSh.y;
            const nT = Math.hypot(vTx, vTy);
            const nN = Math.hypot(vNx, vNy);
            if (nT < 1e-4 || nN < 1e-4) return 0;
            const cosVal = Math.max(-1.0, Math.min(1.0, (vTx * vNx + vTy * vNy) / (nT * nN)));
            return Math.round(Math.acos(cosVal) * (180 / Math.PI));
          })();

      const isNeckHyperextended = currentNeckAngle > 28;
      const neckColor = isNeckHyperextended ? '#EF4444' : '#10B981';

      if ((pHd.score ?? 0) >= 0.20) {
        drawThickSegment(pSh, pHd, neckColor);
        drawBigPoint(pHd, neckColor);
        if (options.showCanvasText && isNeckHyperextended) {
          drawPillTag(pHd.x - 38, pHd.y - 18, `Cuello: +${Math.round(currentNeckAngle)}°`, '#EF4444', '#FCA5A5');
        }
      }

      if (isUpperBody) {
        // Miembro activo: Hombro -> Codo -> Muñeca (grosor 3.5px)
        if (!hideTorsoLine && (pHp.score ?? 0) >= 0.30) {
          drawThickSegment(pSh, pHp, '#10B981');
          drawBigPoint(pHp, '#10B981');
        }
        drawThickSegment(pSh, pEl, '#10B981');
        drawThickSegment(pEl, pWr, '#34D399');
        drawBigPoint(pSh, '#10B981');
        drawBigPoint(pEl, '#10B981');
        drawBigPoint(pWr, '#34D399');

        // Arco articular y etiqueta sobre el codo
        drawAngleArc(pEl, pSh, pWr, 24, '#38BDF8');
        if (options.showCanvasText) {
          const codoAngle = Math.round(frame.main_angle ?? 90);
          drawPillTag(pEl.x - 36, pEl.y - 18, `Codo: ${codoAngle}°`, '#38BDF8', '#38BDF8');
        }
      } else {
        // Miembro activo tren inferior: Hombro -> Cadera -> Rodilla -> Tobillo (grosor 3.5px)
        if (!hideTorsoLine && (pHp.score ?? 0) >= 0.35) {
          drawThickSegment(pSh, pHp, '#10B981');
          drawBigPoint(pSh, '#10B981');
        }
        drawThickSegment(pHp, pKn, '#10B981');
        drawThickSegment(pKn, pAk, '#34D399');
        drawBigPoint(pHp, '#10B981');
        drawBigPoint(pKn, '#10B981');
        drawBigPoint(pAk, '#38BDF8');

        if (isHipThrust) {
          drawAngleArc(pHp, pSh, pKn, 24, '#38BDF8');
          drawAngleArc(pKn, pHp, pAk, 20, '#10B981');
          if (options.showCanvasText) {
            drawPillTag(pHp.x - 42, pHp.y - 18, `Cadera: ${Math.round(frame.main_angle)}°`, '#38BDF8', '#38BDF8');
            drawPillTag(pKn.x - 42, pKn.y - 14, `Rodilla: ${Math.round(frame.secondary_angle)}°`, '#10B981', '#10B981');
          }
        } else {
          drawAngleArc(pKn, pHp, pAk, 24, '#38BDF8');
          if (options.showCanvasText) {
            drawPillTag(pKn.x - 42, pKn.y - 16, `Rodilla: ${Math.round(frame.main_angle)}°`, '#38BDF8', '#38BDF8');
            if (frame.secondary_angle) {
              drawPillTag(pHp.x - 42, pHp.y - 18, `Cadera: ${Math.round(frame.secondary_angle)}°`, '#10B981', '#10B981');
            }
          }
        }
      }

      // Estela suave de trayectoria de la carga (últimos 15 frames de muñeca o cadera)
      if (analysisData?.frames && analysisData.frames.length > 0) {
        const curIdx = frame.frame_idx ?? 0;
        const trailStart = Math.max(0, curIdx - 15);
        const trailJoint = isHipThrust ? 'hip' : 'wrist';

        for (let i = trailStart; i < curIdx; i++) {
          const fPrev = analysisData.frames[i];
          const fNext = analysisData.frames[i + 1];
          if (!fPrev?.keypoints_norm || !fNext?.keypoints_norm) continue;

          const kpPrev = (fPrev.keypoints_norm as any)[trailJoint];
          const kpNext = (fNext.keypoints_norm as any)[trailJoint];
          if (!kpPrev || !kpNext) continue;

          const alpha = ((i - trailStart + 1) / (curIdx - trailStart + 1)) * 0.85;
          ctx.beginPath();
          ctx.moveTo(px(kpPrev.x), py(kpPrev.y));
          ctx.lineTo(px(kpNext.x), py(kpNext.y));
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
    } else {
      // -------------------------------------------------------------
      // MODO 2: OPTIMIZACIÓN BIOMECÁNICA
      // Esqueleto atenuado + Flecha amarilla de fuerza desde la mano + Cotas de brazo de momento (P/T o D/B)
      // -------------------------------------------------------------
      ctx.save();
      ctx.globalAlpha = 0.50;
      if (isLowerBody) {
        if (!hideTorsoLine && (pHp.score ?? 0) >= 0.40) drawSegment(pSh, pHp, '#94A3B8');
        drawSegment(pHp, pKn, '#94A3B8');
        drawSegment(pKn, pAk, '#94A3B8');
        drawPoint(pHp, '#64748B');
        drawPoint(pKn, '#64748B');
        drawPoint(pAk, '#64748B');
      } else {
        if (!hideTorsoLine && (pHp.score ?? 0) >= 0.60) {
          drawSegment(pSh, pHp, '#94A3B8');
          drawPoint(pHp, '#64748B');
        }
        drawSegment(pSh, pEl, '#94A3B8');
        drawSegment(pEl, pWr, '#94A3B8');
        drawPoint(pSh, '#94A3B8');
        drawPoint(pEl, '#94A3B8');
        drawPoint(pWr, '#94A3B8');
      }
      ctx.restore();

      if (!isLowerBody) {
        drawPoint(pHand, '#FBBF24');

        // Vector de fuerza realista y brazos de momento según load_type y cinemática (Controlados por toggle)
        if (options.showLeverArms) {
          const fv = (frame as any).force_vector;
          const isHorizontalResistance = (fv?.direction && fv.direction.startsWith('horizontal')) ||
            ((activeExercise?.loadType === 'machine' || activeExercise?.loadType === 'cable') && (
              grpId === 'back' || exIdStr.includes('row') || exIdStr.includes('t_bar') || exIdStr.includes('gironda') ||
              grpId === 'chest' || exIdStr.includes('press') || exIdStr.includes('fly') || exIdStr.includes('pec_deck')
            ) && !exIdStr.includes('pulldown') && !exIdStr.includes('pullup'));

          const isVerticalUp = (fv?.direction === 'vertical_up') ||
            (exIdStr.includes('pulldown') || exIdStr.includes('pullup'));

          const isBack = grpId === 'back' || exIdStr.includes('row') || exIdStr.includes('t_bar') || exIdStr.includes('gironda') || exIdStr.includes('pull');
          
          // Locked series-wide classification from backend
          let isUpperBackCanvas = false;
          if (isBack) {
            if ((frame as any)?.is_upper_back !== undefined) {
              isUpperBackCanvas = Boolean((frame as any).is_upper_back);
            } else if ((analysisData as any)?.is_upper_back !== undefined) {
              isUpperBackCanvas = Boolean((analysisData as any).is_upper_back);
            } else if (exIdStr.includes('t_bar') || exIdStr.includes('upper_back')) {
              isUpperBackCanvas = true;
            } else {
              const ty = pSh.y - pHp.y;
              const tLen = Math.abs(ty) + 1e-6;
              isUpperBackCanvas = ((pEl.y - pSh.y) < 0.48 * tLen);
            }
          }

          const labelSh = isBack ? (isUpperBackCanvas ? 'Espalda Alta' : 'Dorsal') : 'Pectoral';
          const labelEl = isBack ? 'Bíceps' : 'Tríceps';
          const abbrSh = isBack ? (isUpperBackCanvas ? 'EA' : 'D') : 'P';
          const abbrEl = isBack ? 'B' : 'T';

          const hasExplicitDirection = Boolean(fv?.dx !== undefined && (fv.dx !== 0 || fv.dy !== 0));

          // Directional force vector and moment arms for T-Bar, Machine Press, and Machine Dips
          if (isBack || hasExplicitDirection) {
            let uX = 1;
            let uY = 0;
            if (isBack && (exIdStr.includes('t_bar') || exIdStr.includes('remo_punta') || activeExercise?.loadType === 'machine' || activeExercise?.loadType === 'cable')) {
              // En Remo en T y máquinas de tracción, el vector sigue al antebrazo hacia la máquina (el codo actúa como pivote)
              const vx = pHand.x - pEl.x;
              const vy = pHand.y - pEl.y;
              const uNorm = Math.hypot(vx, vy);
              if (uNorm > 5) {
                uX = vx / uNorm;
                uY = vy / uNorm;
                if (uY < 0.15) {
                  uY = 0.35;
                  const renorm = Math.hypot(uX, uY);
                  uX /= renorm;
                  uY /= renorm;
                }
              }
            } else if (hasExplicitDirection) {
              const fn = Math.hypot(fv.dx, fv.dy);
              uX = fv.dx / fn;
              uY = fv.dy / fn;
            } else {
              const vx = pHand.x - pEl.x;
              const vy = pHand.y - pEl.y;
              const uNorm = Math.hypot(vx, vy);
              if (uNorm > 5) {
                uX = vx / uNorm;
                uY = vy / uNorm;
              }
            }

            // Proyecciones ortogonales sobre la línea de fuerza
            const isChestExercise = grpId === 'chest' || exIdStr.includes('press') || exIdStr.includes('bench') || exIdStr.includes('incline');
            // Offset glenohumeral 15% lateral hacia el codo para anclar en el centro articular real
            const effPSh = isChestExercise ? { x: pSh.x + 0.15 * (pEl.x - pSh.x), y: pSh.y + 0.15 * (pEl.y - pSh.y), score: pSh.score } : pSh;
            const tSh = (effPSh.x - pHand.x) * uX + (effPSh.y - pHand.y) * uY;
            const pShProj = { x: pHand.x + tSh * uX, y: pHand.y + tSh * uY, score: pSh.score };
            const rawDSh = Math.abs((effPSh.x - pHand.x) * uY - (effPSh.y - pHand.y) * uX);
            const dSh = Math.round(isBack ? Math.max(35, rawDSh) : (isChestExercise ? Math.max(22, rawDSh) : rawDSh));

            const tEl = (pEl.x - pHand.x) * uX + (pEl.y - pHand.y) * uY;
            const pElProj = { x: pHand.x + tEl * uX, y: pHand.y + tEl * uY, score: pEl.score };
            const rawDEl = Math.abs((pEl.x - pHand.x) * uY - (pEl.y - pHand.y) * uX);
            const dEl = Math.round(isBack ? Math.max(8, Math.min(18, rawDEl > 0 ? rawDEl : 10)) : rawDEl);

            // La línea de fuerza abarca continuamente desde el lado opuesto de las articulaciones hasta la carga/máquina
            const minT = Math.min(-30, tSh - 25, tEl - 25);
            const maxT = Math.max(70, tSh + 35, tEl + 35);
            const p1 = { x: pHand.x + uX * minT, y: pHand.y + uY * minT };
            const p2 = { x: pHand.x + uX * maxT, y: pHand.y + uY * maxT };

            ctx.beginPath();
            ctx.setLineDash([6, 3]);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // Flecha indicando el vector en p2
            const arrowAngle = Math.atan2(uY, uX);
            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(p2.x - 10 * Math.cos(arrowAngle - Math.PI / 6), p2.y - 10 * Math.sin(arrowAngle - Math.PI / 6));
            ctx.lineTo(p2.x - 10 * Math.cos(arrowAngle + Math.PI / 6), p2.y - 10 * Math.sin(arrowAngle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = '#FBBF24';
            ctx.fill();

            // Brazos de momento que conectan perfectamente la articulación a la línea de fuerza amarilla
            drawSegment(pSh, pShProj, '#3B82F6', true);
            drawSegment(pEl, pElProj, '#10B981', true);

            if (options.showCanvasText) {
              const tagShX = (pSh.x + pShProj.x) / 2 + (uY > 0 ? 10 : -75);
              let tagShY = (pSh.y + pShProj.y) / 2 - 9;
              const tagElX = (pEl.x + pElProj.x) / 2 + (uY > 0 ? 10 : -75);
              let tagElY = (pEl.y + pElProj.y) / 2 - 9;

              // Anti-colisión si están a menos de 26px
              if (Math.abs(tagShY - tagElY) < 26) {
                if (tagShY <= tagElY) {
                  tagShY -= 14;
                  tagElY += 14;
                } else {
                  tagShY += 14;
                  tagElY -= 14;
                }
              }

              drawPillTag(tagShX, tagShY, `${abbrSh}: ${dSh}`, '#3B82F6', '#93C5FD');
              drawPillTag(tagElX, tagElY, `${abbrEl}: ${dEl}`, '#10B981', '#6EE7B7');
            }
          } else if (isHorizontalResistance) {
            // Vector de resistencia horizontal (Máquinas y Poleas: Remo, Press de Pecho, Cruces)
            // Pin directly to Hand Grip center (machine handle / dumbbell grip)
            const lineY = pHand.y;

            const facingDir = fv?.dx !== undefined ? (fv.dx >= 0 ? 1 : -1) : (pHand.x > pSh.x ? 1 : -1);
            const lineLeft = Math.max(offsetX + 10, Math.min(pSh.x, pHand.x) - 60);
            const lineRight = Math.min(offsetX + drawW - 10, Math.max(pSh.x, pHand.x) + 60);

            ctx.beginPath();
            ctx.setLineDash([6, 3]);
            ctx.moveTo(lineLeft, lineY);
            ctx.lineTo(lineRight, lineY);
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // Flecha horizontal de resistencia
            const arrowX = facingDir > 0 ? lineRight : lineLeft;
            ctx.beginPath();
            ctx.moveTo(arrowX, lineY);
            ctx.lineTo(arrowX - facingDir * 10, lineY - 6);
            ctx.lineTo(arrowX - facingDir * 10, lineY + 6);
            ctx.closePath();
            ctx.fillStyle = '#FBBF24';
            ctx.fill();

            // Brazos de momento perpendiculares (verticales desde hombro y codo a la línea de fuerza)
            drawSegment(pSh, { x: pSh.x, y: lineY, score: pSh.score }, '#3B82F6', true);
            drawSegment(pEl, { x: pEl.x, y: lineY, score: pEl.score }, '#10B981', true);

            if (options.showCanvasText) {
              const dSh = Math.round(Math.abs(pSh.y - lineY));
              const dEl = Math.round(Math.abs(pEl.y - lineY));

              const tagX = facingDir > 0
                ? Math.min(offsetX + drawW - 90, Math.max(pHand.x + 10, lineRight - 75))
                : Math.max(offsetX + 12, Math.min(pHand.x - 75, lineLeft + 10));

              let tagShY = (pSh.y + lineY) / 2 - 9;
              let tagElY = (pEl.y + lineY) / 2 - 9;
              if (Math.abs(tagShY - tagElY) < 26) {
                if (tagShY <= tagElY) {
                  tagShY -= 14;
                  tagElY += 14;
                } else {
                  tagShY += 14;
                  tagElY -= 14;
                }
              }

              drawPillTag(tagX, tagShY, `${abbrSh}: ${dSh}`, '#3B82F6', '#93C5FD');
              drawPillTag(tagX, tagElY, `${abbrEl}: ${dEl}`, '#10B981', '#6EE7B7');
            }
          } else {
            // Vector de resistencia vertical (Peso libre por gravedad o Jalón en polea vertical)
            // Pin directly to Hand Grip center passing squarely through dumbbell handle / bar
            const lineX = pHand.x;

            const lineTop = Math.max(offsetY + 10, Math.min(pSh.y, pHand.y) - 60);
            const lineBottom = Math.min(offsetY + drawH - 10, Math.max(pSh.y, pEl.y, pHand.y, pHp.y) + 40);

            ctx.beginPath();
            ctx.setLineDash([6, 3]);
            ctx.moveTo(lineX, lineTop);
            ctx.lineTo(lineX, lineBottom);
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // Flecha vertical de carga
            ctx.beginPath();
            if (isVerticalUp) {
              ctx.moveTo(lineX, lineTop);
              ctx.lineTo(lineX - 6, lineTop + 10);
              ctx.lineTo(lineX + 6, lineTop + 10);
            } else {
              ctx.moveTo(lineX, lineBottom);
              ctx.lineTo(lineX - 6, lineBottom - 10);
              ctx.lineTo(lineX + 6, lineBottom - 10);
            }
            ctx.closePath();
            ctx.fillStyle = '#FBBF24';
            ctx.fill();

            // Brazos de momento perpendiculares (horizontales a la línea de gravedad)
            drawSegment(pSh, { x: lineX, y: pSh.y, score: pSh.score }, '#3B82F6', true);
            drawSegment(pEl, { x: lineX, y: pEl.y, score: pEl.score }, '#10B981', true);

            if (options.showCanvasText) {
              const dSh = Math.round(Math.abs(pSh.x - lineX));
              const dEl = Math.round(Math.abs(pEl.x - lineX));

              const tagX = lineX > pSh.x ? Math.min(offsetX + drawW - 85, lineX + 8) : Math.max(offsetX + 10, lineX - 85);
              let tagShY = pSh.y - 9;
              let tagElY = pEl.y - 9;
              if (Math.abs(tagShY - tagElY) < 26) {
                if (tagShY <= tagElY) {
                  tagShY -= 14;
                  tagElY += 14;
                } else {
                  tagShY += 14;
                  tagElY -= 14;
                }
              }

              drawPillTag(tagX, tagShY, `${abbrSh}: ${dSh}`, '#3B82F6', '#93C5FD');
              drawPillTag(tagX, tagElY, `${abbrEl}: ${dEl}`, '#10B981', '#6EE7B7');
            }
          }
        }
      } else if (!isHipThrust) {
        // TREN INFERIOR CON CARGA VERTICAL (Sentadilla, Prensa, Hack, RDL, Búlgara, etc.):
        drawPoint(pHp, '#3B82F6');
        drawPoint(pKn, '#10B981');
        drawPoint(pAk, '#38BDF8');
        drawPoint(pWr, '#FBBF24');

        const isRdlOrDeadlift = exIdStr.includes('rdl') || exIdStr.includes('deadlift') || exIdStr.includes('rumano');
        if (options.showLeverArms) {
          // Bug 2 Fix: En RDL y Deadlift, el punto de carga es SIEMPRE la muñeca/mano (pWr.x)
          const rawLineX = isRdlOrDeadlift ? pWr.x : ((pWr.score !== undefined && pWr.score > 0.35) ? pWr.x : pAk.x);
          if (smoothLineXRef.current === null || isNaN(smoothLineXRef.current)) {
            smoothLineXRef.current = rawLineX;
          } else {
            smoothLineXRef.current = smoothLineXRef.current * 0.85 + rawLineX * 0.15;
          }
          const lineX = smoothLineXRef.current;

          const lineTop = Math.max(offsetY + 10, Math.min(pHp.y, pWr.y) - 60);
          const lineBottom = Math.min(offsetY + drawH - 10, Math.max(pHp.y, pKn.y, pAk.y, pWr.y) + 30);

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

            const dHipVal = frame.moment_arms?.d_hip !== undefined ? Math.round(frame.moment_arms.d_hip * 100) : Math.round(Math.abs(pHp.x - lineX));
            const dKneeVal = frame.moment_arms?.d_knee !== undefined ? Math.round(frame.moment_arms.d_knee * 100) : Math.round(Math.abs(pKn.x - lineX));

            // En RDL/Deadlift: etiqueta G (Glúteo) y C / I (Cuádriceps si rodilla <130°, Isquios si semirrígida)
            const kneeAngle = frame.secondary_angle || frame.main_angle || 135;
            const kneeLabel = isRdlOrDeadlift ? (kneeAngle < 130 ? 'C' : 'I') : 'C';

            drawPillTag(
              midHipX - 22,
              tagHipY,
              `G: ${dHipVal}`,
              '#3B82F6',
              '#93C5FD'
            );

            drawPillTag(
              midKnX - 22,
              tagKnY,
              `${kneeLabel}: ${dKneeVal}`,
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
            pKn.x - 55,
            pKn.y - 14,
            `Rodilla: ${Math.round(frame.secondary_angle || 90)}°`,
            '#10B981',
            '#6EE7B7'
          );
        }
      }
    }

    // -------------------------------------------------------------
    // MÓDULO 3: FANTASMA BIOMECÁNICO (ZERO-STORAGE SESSION COMPARISON)
    // -------------------------------------------------------------
    if (options.showGhost && options.previousSession?.frames?.length > 0) {
      const ghostFrames = options.previousSession.frames;
      const totalDur = Math.max(0.1, (analysisData?.frames[analysisData.frames.length - 1]?.time || 1) - (analysisData?.frames[0]?.time || 0));
      const curProg = Math.max(0, Math.min(1, (frame.time - (analysisData?.frames[0]?.time || 0)) / totalDur));
      const gIdx = Math.min(ghostFrames.length - 1, Math.max(0, Math.floor(curProg * (ghostFrames.length - 1))));
      const gFrame = ghostFrames[gIdx];
      const gKp = gFrame?.keypoints_norm;

      if (gKp) {
        const gSh = { x: px(gKp.shoulder?.x ?? 0.5), y: py(gKp.shoulder?.y ?? 0.5) };
        const gEl = { x: px(gKp.elbow?.x ?? 0.5), y: py(gKp.elbow?.y ?? 0.5) };
        const gWr = { x: px(gKp.wrist?.x ?? 0.5), y: py(gKp.wrist?.y ?? 0.5) };
        const gHp = { x: px(gKp.hip?.x ?? 0.5), y: py(gKp.hip?.y ?? 0.5) };
        const gKn = { x: px(gKp.knee?.x ?? 0.5), y: py(gKp.knee?.y ?? 0.5) };
        const gAk = { x: px(gKp.ankle?.x ?? 0.5), y: py(gKp.ankle?.y ?? 0.5) };

        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4, 4]);

        if (isUpperBody) {
          ctx.beginPath();
          ctx.moveTo(gSh.x, gSh.y);
          ctx.lineTo(gEl.x, gEl.y);
          ctx.lineTo(gWr.x, gWr.y);
          ctx.stroke();
          if ((gKp.hip?.score ?? 1) >= 0.5) {
            ctx.beginPath();
            ctx.moveTo(gSh.x, gSh.y);
            ctx.lineTo(gHp.x, gHp.y);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(gHp.x, gHp.y);
          ctx.lineTo(gKn.x, gKn.y);
          ctx.lineTo(gAk.x, gAk.y);
          ctx.stroke();
        }

        // Ghost wrist point
        ctx.beginPath();
        ctx.arc(gWr.x, gWr.y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.fill();

        ctx.restore();

        // Comparison HUD Tag
        const prevV = options.previousSession.v_best || 0;
        const currV = analysisData?.intensity_metrics?.v_best || 0;
        const vDiff = prevV > 0 ? Math.round(((currV - prevV) / prevV) * 100) : 0;
        const vDiffText = vDiff >= 0 ? `+${vDiff}%` : `${vDiff}%`;
        const prevRir = options.previousSession.exact_rir ?? '2.0';
        const currRir = analysisData?.intensity_metrics?.exact_rir ?? '0.0';

        drawPillTag(
          offsetX + 12,
          offsetY + 12,
          `👻 Fantasma vs Anterior: Vel ${vDiffText} · RIR ${prevRir} → ${currRir}`,
          'rgba(34, 211, 238, 0.8)',
          '#22D3EE'
        );
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
      hardwareModel: 'Cerebrium Serverless T4 GPU (RT-DETR + ViTPose 2D + SciPy)',
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

    if (groupId === 'chest' || exId.includes('bench') || (exId.includes('chest') && !exId.includes('row')) || exId.includes('pec') || (exId.includes('press') && !exId.includes('leg') && !exId.includes('shoulder')) || exId.includes('dip')) {
      return {
        isLowerBody: false,
        primaryJointName: 'Codo',
        secondaryJointName: 'Hombro',
        primaryMetric: 'Flexión/Extensión Codo',
        secondaryMetric: 'Apertura Glenohumeral',
        dominantLabel: 'Pectoral Mayor',
        rows: [
          { label: 'Apoyo de Pies (Leg Drive):', value: 'Pies firmes en el suelo transfiriendo fuerza estable (o fuera de plano)', color: 'text-emerald-400' },
          { label: 'Arqueo Lumbar y Torso:', value: 'Retracción escapular activa con arco neutro fisiológico (evitar hiperextensión lumbar)', color: 'text-cyan-300' },
          { label: 'Alineación Glenohumeral (~50°-60°):', value: 'Codos en plano escapular (~50°); evitar abrir a 90° o cerrar excesivo (<35°)', color: 'text-amber-300' },
          { label: 'Profundidad Excéntrica (ROM):', value: 'Descenso completo a clavículas (flexión codo ≤85°); evitar medias repeticiones', color: 'text-slate-200' },
        ],
        torqueTitle: 'Reparto de Torque Pectoral / Tríceps',
        torqueShare: '76% Pectoral vs 24% Tríceps / Hombro',
        barLabel1: 'Brazo Pectoral',
        barLabel2: 'Brazo Tríceps',
        torqueFocus: 'PECTORAL MAYOR'
      };
    }
    if (groupId === 'back' || exId.includes('row') || exId.includes('pulldown') || exId.includes('pullup') || exId.includes('pullover') || exId.includes('t_bar') || exId.includes('gironda')) {
      const isDefaultUpperBack = exId.includes('t_bar') || exId.includes('upper_back') || exId.includes('face_pull');
      const backName = isDefaultUpperBack ? 'Espalda Alta' : 'Dorsal Ancho';
      const backLever = isDefaultUpperBack ? 'Brazo Espalda Alta' : 'Brazo Dorsal';
      return {
        isLowerBody: false,
        primaryJointName: 'Codo',
        secondaryJointName: 'Torso',
        primaryMetric: 'Tracción Escapular',
        secondaryMetric: 'Inclinación de Torso',
        dominantLabel: backName,
        rows: [
          { label: 'Retracción Escapular:', value: 'Depresión y aducción escapular activa', color: 'text-emerald-400' },
          { label: 'Separación Humeral:', value: isDefaultUpperBack ? 'Codos separados del torso (enfoque espalda alta)' : 'Codos guiados junto al torso (enfoque dorsal ancho)', color: 'text-cyan-300' },
          { label: 'Recorrido de Tracción:', value: 'Codos superando la línea del torso', color: 'text-slate-200' },
        ],
        torqueTitle: `Reparto de Torque ${backName} / Bíceps`,
        torqueShare: `82% ${backName} vs 18% Bíceps`,
        barLabel1: backLever,
        barLabel2: 'Brazo Bíceps',
        torqueFocus: isDefaultUpperBack ? 'ESPALDA ALTA (TRAPECIO / ROMBOIDES)' : 'DORSAL ANCHO (CODO PEGADO AL TORSO)'
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
    if (exId.includes('rdl') || exId.includes('deadlift') || exId.includes('rumano') || exId.includes('stiff')) {
      return {
        isLowerBody: true,
        primaryJointName: 'Cadera',
        secondaryJointName: 'Rodilla',
        primaryMetric: 'Bisagra de Cadera',
        secondaryMetric: 'Flexión de Rodilla',
        dominantLabel: 'Glúteo Mayor',
        rows: [
          { label: 'Alineación Lumbar:', value: 'Columna neutra mantenida en todo el recorrido', color: 'text-emerald-400' },
          { label: 'Bisagra de Cadera:', value: 'Desplazamiento horizontal de pelvis hacia atrás', color: 'text-cyan-300' },
          { label: 'Tensión Isquios/Glúteo:', value: 'Rodilla semirrígida con tensión excéntrica pura', color: 'text-slate-200' },
        ],
        torqueTitle: 'Reparto de Torque Cadera / Rodilla',
        torqueShare: 'Brazo Cadera vs Brazo Rodilla',
        barLabel1: 'Brazo Cadera (Glúteo/Isquios)',
        barLabel2: 'Brazo Rodilla',
        torqueFocus: 'GLÚTEO E ISQUIOS'
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
        { label: 'Bloqueo Pélvico:', value: 'Retroversión completa en lockout (≥142°)', color: 'text-cyan-300' },
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
    safeExerciseId.includes('hip_thrust') ||
    safeExerciseId.includes('kas') ||
    safeExerciseId.includes('bridge') ||
    safeExerciseId.includes('thrust') ||
    (activeExercise?.patternId && activeExercise.patternId.includes('hip_thrust'));

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
    if (selectedMuscleGroupId === 'chest' || safeExerciseId.includes('bench') || safeExerciseId.includes('chest') || safeExerciseId.includes('press') || safeExerciseId.includes('dip')) {
      const eff_d_sh = Math.max(d_sh_val, 0.05);
      const totD = eff_d_sh + d_el_val;
      let pectShare = 78;
      let tricShare = 22;
      if (totD > 0.005) {
        pectShare = Math.max(55, Math.min(95, Math.round((eff_d_sh / totD) * 100)));
        tricShare = 100 - pectShare;
      } else if (rawVerdict?.pectoral_share && rawVerdict?.triceps_share) {
        pectShare = Math.max(55, Math.round(rawVerdict.pectoral_share));
        tricShare = 100 - pectShare;
      }
      primaryLeverName = 'Brazo Pectoral';
      secondaryLeverName = 'Brazo Tríceps';
      primaryLeverShare = pectShare;
      secondaryLeverShare = tricShare;
      torqueBadgeText = `${pectShare}% Pectoral vs ${tricShare}% Tríceps`;
    } else if (selectedMuscleGroupId === 'back' || safeExerciseId.includes('row') || safeExerciseId.includes('pull') || safeExerciseId.includes('t_bar') || safeExerciseId.includes('gironda')) {
      // Check elbow-torso clearance to classify Upper Back (codo alejado) vs Latissimus Dorsi (codo pegado)
      const kp = currentFrame?.keypoints_norm as any;
      let isUpperBack = rawVerdict?.is_upper_back ?? (safeExerciseId.includes('t_bar') || safeExerciseId.includes('upper_back'));
      if (kp?.shoulder && kp?.elbow && kp?.hip) {
        const shX = kp.shoulder.x, shY = kp.shoulder.y;
        const elX = kp.elbow.x, elY = kp.elbow.y;
        const hpX = kp.hip.x, hpY = kp.hip.y;
        const tx = shX - hpX, ty = shY - hpY;
        const tLen = Math.hypot(tx, ty) + 1e-6;
        const elDist = Math.abs(ty * elX - tx * elY + shX * hpY - shY * hpX) / tLen;
        const relDist = elDist / tLen;
        const ux = elX - shX, uy = elY - shY;
        const vx = hpX - shX, vy = hpY - shY;
        const cosA = (ux * vx + uy * vy) / ((Math.hypot(ux, uy) + 1e-6) * (Math.hypot(vx, vy) + 1e-6));
        const elbowTorsoDeg = Math.acos(Math.max(-1, Math.min(1, cosA))) * (180 / Math.PI);
        isUpperBack = (elbowTorsoDeg >= 38.0 || relDist >= 0.35 || safeExerciseId.includes('t_bar') || safeExerciseId.includes('upper_back'));
      }

      const backName = isUpperBack ? 'Espalda Alta' : 'Dorsal';
      const backLeverName = isUpperBack ? 'Brazo Espalda Alta' : 'Brazo Dorsal';

      // Pure Moment Arm Relationship with Line of Force (Sin depender del ángulo del codo)
      const totD = d_sh_val + d_el_val;
      let backShare = 85;
      let bicShare = 15;
      if (totD > 0.005) {
        if (d_el_val / totD <= 0.10 || d_el_val <= 0.015) {
          backShare = 100;
          bicShare = 0;
        } else {
          backShare = Math.max(10, Math.min(95, Math.round((d_sh_val / totD) * 100)));
          bicShare = 100 - backShare;
        }
      } else if (rawVerdict?.dorsal_share !== undefined && rawVerdict?.biceps_share !== undefined) {
        backShare = Math.round(rawVerdict.dorsal_share);
        bicShare = Math.round(rawVerdict.biceps_share);
      }

      primaryLeverName = backLeverName;
      secondaryLeverName = 'Brazo Bíceps';
      primaryLeverShare = backShare;
      secondaryLeverShare = bicShare;
      torqueBadgeText = bicShare === 0
        ? `100% ${backName} (Todo Espalda)`
        : `${backShare}% ${backName} vs ${bicShare}% Bíceps`;
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
  } else if (safeExerciseId.includes('rdl') || safeExerciseId.includes('deadlift') || safeExerciseId.includes('rumano') || safeExerciseId.includes('stiff')) {
    primaryLeverName = 'Brazo Cadera (Glúteo/Isquios)';
    secondaryLeverName = 'Brazo Rodilla';
    primaryLeverShare = hipShare;
    secondaryLeverShare = kneeShare;
    torqueBadgeText = `${hipShare}% Cadera vs ${kneeShare}% Rodilla`;
  } else if (selectedMuscleGroupId === 'quadriceps' || selectedMuscleGroupId === 'quads' || safeExerciseId.includes('squat') || safeExerciseId.includes('hack') || safeExerciseId.includes('leg_press') || safeExerciseId.includes('bulgarian') || safeExerciseId.includes('leg_extension')) {
    primaryLeverName = 'Brazo Rodilla';
    secondaryLeverName = 'Brazo Cadera';
    primaryLeverShare = kneeShare;
    secondaryLeverShare = hipShare;
    torqueBadgeText = `${kneeShare}% Rodilla vs ${hipShare}% Cadera`;
  }

  // Active verdict read directly from frozen rep verdict with high-confidence fallbacks
  const isBackExercise = selectedMuscleGroupId === 'back' || safeExerciseId.includes('row') || safeExerciseId.includes('pull') || safeExerciseId.includes('t_bar') || safeExerciseId.includes('gironda');
  const isChestExercise = selectedMuscleGroupId === 'chest' || safeExerciseId.includes('chest') || safeExerciseId.includes('press') || safeExerciseId.includes('bench') || safeExerciseId.includes('dip') || safeExerciseId.includes('fly') || safeExerciseId.includes('pec_deck');
  const isRdlExercise = safeExerciseId.includes('rdl') || safeExerciseId.includes('deadlift') || safeExerciseId.includes('rumano') || safeExerciseId.includes('stiff');
  const isUpperBackActive = primaryLeverName.includes('Espalda Alta');
  const isChestDominant = primaryLeverShare >= 50;

  const kneeAngleForRdl = rawVerdict?.inflection_knee_deg ?? (currentFrame?.secondary_angle || currentFrame?.main_angle || 135);
  const isHighKneeFlexion = isRdlExercise && kneeAngleForRdl < 130;
  const isModerateKneeFlexion = isRdlExercise && kneeAngleForRdl >= 130 && kneeAngleForRdl < 145;

  const activeVerdict = {
    status: rawVerdict?.status || 'OPTIMAL',
    dominant_joint: isChestExercise
      ? (isChestDominant ? 'PECTORAL MAYOR' : 'TRÍCEPS BRAQUIAL')
      : isBackExercise
        ? (isUpperBackActive ? 'ESPALDA ALTA' : 'DORSAL ANCHO')
        : isRdlExercise
          ? (isHighKneeFlexion ? 'GLÚTEO MAYOR' : (isModerateKneeFlexion ? 'GLÚTEO E ISQUIOS' : 'ISQUIOSURALES'))
          : ((rawVerdict?.dominant_joint && rawVerdict.dominant_joint !== 'NEUTRO')
              ? rawVerdict.dominant_joint
              : kinematicMeta.dominantLabel.toUpperCase()),
    target_alignment: rawVerdict?.target_alignment ?? true,
    primary_torque_bias: isChestExercise
      ? (isChestDominant ? 'PECTORAL MAYOR' : 'TRÍCEPS BRAQUIAL')
      : isBackExercise
        ? (isUpperBackActive
            ? (secondaryLeverShare === 0 ? 'ESPALDA ALTA (TODO ESPALDA)' : 'ESPALDA ALTA (ROMBOIDES / TRAPECIO)')
            : (secondaryLeverShare === 0 ? 'DORSAL ANCHO (TODO ESPALDA)' : 'DORSAL ANCHO (CODO PEGADO AL TORSO)'))
        : isRdlExercise
          ? (isHighKneeFlexion ? 'GLÚTEO MAYOR (Por flexión de rodilla)' : (isModerateKneeFlexion ? 'GLÚTEO E ISQUIOS' : 'ISQUIOSURALES'))
          : ((rawVerdict?.primary_torque_bias && rawVerdict.primary_torque_bias !== 'CALIBRANDO')
              ? rawVerdict.primary_torque_bias
              : kinematicMeta.torqueFocus),
    inflection_knee_deg: rawVerdict?.inflection_knee_deg ?? (isRdlExercise ? kneeAngleForRdl : 90.0),
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
      : (isRdlExercise
        ? (isHighKneeFlexion
          ? 'Alta flexión de rodilla (<130°): mayor reclutamiento de Glúteo Mayor y menor tensión pasiva en Isquiosurales.'
          : (isModerateKneeFlexion
            ? 'Flexión moderada de rodilla (~135°): reparto equilibrado entre Glúteo Mayor e Isquiosurales.'
            : 'Rodilla semirrígida (≥145°): máxima tensión mecánica y elongación pasiva en Isquiosurales.'))
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
          : (isHipThrustVariant
            ? 'Alineación articular óptima (~90° en rodilla). Bloqueo concéntrico activo (≥142° en cadera).'
            : 'Alineación articular óptima (~90° en rodilla). Bloqueo concéntrico directo sin compensación lumbar.')))
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
  const intensity: IntensityMetrics = analysisData?.intensity_metrics || (() => {
    if (!analysisData?.repetitions_summary?.length || analysisData.repetitions_summary.length < 2) {
      return {
        estimated_rir: 'N/A',
        estimated_rpe: 0,
        exact_rir: undefined,
        exact_rpe: undefined,
        v_fail: undefined,
        delta_v_rep: undefined,
        estimated_1rm_kg: undefined,
        velocity_loss_pct: 0,
        first_rep_vel: 0,
        v_best: 0,
        last_rep_vel: 0,
        max_rep_vel: 0,
        rep_velocities: []
      };
    }
    const vels = analysisData.repetitions_summary.map(r => r.concentric_velocity_deg_s || 0).filter(v => v > 0);
    const maxV = vels.length ? Math.max(...vels) : 0;
    const lastV = vels.length ? vels[vels.length - 1] : 0;
    const loss = maxV > 0 ? Math.round(Math.max(0, ((maxV - lastV) / maxV) * 100) * 10) / 10 : 0;
    const penultV = vels.length >= 3 ? vels[vels.length - 2] : lastV;
    const isTerminalGrinder = (lastV <= Math.min(...vels) * 1.02) && (vels.length < 3 || lastV <= penultV * 0.92);
    const isTerminalAccel = (vels.length >= 3 && lastV > penultV * 1.05);

    let rir = '4+';
    let rpe = 6.0;
    if (loss >= 48 && isTerminalGrinder) {
      rir = '0';
      rpe = 10.0;
    } else if (loss >= 38) {
      if (isTerminalAccel) {
        rir = '2';
        rpe = 8.5;
      } else if (isTerminalGrinder) {
        rir = '1';
        rpe = 9.5;
      } else {
        rir = '1';
        rpe = 9.0;
      }
    } else if (loss >= 28) {
      rir = isTerminalAccel ? '3' : '2';
      rpe = isTerminalAccel ? 7.5 : 8.0;
    } else if (loss >= 18) {
      rir = '3';
      rpe = 7.0;
    }
    return {
      estimated_rir: rir,
      estimated_rpe: rpe,
      exact_rir: undefined,
      exact_rpe: undefined,
      v_fail: undefined,
      delta_v_rep: undefined,
      estimated_1rm_kg: undefined,
      velocity_loss_pct: loss,
      first_rep_vel: vels[0] || 0,
      v_best: maxV,
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
                RT-DETR + ViTPose 2D + SciPy Butterworth Fase-Cero (Cerebrium T4 GPU)
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

                {/* Lever Arms & Force Vectors Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowLeverArms(prev => {
                      const next = !prev;
                      setShowCanvasText(next);
                      return next;
                    });
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition active:scale-95 ${
                    showLeverArms
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={showLeverArms ? 'Ocultar brazos de momento y vectores de fuerza' : 'Mostrar brazos de momento y vectores de fuerza'}
                >
                  {showLeverArms ? <Eye className="w-3.5 h-3.5 text-amber-300" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{showLeverArms ? 'Brazos: ON' : 'Brazos: OFF'}</span>
                </button>

                {/* Ghost Skeleton Toggle */}
                {previousSessionData && (
                  <button
                    type="button"
                    onClick={() => setShowGhostSkeleton(prev => !prev)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition active:scale-95 ${
                      showGhostSkeleton
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                    title={showGhostSkeleton ? 'Ocultar Fantasma de Sesión Anterior' : 'Comparar con Esqueleto Fantasma de Sesión Anterior'}
                  >
                    <span>👻</span>
                    <span>{showGhostSkeleton ? 'Fantasma: ON' : 'Fantasma: OFF'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport Container */}
            <div
              className={`relative w-full h-[380px] sm:h-[460px] lg:h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none ${
                zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Zoom & Pan Viewport Wrapper (Synchronously Scales Video and Skeleton Canvas) */}
              <div
                className="w-full h-full relative flex items-center justify-center"
                style={{
                  transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
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
                  onTimeUpdate={(e) => {
                    const target = e.currentTarget;
                    if (!target.seeking && trimEnd > trimStart && (target.currentTime >= trimEnd || target.currentTime < trimStart - 0.2)) {
                      target.currentTime = trimStart;
                    }
                  }}
                  onEnded={(e) => {
                    e.currentTarget.currentTime = trimStart;
                    e.currentTarget.play().catch(() => {});
                  }}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Overlay Canvas 1:1 Synchronized */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>

              {/* Loading State Overlay */}
              {(pipelineState === 'compressing' || pipelineState === 'analyzing') && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-20">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm font-bold text-slate-200">{pipelineMessage}</p>
                  <span className="text-xs text-slate-400">Zero cold-start • RT-DETR + ViTPose 2D + SciPy (Cerebrium T4 GPU)</span>
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

              {/* HUD Telemetry Badges (Positioned at bottom-left to avoid occluding video titles and athlete) */}
              {pipelineState === 'ready' && (
                <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-10 max-w-[90%]">
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold shadow-md">
                    {analysisData && analysisData.total_reps > 0 && currentFrame && currentFrame.rep_number > 0
                      ? `REP #${currentFrame.rep_number}`
                      : 'PREPARACIÓN'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold shadow-md">
                    {currentFrame?.phase || 'IDLE'}
                  </span>
                  {!isLowerBody ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-[10px] font-mono font-bold shadow-md">
                      {((currentFrame as any)?.hide_torso_line || safeExerciseId.includes('press') || safeExerciseId.includes('bench') || safeExerciseId.includes('incline') || safeExerciseId.includes('dip') || safeExerciseId.includes('t_bar')) ? '' : `Torso: ${Math.round(currentFrame?.secondary_angle ?? 0)}° · `}Palanca: {
                        secondaryLeverShare === 0
                          ? `100% ${isUpperBackActive ? 'Espalda Alta' : (isBackExercise ? 'Dorsal' : 'Pectoral')}`
                          : `${primaryLeverShare}% ${isUpperBackActive ? 'Esp. Alta' : (isBackExercise ? 'Dorsal' : 'Pectoral')} / ${secondaryLeverShare}% ${isBackExercise ? 'Bíceps' : 'Tríceps'}`
                      }
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold shadow-md">
                      {primaryJointName}: {Math.round(currentFrame?.main_angle ?? currentPrimaryAngle)}° · {secondaryJointName}: {Math.round(currentFrame?.secondary_angle ?? 0)}°
                    </span>
                  )}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Grupo Muscular y Ejercicio Evaluado
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAnthropometryModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-800/70 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 shadow-sm"
                    title="Configurar Pasaporte Biomecánico del Atleta"
                  >
                    <Dna className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pasaporte</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVolumeAuditModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-800/70 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 shadow-sm"
                    title="Auditoría de Volumen Efectivo Real por Músculo"
                  >
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Volumen Real</span>
                  </button>
                </div>
              </div>

              {/* VBT Compact Configuration: Peso (kg) y Reps objetivo */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Carga / Peso (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Opcional (e1RM)"
                    value={weightKg ?? ''}
                    onChange={(e) => setWeightKg(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Reps Objetivo
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Opcional"
                    value={targetReps ?? ''}
                    onChange={(e) => setTargetReps(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

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
                      (analysisData?.vlm_analysis?.postural_diagnosis?.overall_status?.toLowerCase().includes('ajustar'))
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : activeVerdict.status === 'OPTIMAL'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {analysisData?.vlm_analysis?.postural_diagnosis?.overall_status
                        ? (analysisData.vlm_analysis.postural_diagnosis.overall_status.toLowerCase().includes('ajustar') ? '⚠️ Ajustar' : '✓ Óptimo')
                        : (activeVerdict.status === 'OPTIMAL' ? '✓ Óptimo' : '⚠️ Oportunidad')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed break-words whitespace-normal">
                    {analysisData?.vlm_analysis?.postural_diagnosis?.summary
                      ? analysisData.vlm_analysis.postural_diagnosis.summary
                      : isChestExercise
                      ? 'Apoyo firme de pies en suelo (leg drive), escápulas retraídas con arco natural sin hiperextensión lumbar, codos a ~50° y descenso completo a clavículas.'
                      : isBackExercise
                        ? (isUpperBackActive
                            ? 'Tracción con codos separados (~60°-70°), retracción escapular activa y torso estable.'
                            : 'Tracción fluida con codos pegados al torso, depresión escapular activa y columna neutra.')
                        : (activeVerdict.recommendation?.startsWith('Reparto de palanca')
                            ? 'Alineación articular y ejecución técnica evaluada.'
                            : (activeVerdict.recommendation || 'Alineación articular óptima.'))}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-800/60 text-[11px]">
                    {/* Fila de Alineación Cervical y Espalda */}
                    {(() => {
                      const curNeck = typeof (currentFrame as any)?.neck_angle === 'number'
                        ? (currentFrame as any).neck_angle
                        : 18;
                      const isHyperextended = curNeck > 25;
                      const vlmNeck = analysisData?.vlm_analysis?.postural_diagnosis?.neck_and_spine;
                      return (
                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5 text-slate-400 leading-relaxed">
                          <span className="font-medium text-slate-300">Alineación Cervical y Espalda:</span>
                          <span className={`font-bold ${isHyperextended ? 'text-amber-400' : 'text-emerald-400'} break-words whitespace-normal`}>
                            {vlmNeck || (isHyperextended
                              ? `Hiperextensión cervical detectada (+${Math.round(curNeck)}°): mantén la mirada neutra siguiendo la línea de la espalda`
                              : 'Columna neutra y cuello alineado con el dorsal')}
                          </span>
                        </div>
                      );
                    })()}
                    {analysisData?.vlm_analysis?.postural_diagnosis?.joint_alignment && (
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5 text-slate-400 leading-relaxed">
                        <span className="font-medium text-slate-300">Alineación Articular:</span>
                        <span className="font-bold text-cyan-400 break-words whitespace-normal">
                          {analysisData.vlm_analysis.postural_diagnosis.joint_alignment}
                        </span>
                      </div>
                    )}
                    {analysisData?.vlm_analysis?.postural_diagnosis?.rom_quality && (
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5 text-slate-400 leading-relaxed">
                        <span className="font-medium text-slate-300">Calidad de Recorrido:</span>
                        <span className="font-bold text-emerald-400 break-words whitespace-normal">
                          {analysisData.vlm_analysis.postural_diagnosis.rom_quality}
                        </span>
                      </div>
                    )}
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
                      {analysisData?.vlm_analysis?.torque_split
                        ? `Reparto de Torque (${analysisData.vlm_analysis.torque_split.primary_muscle} / ${analysisData.vlm_analysis.torque_split.secondary_muscle})`
                        : isHipThrustVariant
                        ? 'Palanca Articular y Enfoque'
                        : (isBackExercise
                            ? `Reparto de Torque ${isUpperBackActive ? 'Espalda Alta' : 'Dorsal'} / Bíceps`
                            : kinematicMeta.torqueTitle)}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {analysisData?.vlm_analysis?.torque_split
                        ? `${analysisData.vlm_analysis.torque_split.primary_pct}% vs ${analysisData.vlm_analysis.torque_split.secondary_pct}%`
                        : isHipThrustVariant ? `Rodilla ~${Math.round(activeVerdict.inflection_knee_deg || 90)}°` : torqueBadgeText}
                    </span>
                  </div>

                  {/* Moment Arms Distribution Bar - Only shown for non-hip thrust exercises */}
                  {!isHipThrustVariant ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                        <span>
                          {analysisData?.vlm_analysis?.torque_split?.primary_muscle || primaryLeverName}: {analysisData?.vlm_analysis?.torque_split?.primary_pct ?? primaryLeverShare}%
                        </span>
                        <span>
                          {analysisData?.vlm_analysis?.torque_split?.secondary_muscle || secondaryLeverName}: {analysisData?.vlm_analysis?.torque_split?.secondary_pct ?? secondaryLeverShare}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div
                          className="bg-blue-500 transition-all duration-150"
                          style={{ width: `${analysisData?.vlm_analysis?.torque_split?.primary_pct ?? primaryLeverShare}%` }}
                        />
                        <div
                          className="bg-emerald-500 transition-all duration-150"
                          style={{ width: `${analysisData?.vlm_analysis?.torque_split?.secondary_pct ?? secondaryLeverShare}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Alineación Tibial (Rodilla):</span>
                      <span className="font-bold text-cyan-300">{Math.round(activeVerdict.inflection_knee_deg || 90)}° (Objetivo ~90°)</span>
                    </div>
                  )}

                  {/* Notice for RDL with high knee flexion */}
                  {isRdlExercise && (activeVerdict.inflection_knee_deg ?? 135) < 130 && (
                    <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-[11px] text-purple-200 leading-relaxed">
                      💡 <strong>Alta flexión de rodilla (&lt;130°):</strong> mayor reclutamiento de Glúteo Mayor y menor tensión pasiva en Isquiosurales.
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
                      (analysisData?.total_reps ?? 0) < 2
                        ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                        : intensity.estimated_rpe >= 9
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : intensity.estimated_rpe >= 8
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {(analysisData?.total_reps ?? 0) < 2
                        ? 'VBT: Requiere ≥ 2 reps'
                        : `RIR ${intensity.exact_rir !== undefined ? intensity.exact_rir : intensity.estimated_rir} · RPE ${(intensity.exact_rpe !== undefined ? intensity.exact_rpe : intensity.estimated_rpe).toFixed(1)}`}
                    </span>
                  </div>

                  {/* e1RM Badge if available */}
                  {intensity.estimated_1rm_kg && (
                    <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950/80 border border-cyan-800/50 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        1RM Estimado (e1RM):
                      </span>
                      <span className="font-mono font-black text-cyan-300 text-sm">
                        {intensity.estimated_1rm_kg} kg
                      </span>
                    </div>
                  )}

                  {(analysisData?.total_reps ?? 0) < 2 ? (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[11px] font-mono text-slate-400 block font-bold">
                        VBT: Requiere ≥ 2 reps
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        Se requieren al menos 2 repeticiones para calcular fatiga concéntrica en serie.
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Pérdida de Velocidad</span>
                        <span className="text-sm font-black text-amber-300 font-mono">
                          -{intensity.velocity_loss_pct}%
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {intensity.delta_v_rep ? `Pérdida: ${intensity.delta_v_rep}°/s por rep` : 'Fatiga concéntrica en serie'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Velocidad Ini / Fin</span>
                        <span className="text-sm font-black text-cyan-300 font-mono">
                          {Math.round(intensity.first_rep_vel)}°/s → {Math.round(intensity.last_rep_vel)}°/s
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {intensity.v_fail ? `V_fail crítica: ${intensity.v_fail}°/s` : 'Velocidad angular media'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mini SVG Sparkline / Bar Chart */}
                  {intensity.rep_velocities && intensity.rep_velocities.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          Curva de Fatiga Concéntrica
                        </span>
                        <span className="text-cyan-400 font-bold">Pico: {Math.round(intensity.max_rep_vel)}°/s</span>
                      </div>

                      {/* Visible SVG Sparkline Curve with Area Fill */}
                      <div className="w-full h-14 relative block">
                        {(() => {
                          const vels = intensity.rep_velocities;
                          const maxV = Math.max(...vels, 1);
                          const minV = Math.max(0, Math.min(...vels) * 0.7);
                          const rangeV = Math.max(maxV - minV, 10);
                          const pts = vels.map((v: number, i: number) => {
                            const x = vels.length === 1 ? 50 : (i / (vels.length - 1)) * 92 + 4;
                            const y = 38 - ((v - minV) / rangeV) * 32;
                            return { x, y, v };
                          });
                          const pathD = pts.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                          const areaD = `${pathD} L ${pts[pts.length - 1].x.toFixed(1)} 44 L ${pts[0].x.toFixed(1)} 44 Z`;
                          return (
                            <svg className="w-full h-full overflow-visible block" viewBox="0 0 100 44" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="fatigueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
                                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                                </linearGradient>
                              </defs>
                              <path d={areaD} fill="url(#fatigueAreaGrad)" />
                              <path d={pathD} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              {pts.map((p: any, i: number) => (
                                <g key={i}>
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="3"
                                    className={i === vels.length - 1 && intensity.velocity_loss_pct >= 20 ? 'fill-amber-400' : 'fill-cyan-300'}
                                    stroke="#0F172A"
                                    strokeWidth="1.5"
                                  />
                                </g>
                              ))}
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Rep Bar Indicators with guaranteed heights and labels */}
                      <div className="h-10 w-full flex items-end gap-1.5 pt-1 border-t border-slate-900">
                        {intensity.rep_velocities.map((vel: number, idx: number) => {
                          const maxV = intensity.max_rep_vel || 1;
                          const barHeightPct = Math.max(20, Math.min(100, Math.round((vel / maxV) * 100)));
                          const isLast = idx === intensity.rep_velocities.length - 1;
                          return (
                            <div
                              key={idx}
                              className="flex-1 h-full flex flex-col justify-end items-center gap-0.5 group relative"
                            >
                              <div className="w-full flex-1 flex items-end justify-center">
                                <div
                                  className={`w-full rounded-t transition-all duration-300 ${
                                    isLast && intensity.velocity_loss_pct >= 20
                                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-sm shadow-amber-500/30'
                                      : 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-sm shadow-cyan-500/20'
                                  }`}
                                  style={{ height: `${barHeightPct}%`, minHeight: '6px' }}
                                />
                              </div>
                              <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-white">
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

        {/* MÓDULO 2 & 4: Modales Clínicos Especializados */}
        <AnthropometricProfileModal
          isOpen={showAnthropometryModal}
          onClose={() => setShowAnthropometryModal(false)}
        />
        <EffectiveVolumeAudit
          isOpen={showVolumeAuditModal}
          onClose={() => setShowVolumeAuditModal(false)}
          currentAnalysis={analysisData}
          exerciseId={selectedExerciseId || activeExercise?.id || ''}
          weightKg={weightKg}
          targetReps={targetReps}
        />
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
