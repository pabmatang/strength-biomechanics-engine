import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Video,
  Play,
  Pause,
  RotateCcw,
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
  Flame,
  MessageSquare,
  Scissors,
  Edit3,
  Target,
  Sparkles,
  Compass
} from 'lucide-react';
import { AnthropometricProfileModal } from './AnthropometricProfileModal';
import { EffectiveVolumeAudit } from './EffectiveVolumeAudit';
import { MachineResistanceClassifierModal } from './MachineResistanceClassifierModal';
import { MachineCatalogPickerModal } from './MachineCatalogPickerModal';
import {
  CatalogMachineEntry,
  getAllCatalogMachines,
  getMachineById,
  resolveCatalogMachine,
  getDefaultProfileForExerciseType
} from '../data/machineCatalog';
import { ResistanceCurveEditor } from './ResistanceCurveEditor';
import { type MachineResistanceProfile } from '../utils/machinePhysicsEngine';
import { isSuperUserMode } from '../utils/superuserCurveStore';
import { prepareVideoForAnalysis } from '../utils/videoCompressor';
import {
  analyzeVideoWithModal,
  requestCoachReviewWithModal,
  BiomechanicsAnalysisResponse,
  BiomechanicsFrame,
  ExerciseConfig,
  IntensityMetrics,
  RepetitionSummary,
  TimelineCue,
  AlignmentCheck,
  AlignmentAndDiscomfort,
  StimulusAndSpecificity,
  IntensityAudit,
  RepComparison
} from '../services/modalBiomechanicsClient';

export type AnalysisView = 'velocity' | 'coach' | 'alignment' | 'stimulus';
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

/**
 * 7-stimulating-reps window model for effective hypertrophy volume.
 * rep_factor = min(1.0, total_reps / 7.0)
 * RIR >= 5 -> 0.0 (Serie de aproximación / técnica)
 * RIR 4    -> 0.45 * rep_factor (Estímulo ligero / aproximación)
 * RIR 3    -> 0.75 * rep_factor
 * RIR 2    -> 0.90 * rep_factor
 * RIR 0-1  -> 1.0 * rep_factor
 */
export function calculateStimulatingSetFactor(totalReps: number, rawRir: any) {
  const reps = Math.max(0, Number(totalReps) || 0);
  const repFactor = Math.min(1.0, reps / 7.0);

  let rir = 2.0;
  if (typeof rawRir === 'string') {
    const clean = rawRir.replace(/[^0-9.]/g, '');
    const p = parseFloat(clean);
    rir = isNaN(p) ? 2.0 : p;
  } else if (typeof rawRir === 'number' && !isNaN(rawRir)) {
    rir = rawRir;
  }

  let rirFactor = 0.90;
  let label = 'Zona óptima de hipertrofia';

  if (rir >= 5.0) {
    rirFactor = 0.0;
    label = 'Serie de aproximación / técnica';
  } else if (rir >= 4.0) {
    rirFactor = 0.45;
    label = 'Estímulo ligero / aproximación';
  } else if (rir >= 3.0) {
    rirFactor = 0.75;
    label = 'Estímulo moderado';
  } else if (rir >= 2.0) {
    rirFactor = 0.90;
    label = 'Zona óptima de hipertrofia';
  } else {
    rirFactor = 1.0;
    label = 'Máximo estímulo / cercanía al fallo';
  }

  const factor = Number((rirFactor * repFactor).toFixed(4));
  return {
    rir,
    repFactor,
    rirFactor,
    factor,
    label
  };
}

export function formatMuscleTarget(m?: string): string {
  if (!m) return '';
  const key = m.toLowerCase().trim();
  const map: Record<string, string> = {
    pectorals: 'Pectoral',
    pectoral: 'Pectoral',
    chest: 'Pectoral',
    glutes: 'Glúteo',
    glute: 'Glúteo',
    quads: 'Cuádriceps',
    quadriceps: 'Cuádriceps',
    hamstrings: 'Isquiosurales',
    hamstring: 'Isquiosurales',
    back: 'Espalda',
    lats: 'Dorsal',
    upper_back: 'Espalda Alta',
    shoulders: 'Hombro',
    shoulder: 'Hombro',
    deltoids: 'Deltoides',
    triceps: 'Tríceps',
    biceps: 'Bíceps',
    calves: 'Gemelos',
    adductors: 'Aductores',
    core: 'Core',
    abs: 'Abdomen',
    lower_back: 'Erectores Espinales'
  };
  return map[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}

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
      { id: 'rdl_unilateral', name: 'Peso Muerto Rumano Unilateral / B-Stance (Glúteo)', exerciseType: 'rdl_unilateral', targetMuscle: 'hamstrings', loadType: 'gravity', patternId: 'rdl_strict_hamstring' },
      { id: 'rdl', name: 'Peso Muerto Rumano (Barra/Mancuernas)', exerciseType: 'rdl', targetMuscle: 'hamstrings', loadType: 'gravity', patternId: 'rdl_strict_hamstring' },
      { id: 'hip_thrust', name: 'Hip Thrust con Barra', exerciseType: 'hip_thrust', targetMuscle: 'glutes_max', loadType: 'gravity', patternId: 'hip_thrust_barbell' },
      { id: 'machine_hip_thrust', name: 'Hip Thrust en Máquina', exerciseType: 'machine_hip_thrust', targetMuscle: 'glutes_max', loadType: 'machine', patternId: 'hip_thrust_barbell' },
      { id: 'kas_glute_bridge', name: 'Kas Glute Bridge', exerciseType: 'kas_glute_bridge', targetMuscle: 'glutes_max', loadType: 'gravity', patternId: 'hip_thrust_barbell' },
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
      { id: 'barbell_squat', name: 'Sentadilla con Barra / Multipower', exerciseType: 'barbell_squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'squat_high_bar' },
      { id: 'bulgarian_split_squat', name: 'Sentadilla Búlgara / Zancada B-Stance', exerciseType: 'bulgarian_split_squat', targetMuscle: 'quadriceps', loadType: 'gravity', patternId: 'bulgarian_split_squat_glute' },
      { id: 'hack_squat', name: 'Sentadilla Hack en Máquina', exerciseType: 'hack_squat', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'hack_squat_machine' },
      { id: 'leg_press', name: 'Prensa Inclinada 45°', exerciseType: 'leg_press', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'leg_press_high_feet' },
      { id: 'leg_extension', name: 'Extensión de Cuádriceps', exerciseType: 'leg_extension', targetMuscle: 'quadriceps', loadType: 'machine', patternId: 'leg_extension_machine' },
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
      { id: 'chest_press_machine', name: 'Press de Pecho en Máquina', exerciseType: 'chest_press_machine', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'converging_chest_press_machine' },
      { id: 'machine_chest_press', name: 'Press en Máquina Convergente', exerciseType: 'machine_chest_press', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'converging_chest_press_machine' },
      { id: 'cable_fly', name: 'Aperturas / Cruces en Polea', exerciseType: 'cable_fly', targetMuscle: 'pectorals', loadType: 'cable', patternId: 'cable_fly_mid_sternal' },
      { id: 'pec_deck', name: 'Pec Deck / Contractora', exerciseType: 'pec_deck', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'cable_fly_mid_sternal' },
      { id: 'chest_dips', name: 'Fondos en Paralelas para Pecho', exerciseType: 'chest_dips', targetMuscle: 'pectorals', loadType: 'gravity', patternId: 'dips_chest_lean' },
      { id: 'machine_dips', name: 'Fondos en Máquina para Pecho', exerciseType: 'machine_dips', targetMuscle: 'pectorals', loadType: 'machine', patternId: 'dips_chest_lean' }
    ]
  },
  {
    id: 'back',
    name: 'Espalda',
    exercises: [
      { id: 'seated_row', name: 'Remo Sentado en Máquina / Polea', exerciseType: 'seated_row', targetMuscle: 'lats', loadType: 'machine', patternId: 'chest_supported_lat_row' },
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
  initialCatalogMachine?: CatalogMachineEntry;
  onApplyVolumeMultiplier?: (multiplier: number, targetMuscle: string) => void;
}

function getFrameTime(f: BiomechanicsFrame): number {
  return typeof f.timestamp_sec === 'number' ? f.timestamp_sec : (f.time ?? 0);
}

function findClosestFrame(frames: BiomechanicsFrame[], relTime: number): BiomechanicsFrame | null {
  if (!frames || frames.length === 0) return null;
  let low = 0;
  let high = frames.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (getFrameTime(frames[mid]) < relTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const i1 = Math.max(0, Math.min(frames.length - 1, low));
  const i2 = Math.max(0, Math.min(frames.length - 1, high));
  const closest = Math.abs(getFrameTime(frames[i1]) - relTime) < Math.abs(getFrameTime(frames[i2]) - relTime)
    ? frames[i1]
    : frames[i2];
  
  // Return null if playback time is completely outside the analyzed frame window (>1.5s gap)
  if (Math.abs(getFrameTime(closest) - relTime) > 1.5) {
    return null;
  }
  return closest;
}

function getInterpolatedFrame(frames: BiomechanicsFrame[], relTime: number): BiomechanicsFrame | null {
  if (!frames || frames.length === 0) return null;
  const tStart = getFrameTime(frames[0]);
  const tEnd = getFrameTime(frames[frames.length - 1]);
  if (relTime <= tStart) return frames[0];
  if (relTime >= tEnd) return frames[frames.length - 1];

  let low = 0;
  let high = frames.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (getFrameTime(frames[mid]) < relTime) {
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
  const t0 = getFrameTime(f0);
  const t1 = getFrameTime(f1);
  const dt = t1 - t0;
  if (dt <= 0.0001) return f0;

  const alpha = Math.max(0, Math.min(1, (relTime - t0) / dt));
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
    time: relTime,
    timestamp_sec: relTime,
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

  if (combined.includes('rdl_unilateral') || combined.includes('b-stance') || combined.includes('bstance') || (combined.includes('rdl') && combined.includes('unilateral'))) {
    return ALL_EXERCISES.find(e => e.id === 'rdl_unilateral') || ALL_EXERCISES.find(e => e.id === 'rdl') || ALL_EXERCISES[0];
  }
  if (combined.includes('bulgarian') || combined.includes('búlgara') || combined.includes('bulgara') || combined.includes('zancada')) {
    return ALL_EXERCISES.find(e => e.id === 'bulgarian_split_squat') || ALL_EXERCISES.find(e => e.id === 'squat') || ALL_EXERCISES[0];
  }
  if (combined.includes('hip_thrust') || combined.includes('thrust') || combined.includes('bridge') || combined.includes('glute')) {
    if (combined.includes('mach') || combined.includes('máquina')) {
      return ALL_EXERCISES.find(e => e.id === 'machine_hip_thrust') || ALL_EXERCISES[0];
    }
    return ALL_EXERCISES.find(e => e.id === 'hip_thrust') || ALL_EXERCISES[0];
  }
  if (combined.includes('deadlift') || (combined.includes('peso') && combined.includes('muerto')) || combined.includes('muerto')) {
    if (combined.includes('rdl') || combined.includes('rumano')) {
      return ALL_EXERCISES.find(e => e.id === 'rdl') || ALL_EXERCISES[0];
    }
    return ALL_EXERCISES.find(e => e.id === 'deadlift') || ALL_EXERCISES.find(e => e.id === 'rdl') || ALL_EXERCISES[0];
  }
  if (combined.includes('rdl') || combined.includes('rumano')) {
    return ALL_EXERCISES.find(e => e.id === 'rdl') || ALL_EXERCISES[0];
  }
  if (combined.includes('hack') || combined.includes('squat') || combined.includes('sentadilla') || combined.includes('prensa') || combined.includes('leg_press')) {
    if (combined.includes('hack')) return ALL_EXERCISES.find(e => e.id === 'hack_squat') || ALL_EXERCISES[0];
    if (combined.includes('prensa') || combined.includes('press') || combined.includes('leg_press')) return ALL_EXERCISES.find(e => e.id === 'leg_press') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'squat') || ALL_EXERCISES.find(e => e.id === 'barbell_squat') || ALL_EXERCISES[0];
  }
  if (combined.includes('extension') || combined.includes('cuadriceps')) {
    return ALL_EXERCISES.find(e => e.id === 'leg_extension') || ALL_EXERCISES[0];
  }
  if (combined.includes('seated_row')) {
    return ALL_EXERCISES.find(e => e.id === 'seated_row') || ALL_EXERCISES.find(e => e.id === 'machine_row') || ALL_EXERCISES[0];
  }
  if (combined.includes('chest_press') || combined.includes('bench') || combined.includes('banca') || combined.includes('chest') || combined.includes('pecho')) {
    if (combined.includes('inclin')) return ALL_EXERCISES.find(e => e.id === 'incline_press') || ALL_EXERCISES[0];
    if (combined.includes('mach') || combined.includes('máquina') || combined.includes('chest_press') || combined.includes('technogym') || combined.includes('hammer') || combined.includes('pure') || combined.includes('panatta') || combined.includes('matrix')) {
      return ALL_EXERCISES.find(e => e.id === 'chest_press_machine') || ALL_EXERCISES.find(e => e.id === 'machine_chest_press') || ALL_EXERCISES[0];
    }
    return ALL_EXERCISES.find(e => e.id === 'bench_press') || ALL_EXERCISES[0];
  }
  if (combined.includes('row') || combined.includes('remo') || combined.includes('gironda') || combined.includes('dorsal')) {
    if (combined.includes('barbell') || combined.includes('barra')) return ALL_EXERCISES.find(e => e.id === 'barbell_row') || ALL_EXERCISES[0];
    if (combined.includes('t_bar') || combined.includes('t-bar')) return ALL_EXERCISES.find(e => e.id === 't_bar_row') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'seated_row') || ALL_EXERCISES.find(e => e.id === 'machine_row') || ALL_EXERCISES[0];
  }
  if (combined.includes('jalon') || combined.includes('pulldown') || combined.includes('dominada') || combined.includes('pullup')) {
    return ALL_EXERCISES.find(e => e.id === 'lat_pulldown') || ALL_EXERCISES[0];
  }
  if (combined.includes('militar') || combined.includes('overhead') || combined.includes('shoulder') || combined.includes('hombro')) {
    if (combined.includes('mach') || combined.includes('máquina') || combined.includes('technogym') || combined.includes('hammer') || combined.includes('pure') || combined.includes('shoulder_press')) {
      return ALL_EXERCISES.find(e => e.id === 'shoulder_press_machine') || ALL_EXERCISES[0];
    }
    return ALL_EXERCISES.find(e => e.id === 'overhead_press') || ALL_EXERCISES[0];
  }
  if (combined.includes('lateral')) {
    if (combined.includes('polea') || combined.includes('cable')) return ALL_EXERCISES.find(e => e.id === 'cable_lateral_raise') || ALL_EXERCISES[0];
    return ALL_EXERCISES.find(e => e.id === 'lateral_raise') || ALL_EXERCISES[0];
  }
  if (combined.includes('biceps') || combined.includes('curl')) {
    return ALL_EXERCISES.find(e => e.id === 'biceps_curl') || ALL_EXERCISES[0];
  }
  if (combined.includes('triceps') || combined.includes('pushdown') || combined.includes('frances') || combined.includes('dip')) {
    return ALL_EXERCISES.find(e => e.id === 'triceps_extension') || ALL_EXERCISES[0];
  }

  // 4. Default fallback: RDL (clean lower-body default instead of machine_row)
  return ALL_EXERCISES.find(e => e.id === 'rdl') || ALL_EXERCISES[0];
}

// =========================================================================
// SNAPSHOT VIEWER & PRO PULLEY CALIBRATION COMPONENT (VIEW 4)
// =========================================================================

interface SnapshotViewerProps {
  stretchB64?: string | null;
  peakB64?: string | null;
  jointsStretch?: Record<string, [number, number]>;
  jointsPeak?: Record<string, [number, number]>;
  loadType?: string;
  isUpperBody: boolean;
  exerciseType?: string;
  activeTab: 'both' | 'stretch' | 'peak';
  isCalibrating: boolean;
  pulleyOrigin: { x: number; y: number } | null;
  onSetPulleyOrigin: (pt: { x: number; y: number }) => void;
}

function formatMachineBrandAndModel(brand?: string | null, modelName?: string | null, separator: string = ' · '): string {
  if (!modelName) return brand || '';
  if (!brand) return modelName;
  const b = brand.trim();
  const m = modelName.trim();
  if (m.toLowerCase().startsWith(b.toLowerCase())) {
    return m;
  }
  return `${b}${separator}${m}`;
}

function getLeverJointLabels(exerciseType?: string, isUpperBody?: boolean) {
  const ex = (exerciseType || '').toLowerCase();
  
  // 1. Dominancia Tren Inferior
  const isKneeDominant = ex.includes('squat') || ex.includes('leg_press') || ex.includes('leg_extension') || ex.includes('hack') || ex.includes('prensa') || ex.includes('sentadilla') || ex.includes('quad');
  const isHipDominant = ex.includes('deadlift') || ex.includes('hip_thrust') || ex.includes('leg_curl') || ex.includes('rdl') || ex.includes('peso_muerto') || ex.includes('isquio');

  if (isKneeDominant) {
    return { joint1: 'Cuádriceps/Rodilla', joint2: 'Glúteo/Cadera', primary: 'knee' };
  }
  if (isHipDominant) {
    return { joint1: 'Isquios-Glúteo/Cadera', joint2: 'Rodilla/Flexión', primary: 'hip' };
  }
  if (!isUpperBody) {
    return { joint1: 'Cuádriceps/Rodilla', joint2: 'Glúteo/Cadera', primary: 'knee' };
  }

  // 2. Tren Superior: Tracción vs Empuje Pecho vs Empuje Hombro
  // Nota crítica: NUNCA usar ex.includes('lat') porque colisiona con 'lateral_raise'!
  const isPull = ex.includes('row') || ex.includes('remo') || ex.includes('pulldown') || ex.includes('jalon') || ex.includes('chin') || ex.includes('pullup') || ex.includes('t_bar') || ex.includes('gironda') || ex.includes('lat_') || ex.includes('lat ') || ex.endsWith('lat') || ex.includes('curl');

  const isShoulderPush = ex.includes('shoulder') || ex.includes('lateral') || ex.includes('elevacion') || ex.includes('military') || ex.includes('overhead') || ex.includes('arnold') || ex.includes('press_militar') || ex.includes('press_hombro');

  const isChestPush = ex.includes('chest') || ex.includes('incline_press') || ex.includes('bench_press') || ex.includes('pec_deck') || ex.includes('pecho') || (ex.includes('press') && !isShoulderPush) || ex.includes('dip') || ex.includes('fondo');

  if (isPull) {
    return { joint1: 'Espalda/Hombro', joint2: 'Bíceps/Codo', primary: 'shoulder' };
  }
  if (isShoulderPush) {
    return { joint1: 'Deltoides/Hombro', joint2: 'Tríceps/Codo', primary: 'shoulder' };
  }
  if (isChestPush) {
    return { joint1: 'Pectoral/Hombro', joint2: 'Tríceps/Codo', primary: 'shoulder' };
  }
  return { joint1: 'Pectoral/Hombro', joint2: 'Tríceps/Codo', primary: 'shoulder' };
}

interface LeverInfo {
  distPx: number | null;
  ratioText: string | null;
  mode: 'cable' | 'gravity';
  targetJointName: string;
}

const SingleSnapshotCanvas: React.FC<{
  title: string;
  badge: string;
  b64: string;
  joints?: Record<string, [number, number]>;
  loadType?: string;
  isUpperBody: boolean;
  exerciseType?: string;
  isCalibrating: boolean;
  pulleyOrigin: { x: number; y: number } | null;
  onSetPulleyOrigin: (pt: { x: number; y: number }) => void;
}> = ({ title, badge, b64, joints, isUpperBody, exerciseType, isCalibrating, pulleyOrigin, onSetPulleyOrigin }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leverInfo, setLeverInfo] = useState<LeverInfo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
    img.onload = () => {
      canvas.width = img.naturalWidth || 480;
      canvas.height = img.naturalHeight || 360;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const px = (nx: number) => nx * canvas.width;
      const py = (ny: number) => ny * canvas.height;

      const pSh = joints?.shoulder ? { x: px(joints.shoulder[0]), y: py(joints.shoulder[1]), valid: true } : null;
      const pEl = joints?.elbow ? { x: px(joints.elbow[0]), y: py(joints.elbow[1]), valid: true } : null;
      const pWr = joints?.wrist ? { x: px(joints.wrist[0]), y: py(joints.wrist[1]), valid: true } : null;
      const pHp = joints?.hip ? { x: px(joints.hip[0]), y: py(joints.hip[1]), valid: true } : null;
      const pKn = joints?.knee ? { x: px(joints.knee[0]), y: py(joints.knee[1]), valid: true } : null;
      const pAk = joints?.ankle ? { x: px(joints.ankle[0]), y: py(joints.ankle[1]), valid: true } : null;

      const drawSeg = (p1: any, p2: any, color: string, w = 3) => {
        if (!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.stroke();
      };

      const drawNode = (p: any, color: string, r = 5) => {
        if (!p) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      };

      // Draw clean ViTPose skeleton
      if (isUpperBody) {
        drawSeg(pSh, pEl, '#10B981', 3.5);
        drawSeg(pEl, pWr, '#34D399', 3.5);
        drawNode(pSh, '#10B981', 5);
        drawNode(pEl, '#10B981', 5);
        drawNode(pWr, '#34D399', 5);
      } else {
        drawSeg(pSh, pHp, '#10B981', 3.5);
        drawSeg(pHp, pKn, '#10B981', 3.5);
        drawSeg(pKn, pAk, '#34D399', 3.5);
        drawNode(pSh, '#10B981', 5);
        drawNode(pHp, '#10B981', 5);
        drawNode(pKn, '#10B981', 5);
        drawNode(pAk, '#38BDF8', 5);
      }

      // Pro Pulley Mode
      if (pulleyOrigin && (pWr || pSh || pHp)) {
        const po = { x: px(pulleyOrigin.x), y: py(pulleyOrigin.y) };
        const activeLoad = isUpperBody ? (pWr || pEl) : (pWr || pHp);
        const targetJoint = isUpperBody ? pSh : (pHp || pKn);

        if (activeLoad && targetJoint) {
          ctx.beginPath();
          ctx.setLineDash([5, 4]);
          ctx.moveTo(po.x, po.y);
          ctx.lineTo(activeLoad.x, activeLoad.y);
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.arc(po.x, po.y, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#06B6D4';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();

          let dx = activeLoad.x - po.x;
          let dy = activeLoad.y - po.y;
          const len = Math.hypot(dx, dy);
          if (len > 1e-4) {
            dx /= len;
            dy /= len;
            const t = (targetJoint.x - po.x) * dx + (targetJoint.y - po.y) * dy;
            const proj = { x: po.x + t * dx, y: po.y + t * dy };
            const dist = Math.abs((targetJoint.x - po.x) * dy - (targetJoint.y - po.y) * dx);

            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(targetJoint.x, targetJoint.y);
            ctx.lineTo(proj.x, proj.y);
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            setLeverInfo({
              distPx: Math.round(dist),
              ratioText: null,
              mode: 'cable',
              targetJointName: isUpperBody ? 'Hombro' : 'Cadera'
            });
            return;
          }
        }
      }

      // Gravity Plumb Line & Moment Arm Analysis
      if (isUpperBody) {
        const loadX = pWr ? pWr.x : (pEl ? pEl.x : canvas.width * 0.5);
        if (pSh) {
          ctx.beginPath();
          ctx.setLineDash([5, 4]);
          ctx.moveTo(loadX, 0);
          ctx.lineTo(loadX, canvas.height);
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2.2;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(pSh.x, pSh.y);
          ctx.lineTo(loadX, pSh.y);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.stroke();

          const dSh = Math.abs(pSh.x - loadX);
          const dEl = pEl ? Math.abs(pEl.x - loadX) : 0;
          const totD = dSh + dEl;

          const { joint1, joint2 } = getLeverJointLabels(exerciseType, isUpperBody);
          let ratioText = `${joint1}: 70% · ${joint2}: 30%`;
          if (totD > 5) {
            const pctSh = Math.round((dSh / totD) * 100);
            const pctEl = 100 - pctSh;
            ratioText = `${joint1}: ${pctSh}% · ${joint2}: ${pctEl}%`;
          }

          setLeverInfo({
            distPx: Math.round(dSh),
            ratioText,
            mode: 'gravity',
            targetJointName: joint1.split('/')[1] || joint1
          });
        } else {
          const { joint1, joint2 } = getLeverJointLabels(exerciseType, isUpperBody);
          setLeverInfo({
            distPx: Math.round(canvas.width * 0.18),
            ratioText: `${joint1}: 68% · ${joint2}: 32%`,
            mode: 'gravity',
            targetJointName: joint1.split('/')[1] || joint1
          });
        }
      } else {
        // Lower Body (RDL, Squat, Bulgarian, Hip Thrust)
        const loadX = (pWr && pWr.y > (pHp ? pHp.y : 0)) ? pWr.x : (pAk ? pAk.x : (pKn ? pKn.x : canvas.width * 0.5));
        
        ctx.beginPath();
        ctx.setLineDash([5, 4]);
        ctx.moveTo(loadX, 0);
        ctx.lineTo(loadX, canvas.height);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.setLineDash([]);

        const dHp = pHp ? Math.abs(pHp.x - loadX) : 0;
        const dKn = pKn ? Math.abs(pKn.x - loadX) : 0;
        const tot = dHp + dKn;

        if (pHp) {
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(pHp.x, pHp.y);
          ctx.lineTo(loadX, pHp.y);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (pKn) {
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(pKn.x, pKn.y);
          ctx.lineTo(loadX, pKn.y);
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
        ctx.setLineDash([]);

        const { joint1, joint2, primary } = getLeverJointLabels(exerciseType, isUpperBody);
        let ratioText = `${joint1}: 65% · ${joint2}: 35%`;
        if (tot > 5) {
          const pctHp = Math.round((dHp / tot) * 100);
          const pctKn = 100 - pctHp;
          if (primary === 'knee') {
            ratioText = `${joint1}: ${pctKn}% · ${joint2}: ${pctHp}%`;
          } else {
            ratioText = `${joint1}: ${pctHp}% · ${joint2}: ${pctKn}%`;
          }
        }

        setLeverInfo({
          distPx: Math.round(dHp > 0 ? dHp : canvas.width * 0.22),
          ratioText,
          mode: 'gravity',
          targetJointName: primary === 'knee' ? 'Rodilla' : 'Cadera'
        });
      }
    };
  }, [b64, joints, isUpperBody, pulleyOrigin, isCalibrating, exerciseType]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCalibrating) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onSetPulleyOrigin({ x: nx, y: ny });
  };

  return (
    <div ref={containerRef} className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black group flex flex-col items-center">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <span className="px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-slate-700 text-white text-[10px] font-black shadow-lg">
          {title}
        </span>
        <span className="px-1.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-300 text-[9px] font-mono font-bold">
          {badge}
        </span>
      </div>
      {isCalibrating && (
        <div className="absolute bottom-10 inset-x-2 z-10 pointer-events-none text-center">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-black shadow-lg animate-pulse">
            🎯 Haz clic sobre el anclaje de la polea en la foto
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`w-full h-auto max-h-[260px] object-contain rounded-t-2xl ${isCalibrating ? 'cursor-crosshair ring-2 ring-amber-400' : ''}`}
      />
      {/* Clean Info Bar below the photo - No overlapping text on joints */}
      <div className="w-full bg-slate-950/95 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-300 font-medium">
            {leverInfo?.mode === 'cable' ? 'Brazo Palanca (Cable):\u00A0' : 'Brazo Momento (Gravedad):\u00A0'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-black text-amber-300">
            {leverInfo?.ratioText || (() => {
              const { joint1, joint2 } = getLeverJointLabels(exerciseType, isUpperBody);
              return `${joint1}: 70% · ${joint2}: 30%`;
            })()}
          </span>
        </div>
      </div>
    </div>
  );
};

const SnapshotViewer: React.FC<SnapshotViewerProps> = ({
  stretchB64,
  peakB64,
  jointsStretch,
  jointsPeak,
  loadType,
  isUpperBody,
  exerciseType,
  activeTab,
  isCalibrating,
  pulleyOrigin,
  onSetPulleyOrigin
}) => {
  if (!stretchB64 && !peakB64) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No se han podido extraer fotogramas estáticos del vídeo.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {activeTab === 'both' ? (
        <div className="space-y-3">
          {stretchB64 && (
            <SingleSnapshotCanvas
              title="1. Estiramiento (Bottom)"
              badge="Máxima Elongación"
              b64={stretchB64}
              joints={jointsStretch}
              loadType={loadType}
              isUpperBody={isUpperBody}
              exerciseType={exerciseType}
              isCalibrating={isCalibrating}
              pulleyOrigin={pulleyOrigin}
              onSetPulleyOrigin={onSetPulleyOrigin}
            />
          )}
          {peakB64 && (
            <SingleSnapshotCanvas
              title="2. Bloqueo / Pico (Lockout)"
              badge="Máximo Acortamiento"
              b64={peakB64}
              joints={jointsPeak}
              loadType={loadType}
              isUpperBody={isUpperBody}
              exerciseType={exerciseType}
              isCalibrating={isCalibrating}
              pulleyOrigin={pulleyOrigin}
              onSetPulleyOrigin={onSetPulleyOrigin}
            />
          )}
        </div>
      ) : activeTab === 'stretch' && stretchB64 ? (
        <SingleSnapshotCanvas
          title="1. Estiramiento (Bottom)"
          badge="Máxima Elongación"
          b64={stretchB64}
          joints={jointsStretch}
          loadType={loadType}
          isUpperBody={isUpperBody}
          exerciseType={exerciseType}
          isCalibrating={isCalibrating}
          pulleyOrigin={pulleyOrigin}
          onSetPulleyOrigin={onSetPulleyOrigin}
        />
      ) : activeTab === 'peak' && peakB64 ? (
        <SingleSnapshotCanvas
          title="2. Bloqueo / Pico (Lockout)"
          badge="Máximo Acortamiento"
          b64={peakB64}
          joints={jointsPeak}
          loadType={loadType}
          isUpperBody={isUpperBody}
          exerciseType={exerciseType}
          isCalibrating={isCalibrating}
          pulleyOrigin={pulleyOrigin}
          onSetPulleyOrigin={onSetPulleyOrigin}
        />
      ) : null}
    </div>
  );
};

const VideoPoseAnalysisModalInner: React.FC<VideoPoseAnalysisModalProps> = ({
  isOpen,
  onClose,
  defaultExerciseId,
  defaultExerciseName,
  initialCatalogMachine,
  onApplyVolumeMultiplier
}) => {
  // Cascading Selection State & Safe Catalog Mapping (Phase 4: Strict Workout Prioritization)
  const effectiveCatalogMachine = useMemo(() => {
    if (initialCatalogMachine) return initialCatalogMachine;
    return resolveCatalogMachine({ id: defaultExerciseId, title: defaultExerciseName });
  }, [initialCatalogMachine, defaultExerciseId, defaultExerciseName]);

  const [catalogMachine, setCatalogMachine] = useState<CatalogMachineEntry | undefined>(effectiveCatalogMachine);
  const [showCatalogPickerModal, setShowCatalogPickerModal] = useState<boolean>(false);

  useEffect(() => {
    const resolved = initialCatalogMachine || resolveCatalogMachine({ id: defaultExerciseId, title: defaultExerciseName });
    if (resolved) {
      setCatalogMachine(resolved);
    }
  }, [initialCatalogMachine, defaultExerciseId, defaultExerciseName]);

  const hasInitialExercise = Boolean(
    (catalogMachine?.canonicalExerciseType || defaultExerciseId) &&
    (catalogMachine?.canonicalExerciseType || defaultExerciseId) !== 'auto'
  );
  const initialExercise = useMemo(() => {
    const activeM = catalogMachine || effectiveCatalogMachine;
    if (activeM) {
      return resolveExercise(activeM.canonicalExerciseType, activeM.modelName);
    }
    if (hasInitialExercise) {
      return resolveExercise(defaultExerciseId, defaultExerciseName);
    }
    return resolveExercise('machine_chest_press', 'Press de Pecho en Máquina');
  }, [catalogMachine, effectiveCatalogMachine, hasInitialExercise, defaultExerciseId, defaultExerciseName]);

  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string>(() => {
    const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === initialExercise.id));
    return parentGroup ? parentGroup.id : 'chest';
  });
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(() => {
    const activeM = catalogMachine || effectiveCatalogMachine;
    if (activeM) {
      return activeM.canonicalExerciseType;
    }
    if (hasInitialExercise && initialExercise.id && initialExercise.id !== 'auto') {
      return initialExercise.id;
    }
    return ALL_EXERCISES[0]?.id || 'bench_press';
  });
  const [isManualOverride, setIsManualOverride] = useState<boolean>(true);
  const isManualOverrideRef = useRef<boolean>(true);
  const [showManualExerciseSelector, setShowManualExerciseSelector] = useState<boolean>(false);
  const [showExercisePickerInOverlay, setShowExercisePickerInOverlay] = useState<boolean>(false);

  // States for on-demand Coach IA review and Pro snapshots
  const [isGeneratingCoachReview, setIsGeneratingCoachReview] = useState<boolean>(false);
  const [coachReviewError, setCoachReviewError] = useState<string | null>(null);
  const [showProSnapshots, setShowProSnapshots] = useState<boolean>(false);

  // Superuser / Dev mode state
  const [isSuperUser, setIsSuperUser] = useState<boolean>(() => isSuperUserMode());
  useEffect(() => {
    const handleState = () => setIsSuperUser(isSuperUserMode());
    window.addEventListener('mia_superuser_state_changed', handleState);
    return () => window.removeEventListener('mia_superuser_state_changed', handleState);
  }, []);

  // Synchronize exercise and group when modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      setShowExercisePickerInOverlay(false);
      const activeM = catalogMachine || effectiveCatalogMachine;
      if (activeM) {
        setCatalogMachine(activeM);
        isManualOverrideRef.current = true;
        setIsManualOverride(true);
        setSelectedExerciseId(activeM.canonicalExerciseType);
        const resolved = resolveExercise(activeM.canonicalExerciseType, activeM.modelName);
        const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === resolved.id));
        if (parentGroup) {
          setSelectedMuscleGroupId(parentGroup.id);
        }
        setLoadType(resolved.loadType || 'machine');
        setTargetMuscle(resolved.targetMuscle);
        return;
      }
      const hasDef = Boolean(defaultExerciseId && defaultExerciseId !== 'auto');
      isManualOverrideRef.current = true;
      setIsManualOverride(true);
      if (hasDef) {
        const resolved = resolveExercise(defaultExerciseId, defaultExerciseName);
        setSelectedExerciseId(resolved.id);
        const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === resolved.id));
        if (parentGroup) {
          setSelectedMuscleGroupId(parentGroup.id);
        }
        setLoadType(resolved.loadType);
        setTargetMuscle(resolved.targetMuscle);
      } else {
        const fallback = ALL_EXERCISES[0];
        setSelectedExerciseId(fallback.id);
        const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === fallback.id));
        if (parentGroup) {
          setSelectedMuscleGroupId(parentGroup.id);
        }
        setLoadType(fallback.loadType);
        setTargetMuscle(fallback.targetMuscle);
      }
    }
  }, [isOpen, defaultExerciseId, defaultExerciseName, catalogMachine, effectiveCatalogMachine]);

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

  // 4 Commercial Biomechanical Analysis Views
  const [activeView, setActiveView] = useState<AnalysisView>('velocity');
  const [showRepComparison, setShowRepComparison] = useState<boolean>(false);
  const [activeTimelineCue, setActiveTimelineCue] = useState<TimelineCue | null>(null);
  const [stimulusDisplayMode, setStimulusDisplayMode] = useState<'video' | 'snapshots'>('snapshots');
  const [activeSnapshotTab, setActiveSnapshotTab] = useState<'both' | 'stretch' | 'peak'>('both');
  const [isCalibratingPulley, setIsCalibratingPulley] = useState<boolean>(false);
  const [proPulleyOrigin, setProPulleyOrigin] = useState<{ x: number; y: number } | null>(null);
  const [volumeMultiplierApplied, setVolumeMultiplierApplied] = useState<boolean>(false);
  const [showExerciseConfigEdit, setShowExerciseConfigEdit] = useState<boolean>(false);
  const [showMachineClassifierModal, setShowMachineClassifierModal] = useState<boolean>(false);
  const [customTensionProfile, setCustomTensionProfile] = useState<string | null>(null);

  const handleCueClick = (cue: TimelineCue) => {
    setActiveTimelineCue(cue);
    if (videoElementRef.current) {
      const targetTime = Math.max(0, cue.timestamp_sec);
      videoElementRef.current.currentTime = targetTime;
      setVideoCurrentTime(targetTime);
      handleSpeedChange(0.5);
      videoElementRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    }
  };

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

  // Log telemetry pose audit
  useEffect(() => {
    if (analysisData?.debug_pose_audit) {
      console.info("[MIA Audit]", analysisData.debug_pose_audit);
      if (analysisData.vlm_error) {
        console.warn("[MIA Audit] VLM Error Detail:", analysisData.vlm_error);
      }
    }
  }, [analysisData]);

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
    range?: { startTime: number; endTime: number },
    exerciseName?: string,
    isManual?: boolean
  ) => {
    try {
      setPipelineState('analyzing');
      setPipelineMessage('Procesando cinemática clínica en GPU Serverless (RT-DETR + ViTPose 2D + SciPy)...');

      const manualActive = typeof isManual === 'boolean' ? isManual : isManualOverrideRef.current;

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
        exerciseName: exerciseName || (manualActive ? activeExercise?.name : (defaultExerciseName || undefined)),
        targetMuscle: muscle,
        loadType: backendLoad,
        isManualOverride: manualActive || Boolean(defaultExerciseId && defaultExerciseId !== 'auto'),
        geminiApiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
        weightKg: weightKg && weightKg > 0 ? weightKg : undefined,
        targetReps: targetReps && targetReps > 0 ? targetReps : undefined,
        anthropometry: userProfile
      };

      const result = await analyzeVideoWithModal(blob, config, fileId, {
        range,
        onProgress: (stage, progress) => {
          setPipelineMessage(`${stage} (${progress}%)`);
        }
      });
      if (result.debug_pose_audit) {
        console.info("[MIA Audit]", result.debug_pose_audit);
        if (result.vlm_error) {
          console.warn("[MIA Audit] VLM Error Detail:", result.vlm_error);
        }
      }
      setAnalysisData(result);
      setShowExerciseConfigEdit(false);
      setRepCount(result.total_reps);
      setPipelineState('ready');
      setPipelineMessage('');

      const detectedName = result.vlm_analysis?.detected_exercise_name || (result as any).detected_exercise_type;
      if (detectedName && !manualActive && !catalogMachine && (!defaultExerciseId || defaultExerciseId === 'auto')) {
        const detected = resolveExercise('', detectedName);
        if (detected) {
          setSelectedExerciseId(detected.id);
          setTargetMuscle(detected.targetMuscle);
          setLoadType(detected.loadType);
          const grp = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === detected.id));
          if (grp) setSelectedMuscleGroupId(grp.id);
        }
      }

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

  // On-demand Coach IA Review Handler
  const handleGenerateCoachReview = async () => {
    const blob = compressedBlobRef.current || uploadedFileRef.current;
    if (!blob || !analysisData) return;
    setIsGeneratingCoachReview(true);
    setCoachReviewError(null);
    try {
      const config: ExerciseConfig = {
        exerciseType: selectedExerciseId,
        exerciseName: activeExercise.name,
        targetMuscle: targetMuscle,
        loadType: loadType,
        weightKg,
        targetReps,
        runVlm: true,
      };
      const summaryData = {
        total_reps: analysisData.total_reps,
        intensity_metrics: analysisData.intensity_metrics,
        repetitions_summary: analysisData.repetitions_summary,
        rep_comparison: analysisData.rep_comparison,
      };
      const res = await requestCoachReviewWithModal(blob, config, summaryData);
      if (res.success && res.coach_review) {
        if (res.coach_review.timeline_cues) {
          setAnalysisData(prev => prev ? {
            ...prev,
            timeline_cues: res.coach_review.timeline_cues,
            vlm_analysis: res.coach_review,
            vlm_used: true,
            vlm_mode: res.vlm_mode as any,
            vlm_model_used: res.vlm_model_used
          } : prev);
        }
      } else {
        const errStr = res.vlm_error || res.error || 'No se pudo obtener la revisión del Coach IA.';
        if (errStr.includes('429')) {
          setCoachReviewError('Cuota de Gemini temporalmente superada (429). Puedes volver a intentarlo en unos instantes sin perder tu análisis biomecánico.');
        } else {
          setCoachReviewError(errStr);
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('429')) {
        setCoachReviewError('Cuota de Gemini temporalmente superada (429). Puedes volver a intentarlo en unos instantes sin perder tu análisis biomecánico.');
      } else {
        setCoachReviewError(msg);
      }
    } finally {
      setIsGeneratingCoachReview(false);
    }
  };

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
    setShowTrimmer(false);
    setShowExercisePickerInOverlay(false);
    setAnalysisData(null);
    setCurrentFrame(null);
    const hasDef = Boolean(defaultExerciseId && defaultExerciseId !== 'auto');
    isManualOverrideRef.current = hasDef;
    setIsManualOverride(hasDef);
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

      // Direct dispatch for videos <= 25 MB to avoid slow canvas re-recording (GPU handles trimming directly)
      if (file.size > 25 * 1024 * 1024) {
        setPipelineMessage(`Optimizando y preparando vídeo (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`);
        const preparedBlob = await prepareVideoForAnalysis(file, { range, maxWidth: 480, targetFps: 15, bitrate: 800_000 });
        videoBlobToSend = preparedBlob;
      } else {
        videoBlobToSend = file;
      }
      compressedBlobRef.current = videoBlobToSend;

      const manualActive = catalogMachine ? true : (isManualOverrideRef.current || isManualOverride);
      const exToSend = catalogMachine
        ? catalogMachine.canonicalExerciseType
        : (manualActive ? activeExercise.exerciseType : (defaultExerciseId && defaultExerciseId !== 'auto' ? defaultExerciseId : 'auto'));
      const exNameToSend = catalogMachine
        ? formatMachineBrandAndModel(catalogMachine.brand, catalogMachine.modelName, ' ')
        : (manualActive ? activeExercise.name : (defaultExerciseName || undefined));
      const muscleToSend = manualActive ? activeExercise.targetMuscle : 'auto';
      const loadToSend = catalogMachine ? 'machine' : (manualActive ? activeExercise.loadType : 'auto');

      await runPipelineAnalysis(
        videoBlobToSend,
        fileId,
        exToSend,
        muscleToSend,
        loadToSend,
        range,
        exNameToSend,
        manualActive
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
    isManualOverrideRef.current = true;
    setIsManualOverride(true);
    setSelectedExerciseId(item.id);
    const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === item.id));
    if (parentGroup) {
      setSelectedMuscleGroupId(parentGroup.id);
    }
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
        range,
        item.name,
        true
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

      const rawCurrentTime = video.currentTime || 0;
      setVideoCurrentTime(rawCurrentTime);

      // Sincronización exacta por relTime dentro del clip recortado
      const relTime = Math.max(0, rawCurrentTime - (trimStart || 0));

      // Seamless video loop inside trimmed range [trimStart, trimEnd]
      const maxAnalyzedDuration = (analysisData as any)?.total_duration_sec ?? (analysisData?.frames?.length
        ? (analysisData.frames[analysisData.frames.length - 1].timestamp_sec ?? analysisData.frames[analysisData.frames.length - 1].time)
        : (trimEnd - trimStart));
      const effectiveLoopEnd = Math.min(trimEnd, (trimStart || 0) + (maxAnalyzedDuration > 0 ? maxAnalyzedDuration : (trimEnd - trimStart)));
      if (!video.paused && !video.seeking && effectiveLoopEnd > trimStart && rawCurrentTime >= effectiveLoopEnd) {
        video.currentTime = trimStart;
      }

      if (analysisData && analysisData.frames.length > 0) {
        const frame = getInterpolatedFrame(analysisData.frames, relTime) || findClosestFrame(analysisData.frames, relTime);
        if (frame) {
          setCurrentFrame(frame);
          setCurrentPrimaryAngle(frame.main_angle);
          setCurrentPhase(frame.phase);

          const resolvedExForCanvas = String(
            (isManualOverride && selectedExerciseId !== 'auto')
              ? selectedExerciseId
              : (analysisData?.detected_exercise_type ||
                 (analysisData as any)?.exercise_type ||
                 (selectedExerciseId !== 'auto' ? selectedExerciseId : '') ||
                 activeExercise?.id ||
                 'chest_press_machine')
          ).toLowerCase();

          // Render canvas overlays
          renderCanvasOverlay(canvas, video, frame, activeView, {
            zoom,
            panOffset,
            showLeverArms,
            showCanvasText,
            showGhost: showGhostSkeleton,
            previousSession: previousSessionData,
            exerciseId: resolvedExForCanvas,
            muscleGroupId: selectedMuscleGroupId,
            showRepComparison,
            activeTimelineCue,
            alignmentChecks: analysisData?.alignment_and_discomfort?.checks
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
  }, [analysisData, activeView, zoom, panOffset, showLeverArms, showCanvasText, showGhostSkeleton, previousSessionData, selectedMuscleGroupId, selectedExerciseId, activeExercise, trimStart, trimEnd, showRepComparison, activeTimelineCue]);

  /**
   * Surgical 1:1 Canvas Projection and Clean Visual Layer Separation
   */
  const renderCanvasOverlay = (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    frame: BiomechanicsFrame,
    view: AnalysisView,
    options: {
      zoom: number;
      panOffset: { x: number; y: number };
      showLeverArms: boolean;
      showCanvasText: boolean;
      showGhost?: boolean;
      previousSession?: any;
      exerciseId: string;
      muscleGroupId?: string;
      showRepComparison?: boolean;
      activeTimelineCue?: TimelineCue | null;
      alignmentChecks?: AlignmentCheck[];
    }
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize internal canvas buffer with video layout dimensions (handling letterbox/pillarbox)
    const vWidth = video.clientWidth || video.videoWidth || 800;
    const vHeight = video.clientHeight || video.videoHeight || 600;
    if (vWidth > 0 && vHeight > 0 && (canvas.width !== vWidth || canvas.height !== vHeight)) {
      canvas.width = vWidth;
      canvas.height = vHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Exact containment geometry (object-contain letterbox/pillarbox)
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

    const px = (normX: number) => offsetX + normX * drawW;
    const py = (normY: number) => offsetY + normY * drawH;

    // Safe point reader handling both [x, y] arrays and { x, y } objects mapped to visible video rectangle
    const getPoint = (pt: any): { x: number; y: number; valid: boolean } => {
      if (!pt) return { x: 0, y: 0, valid: false };
      let nx = 0;
      let ny = 0;
      if (Array.isArray(pt) && pt.length >= 2) {
        nx = Number(pt[0]);
        ny = Number(pt[1]);
      } else if (typeof pt === 'object' && pt !== null) {
        nx = Number(pt.x ?? 0);
        ny = Number(pt.y ?? 0);
      } else {
        return { x: 0, y: 0, valid: false };
      }
      if (isNaN(nx) || isNaN(ny)) return { x: 0, y: 0, valid: false };
      const clampedX = Math.max(0, Math.min(1, nx));
      const clampedY = Math.max(0, Math.min(1, ny));
      return {
        x: offsetX + clampedX * drawW,
        y: offsetY + clampedY * drawH,
        valid: true
      };
    };

    const kps = (frame.keypoints || frame.keypoints_norm || {}) as any;

    const pSh = getPoint(kps.shoulder);
    const pEl = getPoint(kps.elbow);
    const pWr = getPoint(kps.wrist);
    const pHp = getPoint(kps.hip);
    const pKn = getPoint(kps.knee);
    const pAk = getPoint(kps.ankle);
    const pEar = getPoint(kps.ear || kps.head || (frame.keypoints_norm as any)?.head);

    const isUpper = frame.body_region === 'upper' || analysisData?.body_region === 'upper' || (analysisData as any)?.is_upper_body === true;
    const isUpperBody = isUpper;

    const clampX = (x: number, w: number = 64) => Math.max(10, Math.min(canvas.width - w - 10, x));
    const clampY = (y: number, h: number = 22) => Math.max(10, Math.min(canvas.height - h - 10, y));

    const drawPillTag = (x: number, y: number, text: string, borderColor: string, textColor: string = '#FFFFFF') => {
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      const textW = ctx.measureText(text).width;
      const pillW = textW + 12;
      const pillH = 16;
      const pillX = clampX(x, pillW);
      const pillY = clampY(y, pillH);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.fill();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(text, pillX + 6, pillY + 11);
    };

    const drawThickSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }, color: string, width: number = 3.5, dashed: boolean = false) => {
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawNodePoint = (p: { x: number; y: number }, color: string, radius: number = 5.0) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    };

    const drawAngleArc = (pCenter: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, radius: number, color: string) => {
      const a1 = Math.atan2(p1.y - pCenter.y, p1.x - pCenter.x);
      const a2 = Math.atan2(p2.y - pCenter.y, p2.x - pCenter.x);
      ctx.beginPath();
      ctx.arc(pCenter.x, pCenter.y, radius, Math.min(a1, a2), Math.max(a1, a2));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    };

    // -------------------------------------------------------------
    // VIEW 1: VELOCIDAD E INTENSIDAD (VBT & FORMA DEGRADADA)
    // -------------------------------------------------------------
    if (view === 'velocity') {
      // Speed-gradient load tracker trail (last 20 frames)
      if (analysisData?.frames && analysisData.frames.length > 0) {
        const curIdx = frame.frame_idx ?? 0;
        const trailStart = Math.max(0, curIdx - 20);
        for (let i = trailStart; i < curIdx; i++) {
          const fPrev = analysisData.frames[i];
          const fNext = analysisData.frames[i + 1];
          if (!fPrev || !fNext) continue;
          const ptPrevRaw = fPrev.load_point || (isUpper ? (fPrev.keypoints || (fPrev.keypoints_norm as any))?.wrist : (fPrev.keypoints || (fPrev.keypoints_norm as any))?.hip);
          const ptNextRaw = fNext.load_point || (isUpper ? (fNext.keypoints || (fNext.keypoints_norm as any))?.wrist : (fNext.keypoints || (fNext.keypoints_norm as any))?.hip);
          const ptPrev = getPoint(ptPrevRaw);
          const ptNext = getPoint(ptNextRaw);
          if (!ptPrev.valid || !ptNext.valid) continue;

          const normVel = fPrev.load_speed_norm ?? 0.3;
          // Gradient by speed: Green > 0.4 m/s, Amber 0.2-0.4, Red < 0.2 m/s
          const strokeColor = normVel > 0.4 ? '#10B981' : normVel > 0.2 ? '#F59E0B' : '#F43F5E';
          const alpha = ((i - trailStart + 1) / (curIdx - trailStart + 1)) * 0.9;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ptPrev.x, ptPrev.y);
          ctx.lineTo(ptNext.x, ptNext.y);
          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Current load tracking point
      const curLoadPt = getPoint(frame.load_point || (isUpper ? kps.wrist : kps.hip));
      if (curLoadPt.valid) {
        drawNodePoint(curLoadPt, '#06B6D4', 6);
      }

      // Sticking Point detection badge: estrictamente durante la fase CONCENTRIC y vel_loss >= 15%
      if (analysisData?.repetitions_summary) {
        const setVelLoss = Number(analysisData.intensity_metrics?.velocity_loss_pct ?? 0);
        const isConcentric = (frame.phase ?? '').toUpperCase() === 'CONCENTRIC';
        const curTime = frame.timestamp_sec ?? frame.time ?? 0;
        if (isConcentric && setVelLoss >= 15.0) {
          const isNearSticking = analysisData.repetitions_summary.some(
            r => r.sticking_point_sec && Math.abs(r.sticking_point_sec - curTime) < 0.35
          );
          if (isNearSticking && curLoadPt.valid) {
            drawPillTag(curLoadPt.x - 45, curLoadPt.y + 12, '⚠️ Sticking Point', '#EF4444', '#FCA5A5');
          }
        }
      }

      // Rep 1 vs Last Rep Trajectory Overlay
      if (options.showRepComparison && analysisData?.rep_comparison) {
        const r1 = analysisData.rep_comparison.rep1;
        if (r1?.path_points && r1.path_points.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2.5;
          r1.path_points.forEach((pt, idx) => {
            const p = getPoint(pt);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.restore();
          const p1Start = getPoint(r1.path_points[0]);
          if (p1Start.valid) {
            drawPillTag(p1Start.x + 8, p1Start.y - 8, 'Rep #1 (100% ROM)', '#06B6D4', '#A5F3FC');
          }
        }

        const rLast = analysisData.rep_comparison.last_rep;
        if (rLast?.path_points && rLast.path_points.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = '#F97316';
          ctx.lineWidth = 2.5;
          rLast.path_points.forEach((pt, idx) => {
            const p = getPoint(pt);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.restore();
          const pLastEnd = getPoint(rLast.path_points[rLast.path_points.length - 1]);
          if (pLastEnd.valid) {
            const lastRomPct = (r1?.rom_px ?? 0) > 0 ? Math.round((rLast.rom_px / r1.rom_px) * 100) : 100;
            drawPillTag(pLastEnd.x + 8, pLastEnd.y - 8, `Última Rep (${lastRomPct}% ROM)`, '#F97316', '#FDBA74');
          }
        }
      }

      // Light context skeleton
      ctx.save();
      ctx.globalAlpha = 0.45;
      if (isUpper) {
        drawThickSegment(pSh, pEl, '#94A3B8', 2.0);
        drawThickSegment(pEl, pWr, '#94A3B8', 2.0);
        drawNodePoint(pSh, '#94A3B8', 4.0);
        drawNodePoint(pEl, '#94A3B8', 4.0);
        drawNodePoint(pWr, '#94A3B8', 4.0);
      } else {
        drawThickSegment(pSh, pHp, '#94A3B8', 2.0);
        drawThickSegment(pHp, pKn, '#94A3B8', 2.0);
        drawThickSegment(pKn, pAk, '#94A3B8', 2.0);
        drawNodePoint(pSh, '#94A3B8', 4.0);
        drawNodePoint(pHp, '#94A3B8', 4.0);
        drawNodePoint(pKn, '#94A3B8', 4.0);
        drawNodePoint(pAk, '#94A3B8', 4.0);
      }
      ctx.restore();
    }

    // -------------------------------------------------------------
    // VIEW 2: COACH IA (TIMELINE INTERACTIVA & CUES CLÍNICOS)
    // -------------------------------------------------------------
    else if (view === 'coach') {
      if (isUpper) {
        drawThickSegment(pSh, pEl, '#10B981', 3.5);
        drawThickSegment(pEl, pWr, '#34D399', 3.5);
        drawNodePoint(pSh, '#10B981', 5.0);
        drawNodePoint(pEl, '#10B981', 5.0);
        drawNodePoint(pWr, '#34D399', 5.0);
        drawAngleArc(pEl, pSh, pWr, 24, '#38BDF8');
        if (options.showCanvasText) {
          const elbowAngle = Math.round(frame.angles?.elbow ?? frame.main_angle ?? 90);
          drawPillTag(pEl.x - 36, pEl.y - 18, `Codo: ${elbowAngle}°`, '#38BDF8', '#38BDF8');
        }
      } else {
        if (pEar.valid) {
          drawThickSegment(pEar, pSh, '#10B981', 3.5);
          drawNodePoint(pEar, '#10B981', 4.5);
        }
        drawThickSegment(pSh, pHp, '#10B981', 3.5);
        drawThickSegment(pHp, pKn, '#10B981', 3.5);
        drawThickSegment(pKn, pAk, '#34D399', 3.5);
        drawNodePoint(pSh, '#10B981', 5.0);
        drawNodePoint(pHp, '#10B981', 5.0);
        drawNodePoint(pKn, '#10B981', 5.0);
        drawNodePoint(pAk, '#38BDF8', 5.0);
        drawAngleArc(pHp, pSh, pKn, 24, '#38BDF8');
        drawAngleArc(pKn, pHp, pAk, 20, '#10B981');
      }

      // Highlight active cue affected joint
      if (options.activeTimelineCue) {
        const cue = options.activeTimelineCue;
        let targetJ = pEl;
        if (cue.affected_joint === 'shoulder') targetJ = pSh;
        else if (cue.affected_joint === 'wrist') targetJ = pWr;
        else if (cue.affected_joint === 'hip' || cue.affected_joint === 'lumbar') targetJ = pHp;
        else if (cue.affected_joint === 'knee') targetJ = pKn;

        if (targetJ && targetJ.valid) {
          const pulseR = 16 + Math.sin(Date.now() / 150) * 4;
          ctx.beginPath();
          ctx.arc(targetJ.x, targetJ.y, pulseR, 0, 2 * Math.PI);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = cue.type === 'critical' ? '#EF4444' : '#F59E0B';
          ctx.stroke();
          drawPillTag(targetJ.x - 30, targetJ.y - 24, cue.badge, cue.type === 'critical' ? '#EF4444' : '#F59E0B', '#FEF08A');
        }
      }
    }

    // -------------------------------------------------------------
    // VIEW 3: ALINEACIÓN Y MOLESTIAS (ESQUELETO LIMPIO Y PREVENCIÓN)
    // -------------------------------------------------------------
    else if (view === 'alignment') {
      const checks = options.alignmentChecks || [];
      const getJointStatus = (jointKey: string) => {
        const found = checks.find(c => (c.joint || '').toLowerCase().includes(jointKey));
        return found ? found.status : 'pass';
      };

      if (isUpper) {
        drawThickSegment(pSh, pEl, '#10B981', 3.5);
        drawThickSegment(pEl, pWr, '#34D399', 3.5);
        drawNodePoint(pSh, '#10B981', 5.0);
        drawNodePoint(pEl, '#10B981', 5.0);
        drawNodePoint(pWr, '#34D399', 5.0);
        drawAngleArc(pEl, pSh, pWr, 24, '#38BDF8');

        const elStatus = getJointStatus('codo') !== 'pass' ? getJointStatus('codo') : getJointStatus('elbow');
        const shStatus = getJointStatus('hombro') !== 'pass' ? getJointStatus('hombro') : getJointStatus('shoulder');
        const elAngle = Math.round(frame.angles?.elbow ?? 90);
        const shAngle = Math.round(frame.angles?.shoulder ?? 45);

        let elTagY = pEl.y - 18;
        let shTagY = pSh.y - 18;
        // Anti-collision: if vertical distance between Codo and Hombro is < 34px, push them apart
        if (Math.abs(elTagY - shTagY) < 34) {
          if (elTagY < shTagY) {
            elTagY -= 18;
            shTagY += 18;
          } else {
            elTagY += 18;
            shTagY -= 18;
          }
        }

        if (elStatus === 'warning' || elStatus === 'critical') {
          drawPillTag(pEl.x - 45, elTagY, `⚠️ Codo: ${elAngle}°`, elStatus === 'critical' ? '#EF4444' : '#F59E0B', '#FFFFFF');
        } else {
          drawPillTag(pEl.x - 36, elTagY, `Codo: ${elAngle}°`, '#38BDF8', '#38BDF8');
        }

        if (shStatus === 'warning' || shStatus === 'critical') {
          drawPillTag(pSh.x - 48, shTagY, `⚠️ Hombro: ${shAngle}°`, shStatus === 'critical' ? '#EF4444' : '#F59E0B', '#FFFFFF');
        } else {
          drawPillTag(pSh.x - 40, shTagY, `Hombro: ${shAngle}°`, '#10B981', '#10B981');
        }
      } else {
        if (pEar.valid) {
          drawThickSegment(pEar, pSh, '#10B981', 3.5);
          drawNodePoint(pEar, '#10B981', 4.5);
        }
        drawThickSegment(pSh, pHp, '#10B981', 3.5);
        drawThickSegment(pHp, pKn, '#10B981', 3.5);
        drawThickSegment(pKn, pAk, '#34D399', 3.5);
        drawNodePoint(pSh, '#10B981', 5.0);
        drawNodePoint(pHp, '#10B981', 5.0);
        drawNodePoint(pKn, '#10B981', 5.0);
        drawNodePoint(pAk, '#38BDF8', 5.0);
        drawAngleArc(pHp, pSh, pKn, 24, '#38BDF8');
        drawAngleArc(pKn, pHp, pAk, 20, '#10B981');

        const hpStatus = getJointStatus('cadera') !== 'pass' ? getJointStatus('cadera') : (getJointStatus('hip') !== 'pass' ? getJointStatus('hip') : getJointStatus('pelvis'));
        const knStatus = getJointStatus('rodilla') !== 'pass' ? getJointStatus('rodilla') : getJointStatus('knee');
        const hpAngle = Math.round(frame.angles?.hip ?? 120);
        const knAngle = Math.round(frame.angles?.knee ?? 90);

        let hpTagY = pHp.y - 18;
        let knTagY = pKn.y - 14;
        // Anti-collision: if vertical distance between Cadera and Rodilla is < 34px, push them apart
        if (Math.abs(hpTagY - knTagY) < 34) {
          if (hpTagY < knTagY) {
            hpTagY -= 18;
            knTagY += 18;
          } else {
            hpTagY += 18;
            knTagY -= 18;
          }
        }

        if (hpStatus === 'warning' || hpStatus === 'critical') {
          drawPillTag(pHp.x - 48, hpTagY, `⚠️ Cadera: ${hpAngle}°`, hpStatus === 'critical' ? '#EF4444' : '#F59E0B', '#FFFFFF');
        } else {
          drawPillTag(pHp.x - 42, hpTagY, `Cadera: ${hpAngle}°`, '#38BDF8', '#38BDF8');
        }

        if (knStatus === 'warning' || knStatus === 'critical') {
          drawPillTag(pKn.x - 48, knTagY, `⚠️ Rodilla: ${knAngle}°`, knStatus === 'critical' ? '#EF4444' : '#F59E0B', '#FFFFFF');
        } else {
          drawPillTag(pKn.x - 42, knTagY, `Rodilla: ${knAngle}°`, '#10B981', '#10B981');
        }
      }

      // Check non-angle alignment warnings (e.g. Lumbar / Muñeca)
      checks.forEach(chk => {
        if (chk.status === 'warning' || chk.status === 'critical') {
          const jName = (chk.joint || '').toLowerCase();
          let targetJ = null;
          let label = `⚠️ ${chk.joint}`;
          if (jName.includes('columna') || jName.includes('lumbar') || jName.includes('espalda')) {
            targetJ = pHp;
            label = '⚠️ Lumbar';
          } else if (jName.includes('muñeca') || jName.includes('wrist')) {
            targetJ = pWr;
            label = '⚠️ Muñeca';
          }

          if (targetJ && targetJ.valid && !jName.includes('rodilla') && !jName.includes('knee') && !jName.includes('cadera') && !jName.includes('hip') && !jName.includes('codo') && !jName.includes('elbow') && !jName.includes('hombro') && !jName.includes('shoulder')) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(targetJ.x, targetJ.y, 16, 0, 2 * Math.PI);
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = chk.status === 'critical' ? '#EF4444' : '#F59E0B';
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.restore();
            drawPillTag(targetJ.x - 24, targetJ.y - 32, label, chk.status === 'critical' ? '#EF4444' : '#F59E0B', '#FFFFFF');
          }
        }
      });
    }

    // -------------------------------------------------------------
    // VIEW 4: ESTÍMULO Y RADIOGRAFÍA (VÍDEO EN DIRECTO)
    // -------------------------------------------------------------
    else if (view === 'stimulus') {
      // El vídeo se mantiene limpio sin sobrecargar con esqueleto morado en directo
    }

    // Ghost session comparison overlay
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
        } else {
          ctx.beginPath();
          ctx.moveTo(gHp.x, gHp.y);
          ctx.lineTo(gKn.x, gKn.y);
          ctx.lineTo(gAk.x, gAk.y);
          ctx.stroke();
        }
        ctx.restore();
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

  const UPPER_BODY_EXERCISES = [
    'chest_press_machine', 'bench_press', 'incline_press', 'machine_dips', 't_bar_row',
    'seated_row', 'lat_pulldown', 'shoulder_press', 'curl', 'fly', 'press', 'bench',
    'incline', 'dips', 'row', 'remo', 'pulldown', 'pullup', 'pullover', 't_bar',
    'gironda', 'face_pull', 'chest', 'shoulder', 'deltoid', 'triceps', 'biceps',
    'pec_deck', 'pushdown'
  ];
  const LOWER_BODY_EXCLUSIONS = [
    'leg_press', 'leg_extension', 'leg_curl', 'squat', 'hack', 'rdl', 'deadlift', 'hip_thrust', 'bulgarian', 'lunge'
  ];

  const resolvedExercise = String(
    (isManualOverride && selectedExerciseId !== 'auto')
      ? selectedExerciseId
      : (analysisData?.detected_exercise_type ||
         (analysisData as any)?.exercise_type ||
         (selectedExerciseId !== 'auto' ? selectedExerciseId : '') ||
         activeExercise?.id ||
         'chest_press_machine')
  ).toLowerCase();

  const isUpperBody = Boolean(
    currentFrame?.body_region === 'upper' ||
    analysisData?.body_region === 'upper' ||
    (analysisData as any)?.is_upper_body === true ||
    (
      (
        selectedMuscleGroupId === 'chest' || selectedMuscleGroupId === 'back' || selectedMuscleGroupId === 'shoulders' || selectedMuscleGroupId === 'arms' ||
        UPPER_BODY_EXERCISES.some(ex => resolvedExercise.includes(ex))
      ) && !LOWER_BODY_EXCLUSIONS.some(ex => resolvedExercise.includes(ex))
    )
  );
  const isLowerBody = !isUpperBody;

  const safeExerciseId = resolvedExercise;
  const safePatternId = String(selectedPattern?.id || '').toLowerCase();

  const kinematicMeta = useMemo(() => {
    const exId = resolvedExercise;
    const groupId = isUpperBody
      ? (exId.includes('row') || exId.includes('pulldown') || exId.includes('pullup') || exId.includes('t_bar') || exId.includes('gironda') ? 'back' : 'chest')
      : (selectedMuscleGroupId || 'glutes_hamstrings');

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
  }, [selectedMuscleGroupId, selectedExerciseId, resolvedExercise, isUpperBody]);

  const primaryJointName = kinematicMeta.primaryJointName;
  const secondaryJointName = kinematicMeta.secondaryJointName;

  const isHipThrustVariant = !isUpperBody && (
    safeExerciseId.includes('hip_thrust') ||
    safeExerciseId.includes('kas') ||
    safeExerciseId.includes('bridge') ||
    safeExerciseId.includes('thrust') ||
    Boolean(activeExercise?.patternId && activeExercise.patternId.includes('hip_thrust'))
  );

  // Dynamically calculate leverage and moment arm share for Upper Body or Lower Body
  const d_hip_val = currentFrame?.moment_arms?.d_hip ?? 0.14;
  const d_knee_val = currentFrame?.moment_arms?.d_knee ?? 0.12;
  const d_sh_val = currentFrame?.moment_arms?.d_shoulder ?? 0.15;
  const d_el_val = (currentFrame?.moment_arms as any)?.d_elbow ?? 0.08;

  let shoulderShare = 76;
  let elbowShare = 24;
  if (d_sh_val + d_el_val > 0.005) {
    shoulderShare = Math.round(Math.max(0, Math.min(100, Math.abs((d_sh_val / (d_sh_val + d_el_val)) * 100))));
    elbowShare = Math.round(Math.max(0, Math.min(100, 100 - shoulderShare)));
  }

  let hipShare = 55;
  let kneeShare = 45;
  if (d_hip_val + d_knee_val > 0.005) {
    hipShare = Math.round(Math.max(0, Math.min(100, Math.abs((d_hip_val / (d_hip_val + d_knee_val)) * 100))));
    kneeShare = Math.round(Math.max(0, Math.min(100, 100 - hipShare)));
  }

  let primaryLeverName = 'Brazo Cadera';
  let secondaryLeverName = 'Brazo Rodilla';
  let primaryLeverShare = hipShare;
  let secondaryLeverShare = kneeShare;
  let torqueBadgeText = `${hipShare}% Cadera vs ${kneeShare}% Rodilla`;

  const rawVerdict = currentFrame?.verdict;
  const curElbowDeg = currentFrame ? currentFrame.main_angle : (rawVerdict?.inflection_elbow_deg || 90.0);

  const vlmSplit = analysisData?.vlm_analysis?.torque_split;
  const is2dValid = analysisData?.moment_arms_2d_valid ?? true;

  if (!is2dValid && vlmSplit) {
    primaryLeverName = `Brazo ${vlmSplit.primary_muscle}`;
    secondaryLeverName = `Brazo ${vlmSplit.secondary_muscle}`;
    primaryLeverShare = Math.round(vlmSplit.primary_pct);
    secondaryLeverShare = Math.round(vlmSplit.secondary_pct);
    torqueBadgeText = `${primaryLeverShare}% ${vlmSplit.primary_muscle} vs ${secondaryLeverShare}% ${vlmSplit.secondary_muscle}`;
  } else if (!isLowerBody) {
    if (selectedMuscleGroupId === 'chest' || safeExerciseId.includes('bench') || safeExerciseId.includes('chest') || safeExerciseId.includes('press') || safeExerciseId.includes('dip')) {
      const eff_d_sh = Math.max(d_sh_val, 0.05);
      const totD = eff_d_sh + d_el_val;
      let pectShare = 78;
      let tricShare = 22;
      if (totD > 0.005) {
        pectShare = Math.round(Math.max(0, Math.min(100, Math.abs((eff_d_sh / totD) * 100))));
        tricShare = Math.round(Math.max(0, Math.min(100, 100 - pectShare)));
      } else if (rawVerdict?.pectoral_share && rawVerdict?.triceps_share) {
        pectShare = Math.round(Math.max(0, Math.min(100, Math.abs(rawVerdict.pectoral_share))));
        tricShare = Math.round(Math.max(0, Math.min(100, 100 - pectShare)));
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
          backShare = Math.round(Math.max(0, Math.min(100, Math.abs((d_sh_val / totD) * 100))));
          bicShare = Math.round(Math.max(0, Math.min(100, 100 - backShare)));
        }
      } else if (rawVerdict?.dorsal_share !== undefined && rawVerdict?.biceps_share !== undefined) {
        backShare = Math.round(Math.max(0, Math.min(100, Math.abs(rawVerdict.dorsal_share))));
        bicShare = Math.round(Math.max(0, Math.min(100, Math.abs(rawVerdict.biceps_share))));
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

  const alignmentHealth = useMemo(() => {
    if (!analysisData) {
      return { level: 'optimal' as const, label: 'Alineación Óptima', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10', dot: 'bg-emerald-400' };
    }
    const stress = analysisData.alignment_and_discomfort?.joint_stress_level || 'low';
    const checks = analysisData.alignment_and_discomfort?.checks || [];
    const hasCritical = checks.some(c => c.status === 'critical') || stress === 'high';
    const hasWarning = checks.some(c => c.status === 'warning') || stress === 'moderate';

    if (hasCritical) {
      return { level: 'danger' as const, label: 'Riesgo Articular', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10', dot: 'bg-rose-400' };
    }
    if (hasWarning) {
      return { level: 'warning' as const, label: 'Alineación: Supervisión', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10', dot: 'bg-amber-400' };
    }
    return { level: 'optimal' as const, label: 'Alineación Óptima', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10', dot: 'bg-emerald-400' };
  }, [analysisData]);

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

  // 1-line compact executive summary bar above the 4 tabs
  const executiveSummaryBar = useMemo(() => {
    if (!analysisData || analysisData.total_reps <= 0) return null;
    const reps = analysisData.repetitions_summary || [];
    let tempoStr = '';
    if (reps.length > 0) {
      const eccs = reps.map(r => r.eccentric_sec || r.eccentric_time_s || 0);
      const pauses = reps.map(r => r.pause_sec || r.pause_time_s || 0);
      const concs = reps.map(r => r.concentric_sec || r.concentric_time_s || 0);
      const calcMed = (arr: number[]) => {
        const s = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
      };
      tempoStr = `${calcMed(eccs).toFixed(1)}-${calcMed(pauses).toFixed(1)}-${calcMed(concs).toFixed(1)}s`;
    }

    const rirVal = analysisData.intensity_audit?.rir_estimated ?? analysisData.intensity_metrics?.exact_rir ?? '2';
    const stim = analysisData.stimulus_and_specificity;
    const limitingMuscle = stim?.limiting_factor?.muscle_name || stim?.target_muscle || formatMuscleTarget(activeExercise.targetMuscle) || 'Objetivo';
    const { factor } = calculateStimulatingSetFactor(analysisData.total_reps, rirVal);
    const effectiveCredit = 1.0 * factor;

    return (
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-800 text-[11px] font-mono shadow-sm overflow-x-auto whitespace-nowrap gap-2">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
          <span>{analysisData.total_reps} reps</span>
          {tempoStr && <span className="text-slate-600 font-normal">·</span>}
          {tempoStr && <span className="text-slate-300 font-normal">{tempoStr}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-bold">RIR {rirVal}</span>
          <span className="text-slate-600">·</span>
          <span className="text-purple-300 font-bold">+{effectiveCredit.toFixed(2)} {limitingMuscle}</span>
        </div>
      </div>
    );
  }, [analysisData, activeExercise]);

  // 4 Commercial Biomechanical View Switcher Buttons
  const viewTabs: { id: AnalysisView; label: string; sub: string; icon: any }[] = [
    { id: 'velocity', label: 'Velocidad', sub: 'VBT e Intensidad', icon: Gauge },
    { id: 'coach', label: 'Puntos Clave', sub: 'Línea de Tiempo', icon: MessageSquare },
    { id: 'alignment', label: 'Alineación', sub: 'Salud y Lesiones', icon: ShieldCheck },
    { id: 'stimulus', label: 'Estímulo', sub: 'Radiografía y Polea', icon: Dna },
  ];

  const viewSwitcherButtons = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
      {viewTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
            className={`py-2 px-2.5 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-0.5 transition-all ${
              isActive
                ? tab.id === 'velocity'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : tab.id === 'coach'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : tab.id === 'alignment'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </div>
            <span className="text-[9px] font-normal text-slate-400 opacity-80">{tab.sub}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 landscape:p-2 lg:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[96dvh] landscape:h-[100dvh] lg:landscape:h-auto lg:landscape:max-h-[95dvh] max-w-6xl bg-[#0f111a] sm:border border-blue-500/30 rounded-none sm:rounded-3xl p-2.5 sm:p-4 lg:p-5 shadow-2xl text-white flex flex-col gap-2 sm:gap-3 overflow-hidden my-auto">

        {/* Compact Clean Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white truncate">Análisis Biomecánico</h3>
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
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition ${alignmentHealth.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${alignmentHealth.dot}`} />
                    <span>{alignmentHealth.label}</span>
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
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {showLeverArms ? <Eye className="w-3.5 h-3.5 text-cyan-300" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{showLeverArms ? 'Detalles: ON' : 'Detalles: OFF'}</span>
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
                  preload="auto"
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    const target = e.currentTarget;
                    const dur = target.duration || 0;
                    setVideoDuration(dur);
                    setTrimStart(0);
                    const end = Math.min(dur, 30);
                    setTrimEnd(end);
                    // Mobile-first: Trimmer permanece cerrado por defecto
                  }}
                  onTimeUpdate={(e) => {
                    const target = e.currentTarget;
                    if (!target.paused && !target.seeking && trimEnd > trimStart && target.currentTime >= trimEnd) {
                      target.currentTime = trimStart;
                    }
                  }}
                  onEnded={(e) => {
                    e.currentTarget.currentTime = trimStart;
                    e.currentTarget.play().catch(() => {});
                  }}
                  onError={(e) => {
                    const err = e.currentTarget.error;
                    console.warn('[Video Player Error]', err);
                    setVideoCodecError(err?.message || 'El formato o códec del vídeo no es compatible con el navegador.');
                  }}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Overlay Canvas 1:1 Synchronized */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>

              {/* Codec / Format Error Alert */}
              {videoCodecError && (
                <div className="absolute top-3 left-3 right-3 p-3 bg-amber-950/90 border border-amber-500/50 rounded-xl text-amber-200 text-xs flex items-center gap-2 z-20 backdrop-blur-md">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">{videoCodecError}</span>
                </div>
              )}

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
                      Ajusta los deslizadores de inicio ({trimStart.toFixed(1)}s) y fin ({trimEnd.toFixed(1)}s) para delimitar la serie de trabajo. Elige el ejercicio o déjalo en auto-detección y pulsa iniciar.
                    </p>
                  </div>
                  {Boolean((catalogMachine || effectiveCatalogMachine || (defaultExerciseId && defaultExerciseId !== 'auto'))) && !showExercisePickerInOverlay ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full max-w-md bg-slate-900/95 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 shadow-xl">
                      <div className="flex items-center gap-2.5 min-w-0 text-left w-full sm:w-auto">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                              Ejercicio Vinculado
                            </span>
                            {catalogMachine?.muscleGroupLabel && (
                              <span className="text-[9px] font-medium text-slate-400">
                                · {catalogMachine.muscleGroupLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-white truncate">
                            {catalogMachine
                              ? formatMachineBrandAndModel(catalogMachine.brand, catalogMachine.modelName)
                              : (defaultExerciseName || activeExercise.name)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0 border-t border-slate-800 sm:border-0">
                        <button
                          type="button"
                          onClick={() => setShowExercisePickerInOverlay(true)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-cyan-300 underline px-1 py-1 transition"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={handleStartAnalysis}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xl shadow-cyan-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-200" />
                          <span>Iniciar Análisis</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-md">
                      <select
                        value={isManualOverride ? selectedExerciseId : 'auto'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'auto') {
                            isManualOverrideRef.current = false;
                            setIsManualOverride(false);
                            setSelectedExerciseId('auto');
                          } else {
                            const item = ALL_EXERCISES.find(x => x.id === val);
                            if (item) {
                              handleExerciseSelect(item);
                            }
                          }
                        }}
                        className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-400 shadow-md truncate"
                      >
                        <option value="auto">Auto-detectar ejercicio con IA</option>
                        {MUSCLE_GROUPS.map((group) => (
                          <optgroup key={group.id} label={group.name}>
                            {group.exercises.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleStartAnalysis}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                      >
                        <RefreshCw className="w-4 h-4 text-cyan-200" />
                        <span>Iniciar Análisis</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Coach IA Floating HUD Banner */}
              {activeView === 'coach' && activeTimelineCue && (
                <div className="absolute bottom-3 inset-x-3 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2.5 shadow-2xl z-20 flex items-start justify-between gap-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`p-1.5 rounded-lg text-white shrink-0 mt-0.5 ${
                      activeTimelineCue.type === 'critical' || activeTimelineCue.type === 'error'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : activeTimelineCue.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">{activeTimelineCue.badge}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {activeTimelineCue.timestamp_sec.toFixed(1)}s · Cámara Lenta 0.5x
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-snug">{activeTimelineCue.message}</p>
                      <p className="text-xs font-bold text-cyan-300 mt-1 flex items-center gap-1">
                        <span>🔧 Corrección:</span>
                        <span className="text-white font-normal">{activeTimelineCue.technical_fix}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTimelineCue(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* HUD Telemetry Badges */}
              {pipelineState === 'ready' && !activeTimelineCue && (
                <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-10 max-w-[90%]">
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold shadow-md">
                    {analysisData && analysisData.total_reps > 0 && currentFrame && currentFrame.rep_number > 0
                      ? `REP #${currentFrame.rep_number}`
                      : 'PREPARACIÓN'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold shadow-md">
                    {currentFrame?.phase || 'IDLE'}
                  </span>
                  {activeView === 'velocity' ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-[10px] font-mono font-bold shadow-md">
                      {(() => {
                        const loss = Math.round(
                          analysisData?.intensity_audit?.velocity_loss_pct ??
                          analysisData?.intensity_metrics?.velocity_loss_pct ??
                          0
                        );
                        const relVelPct = Math.max(0, Math.min(100, 100 - Math.max(0, loss)));
                        return `Última rep: ${relVelPct}% vel`;
                      })()}
                    </span>
                  ) : activeView === 'coach' ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-200 text-[10px] font-mono font-bold shadow-md">
                      Supervisión IA Activa
                    </span>
                  ) : activeView === 'alignment' ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-blue-500/40 text-blue-200 text-[10px] font-mono font-bold shadow-md">
                      {isUpperBody
                        ? `Codo: ${Math.round(currentFrame?.angles?.elbow ?? 90)}° · Hombro: ${Math.round(currentFrame?.angles?.shoulder ?? 45)}°`
                        : `Cadera: ${Math.round(currentFrame?.angles?.hip ?? 120)}° · Rodilla: ${Math.round(currentFrame?.angles?.knee ?? 90)}°`}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold shadow-md">
                      Estímulo: {analysisData?.stimulus_and_specificity?.target_muscle || (isUpperBody ? 'Pectoral' : 'Glúteo')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Video Playback & Scrub Bar with Interactive Timeline Pins */}
            <div className="flex flex-col gap-1 p-2 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="relative flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={effectiveTotalDuration}
                  step={0.05}
                  value={videoCurrentTime}
                  onChange={handleScrubChange}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 z-10"
                />
                {/* Timeline Cue Markers */}
                {analysisData?.timeline_cues && effectiveTotalDuration > 0 && (
                  <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex items-center">
                    {(() => {
                      const rirCurrent = Number(analysisData?.intensity_audit?.rir_estimated ?? analysisData?.intensity_metrics?.exact_rir ?? 2);
                      const totalRepsCurrent = analysisData?.total_reps ?? 0;
                      const validMarkers = analysisData.timeline_cues.filter(c => !(c.badge === 'Esfuerzo Terminal' && (rirCurrent >= 3.0 || totalRepsCurrent < 4)));
                      return validMarkers.map((cue, idx) => {
                        const pct = Math.max(0, Math.min(100, (cue.timestamp_sec / effectiveTotalDuration) * 100));
                        const isCritical = cue.type === 'critical' || cue.type === 'error';
                        const isWarning = cue.type === 'warning';
                        const markerBg = isCritical ? 'bg-rose-500 ring-rose-400/50' : isWarning ? 'bg-amber-400 ring-amber-300/50' : 'bg-emerald-400 ring-emerald-300/50';
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCueClick(cue);
                            }}
                            className={`absolute -translate-x-1/2 w-3 h-3 rounded-full pointer-events-auto ring-2 transition-transform hover:scale-150 z-20 shadow-md ${markerBg}`}
                            style={{ left: `${pct}%` }}
                            title={`[${cue.timestamp_sec.toFixed(1)}s] ${cue.badge}: ${cue.message}`}
                          />
                        );
                      });
                    })()}
                  </div>
                )}
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

                <div className="flex items-center gap-1.5">
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
                  <button
                    type="button"
                    onClick={() => setShowTrimmer(prev => !prev)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      showTrimmer
                        ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Recortar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Range Trimmer Component (Interactive Dual Slider & Controls) */}
            {uploadedVideoUrl && showTrimmer && (
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-300">Recortador de Rango</span>
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
                      onClick={() => setShowTrimmer(false)}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700"
                    >
                      Ocultar
                    </button>
                  </div>
                </div>

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
                        <RefreshCw className={`w-3.5 h-3.5 ${pipelineState === 'analyzing' ? 'animate-spin' : ''}`} />
                        <span>{analysisData ? 'Re-analizar tramo' : 'Iniciar Análisis Biomecánico'}</span>
                      </button>
                    </div>
                  </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Mode Switcher, Exercise Selector & Biomechanical Diagnosis */}
          <div className="flex flex-col gap-2.5 min-w-0 lg:col-span-5">
            {executiveSummaryBar}
            <div className="block">
              {viewSwitcherButtons}
            </div>

            {/* Exercise Configuration & Auto-Detection */}
            {catalogMachine ? (
              <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-cyan-500/40 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-white text-xs truncate">
                      {formatMachineBrandAndModel(catalogMachine.brand, catalogMachine.modelName)}
                    </span>
                    {catalogMachine.line && (
                      <span className="text-[10px] text-cyan-300 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                        {catalogMachine.line}
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px] truncate">
                      · {catalogMachine.muscleGroupLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCatalogPickerModal(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700/80 transition active:scale-95"
                    title="Cambiar máquina del catálogo oficial"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Cambiar</span>
                  </button>
                </div>
              </div>
            ) : analysisData && !showExerciseConfigEdit ? (
              <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-white text-xs truncate">
                      {analysisData?.vlm_analysis?.detected_exercise_name || activeExercise.name}
                    </span>
                    {activeExercise?.targetMuscle && (
                      <span className="text-slate-400 text-[11px] truncate">
                        · {formatMuscleTarget(activeExercise.targetMuscle)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCatalogPickerModal(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded-xl bg-slate-800 border border-slate-700/80 transition active:scale-95"
                    title="Vincular con máquina comercial"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Catálogo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExerciseConfigEdit(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-xl bg-slate-800 border border-slate-700/80 transition active:scale-95"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Configuración y Ejercicio
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
                    {analysisData && (
                      <button
                        type="button"
                        onClick={() => setShowExerciseConfigEdit(false)}
                        className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-semibold transition"
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>

                {/* Selector de Ejercicio */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 block">
                    Modo / Ejercicio para Análisis
                  </label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const item = ALL_EXERCISES.find(x => x.id === val);
                      if (item) {
                        handleExerciseSelect(item);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-400 transition truncate shadow-inner"
                  >
                    {MUSCLE_GROUPS.map((group) => (
                      <optgroup key={group.id} label={group.name}>
                        {group.exercises.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* VBT Compact Configuration: Peso (kg) y Reps objetivo */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Peso / Carga (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Opcional"
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

                <button
                  type="button"
                  onClick={() => {
                    handleStartAnalysis();
                    setShowExerciseConfigEdit(false);
                  }}
                  disabled={pipelineState === 'compressing' || pipelineState === 'analyzing'}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition active:scale-[0.99]"
                >
                  <RefreshCw className={`w-4 h-4 ${pipelineState === 'analyzing' ? 'animate-spin' : ''}`} />
                  <span>{analysisData ? 'Re-analizar Ejercicio' : 'Iniciar Análisis Biomecánico'}</span>
                </button>
              </div>
            )}

            {/* Discrete Error notice if VLM failed and fell back */}
            {analysisData && analysisData.vlm_used === false && analysisData.vlm_error && (
              <div
                className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 flex items-start gap-2"
                title={analysisData.vlm_error}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold block">Modo fallback local</span>
                  <span className="text-[10px] text-amber-300/80 line-clamp-2">{analysisData.vlm_error}</span>
                </div>
              </div>
            )}

            {/* DYNAMIC 4-VIEW METRIC PANELS */}

            {/* ============================================================== */}
            {/* VIEW 1: VELOCIDAD E INTENSIDAD (VBT & FATIGA)                   */}
            {/* ============================================================== */}
            {activeView === 'velocity' && (
              <>
                {/* CARD 1: Auditoría de Intensidad y Fatiga */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      Auditoría de Intensidad (VBT)
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      (analysisData?.total_reps ?? 0) < 2
                        ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                        : (analysisData?.intensity_audit?.rpe_estimated ?? intensity.estimated_rpe) >= 9
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : (analysisData?.intensity_audit?.rpe_estimated ?? intensity.estimated_rpe) >= 8
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {(analysisData?.total_reps ?? 0) < 2
                        ? 'Requiere ≥ 2 reps'
                        : `RIR ${analysisData?.intensity_audit?.rir_estimated ?? intensity.estimated_rir} · RPE ${(analysisData?.intensity_audit?.rpe_estimated ?? intensity.estimated_rpe).toFixed(1)}`}
                    </span>
                  </div>

                  {/* 4-Item Physical Quantities Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Pérdida Vel.</span>
                      <span className={`text-xs font-black font-mono ${
                        (analysisData?.intensity_audit?.velocity_loss_pct ?? intensity.velocity_loss_pct) >= 20 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {Math.round(analysisData?.intensity_audit?.velocity_loss_pct ?? intensity.velocity_loss_pct)}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Pérdida ROM</span>
                      <span className="text-xs font-black text-cyan-300 font-mono">
                        {Math.round(analysisData?.rep_comparison?.rom_loss_pct ?? 0)}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Tempo Medio</span>
                      <span className="text-[10px] font-black text-purple-300 font-mono">
                        {(() => {
                          const reps = analysisData?.repetitions_summary || [];
                          if (reps.length === 0) return '2.0-0.3-1.0';
                          const me = (reps.reduce((acc, r) => acc + (r.eccentric_sec || 0), 0) / reps.length).toFixed(1);
                          const mp = (reps.reduce((acc, r) => acc + (r.pause_sec || 0), 0) / reps.length).toFixed(1);
                          const mc = (reps.reduce((acc, r) => acc + (r.concentric_sec || 0), 0) / reps.length).toFixed(1);
                          return `${me}s-${mp}s-${mc}s`;
                        })()}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Reps</span>
                      <span className="text-xs font-black text-emerald-300 font-mono">{analysisData?.total_reps ?? 0}</span>
                    </div>
                  </div>

                  {/* Toggle: Comparar Rep 1 vs Última */}
                  {analysisData?.rep_comparison && (
                    <button
                      type="button"
                      onClick={() => setShowRepComparison(prev => !prev)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                        showRepComparison
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Comparar Rep 1 vs. Última (Superponer en Vídeo)</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${showRepComparison ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {showRepComparison ? 'Activo' : 'Activar'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Comparativa con Sesión Anterior (si existe en historial local) */}
                {previousSessionData?.v_best && analysisData?.intensity_metrics?.v_best && (() => {
                  const curV = analysisData.intensity_metrics.v_best;
                  const prevV = previousSessionData.v_best;
                  const diffPct = Math.round(((curV - prevV) / prevV) * 100);
                  const isFaster = diffPct >= 0;
                  return (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-cyan-300">
                      <span className="text-slate-400">Historial de ejercicio:</span>
                      <span className={`font-bold ${isFaster ? 'text-emerald-400' : 'text-amber-400'}`}>
                        vs. última sesión: {isFaster ? `+${diffPct}% más rápido` : `${diffPct}% vel`}
                      </span>
                    </div>
                  );
                })()}

                {/* CARD 2: Progresión de Velocidad por Repetición */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Progresión de Velocidad Concéntrica
                    </span>
                    <span className="text-cyan-400 font-mono text-[11px]">
                      {(() => {
                        const lossVal = Math.round(analysisData?.intensity_audit?.velocity_loss_pct ?? intensity.velocity_loss_pct ?? 0);
                        return `Pérdida Fatiga: ${lossVal > 0 ? `-${lossVal}%` : '0%'}`;
                      })()}
                    </span>
                  </div>

                  {intensity.rep_velocities && intensity.rep_velocities.length > 0 && (
                    <div className="h-12 w-full flex items-end gap-1.5 pt-1 border-t border-slate-800">
                      {intensity.rep_velocities.map((vel: number, idx: number) => {
                        const maxV = intensity.max_rep_vel || 1;
                        const barHeightPct = Math.max(20, Math.min(100, Math.round((vel / maxV) * 100)));
                        const isLast = idx === intensity.rep_velocities.length - 1;
                        return (
                          <div
                            key={idx}
                            className="flex-1 h-full flex flex-col justify-end items-center gap-0.5 group relative"
                            title={`Rep #${idx + 1}: ${barHeightPct}% de velocidad inicial`}
                          >
                            <div className="w-full flex-1 flex items-end justify-center">
                              <div
                                className={`w-full rounded-t transition-all duration-300 ${
                                  isLast && (analysisData?.intensity_audit?.velocity_loss_pct ?? 0) >= 20
                                    ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-sm shadow-amber-500/30'
                                    : 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-sm shadow-cyan-500/20'
                                }`}
                                style={{ height: `${barHeightPct}%`, minHeight: '6px' }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-white">
                              #{idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CARD 3: Veredicto Clínico del Coach IA */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Veredicto de Intensidad Clínica
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {analysisData?.intensity_audit?.failure_proximity === 'effective_growth'
                        ? 'Estímulo Óptimo'
                        : analysisData?.intensity_audit?.failure_proximity === 'absolute_failure'
                        ? 'Fallo Muscular'
                        : 'Submáximo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed break-words whitespace-normal">
                    {analysisData?.intensity_audit?.coach_verdict || "Intensidad y esfuerzo completados de forma controlada dentro del umbral efectivo de hipertrofia."}
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: PUNTOS CLAVE (TIMELINE INTERACTIVA & CUES)             */}
            {/* ============================================================== */}
            {activeView === 'coach' && (
              <div className="space-y-3">
                {/* On-demand Coach Review Generator Banner (Superuser / Dev mode only) */}
                {isSuperUser && (!analysisData?.vlm_used || !analysisData?.timeline_cues || analysisData.timeline_cues.length === 0) && (
                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-200">Revisión del Coach IA Multimodal</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Genera una auditoría con Gemini VLM para detectar sticking points y correcciones biomecánicas fotograma a fotograma.
                      </p>
                    </div>

                    {isGeneratingCoachReview ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold animate-pulse border border-slate-700">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Analizando con Coach IA (Gemini VLM)...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateCoachReview}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg hover:from-emerald-500 hover:to-teal-500 transition active:scale-95 shadow-emerald-500/20"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Generar Revisión del Coach IA</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Friendly Error Banner (e.g. 429 quota error, Superuser only) */}
                {isSuperUser && coachReviewError && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold block text-amber-300">Aviso de Cuota</span>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">{coachReviewError}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateCoachReview}
                      disabled={isGeneratingCoachReview}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 transition"
                    >
                      Reintentar Revisión
                    </button>
                  </div>
                )}

                {/* Timeline Cues List (if cues exist) */}
                {(() => {
                  const rirCurrent = Number(analysisData?.intensity_audit?.rir_estimated ?? analysisData?.intensity_metrics?.exact_rir ?? 2);
                  const totalRepsCurrent = analysisData?.total_reps ?? 0;
                  const validCues = (analysisData?.timeline_cues || []).filter(c => !(c.badge === 'Esfuerzo Terminal' && (rirCurrent >= 3.0 || totalRepsCurrent < 4)));

                  if (validCues.length === 0) {
                    return (
                      <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">Ejecución Limpia y Estable</h4>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          No se han detectado anomalías de trayectoria ni pérdidas críticas de velocidad durante las repeticiones analizadas.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            Intervenciones del Coach IA ({validCues.length})
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Pines interactivos 0.5x
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Pulsa en cualquier tarjeta para saltar al segundo exacto en cámara lenta y ver la corrección técnica.
                        </p>
                      </div>

                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        {validCues.map((cue, idx) => {
                          const isCritical = cue.type === 'critical' || cue.type === 'error';
                          const isWarning = cue.type === 'warning';
                          const isSelected = activeTimelineCue === cue;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleCueClick(cue)}
                            className={`p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                              isSelected
                                ? 'bg-cyan-950/50 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className="text-xs font-black text-white">{cue.badge}</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                                {cue.timestamp_sec.toFixed(1)}s
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{cue.message}</p>
                            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-cyan-300">
                              <span className="font-bold text-slate-400 block mb-0.5">🔧 Solución Técnica:</span>
                              <span>{cue.technical_fix}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold pt-0.5">
                              <span className="flex items-center gap-1">
                                <Play className="w-3 h-3 fill-current" />
                                <span>Ver a 0.5x cámara lenta</span>
                              </span>
                              <span className="text-slate-500 uppercase font-mono">{cue.affected_joint}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: ALINEACIÓN Y MOLESTIAS (PREVENCIÓN & SALUD)             */}
            {/* ============================================================== */}
            {activeView === 'alignment' && (
              <div className="space-y-3">
                {/* CARD 1: Nivel de Estrés Articular */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      Estrés Articular y Molestias
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      analysisData?.alignment_and_discomfort?.joint_stress_level === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : analysisData?.alignment_and_discomfort?.joint_stress_level === 'moderate'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {analysisData?.alignment_and_discomfort?.joint_stress_level === 'high'
                        ? 'Alto · Sobrecarga'
                        : analysisData?.alignment_and_discomfort?.joint_stress_level === 'moderate'
                        ? 'Medio · Supervisión'
                        : 'Bajo · Óptimo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {analysisData?.alignment_and_discomfort?.discomfort_risk_summary ||
                      'Alineación postural y articular evaluada sin patrones lesivos agudos.'}
                  </div>
                </div>

                {/* CARD 2: Checklist Anatómico */}
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Comprobaciones Biomecánicas Anatómicas
                  </span>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {analysisData?.alignment_and_discomfort?.checks && analysisData.alignment_and_discomfort.checks.map((chk, idx) => {
                      const isCritical = chk.status === 'critical';
                      const isWarning = chk.status === 'warning';
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {isCritical ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              ) : isWarning ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span>{chk.joint}</span>
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {isCritical ? 'Crítico' : isWarning ? 'Ajustar' : 'Óptimo'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{chk.observation}</p>
                          {(isCritical || isWarning) && chk.fix && (
                            <p className="text-[11px] font-medium text-cyan-300 pt-0.5">
                              <span className="text-slate-400">Corrección:</span> {chk.fix}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: ESTÍMULO Y RADIOGRAFÍA (PALANCAS & AJUSTES)              */}
            {/* ============================================================== */}
            {activeView === 'stimulus' && (
              <div className="space-y-3">
                {/* CARD 1: Factor Limitante y Sinergistas Fraccionales (Top) */}
                {(() => {
                  const stim = analysisData?.stimulus_and_specificity;
                  const limiting = stim?.limiting_factor || {
                    muscle_id: 'target',
                    muscle_name: stim?.target_muscle || formatMuscleTarget(activeExercise.targetMuscle),
                    effective_set_credit: 1.0,
                    reason: 'Factor limitante principal de la serie.'
                  };
                  const synergists = stim?.synergists || (stim?.secondary_muscles || []).map((m, idx) => ({
                    muscle_id: `syn_${idx}`,
                    muscle_name: m,
                    effective_set_credit: idx === 0 ? 0.5 : 0.3,
                    reason: 'Sinergista agonista / estabilizador.'
                  }));
                  const activeProfile = catalogMachine
                    ? catalogMachine.profile
                    : getDefaultProfileForExerciseType(selectedExerciseId || activeExercise.id);
                  const effectiveProfileLabel = customTensionProfile || activeProfile.curveLabel || activeProfile.peakZone || stim?.tension_profile || 'Uniforme';

                  const rirVal = analysisData?.intensity_audit?.rir_estimated ?? analysisData?.intensity_metrics?.exact_rir ?? 2.0;
                  const totalRepsCurrent = analysisData?.total_reps ?? 0;
                  const { rir, factor } = calculateStimulatingSetFactor(totalRepsCurrent, rirVal);
                  const effectiveCredit = Number((1.0 * factor).toFixed(2));

                  return (
                    <>
                      <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-purple-400" />
                            Modelo de Estímulo e Hipertrofia
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCatalogPickerModal(true)}
                            className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400 transition flex items-center gap-1.5 active:scale-95"
                            title="Seleccionar máquina comercial del catálogo"
                          >
                            <Compass className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="truncate max-w-[160px]">
                              {catalogMachine ? formatMachineBrandAndModel(catalogMachine.brand, catalogMachine.modelName) : `Perfil: ${effectiveProfileLabel}`} · Cambiar
                            </span>
                          </button>
                        </div>

                        {/* Biomechanical Resistance Curve with Superuser Interactive Editing */}
                        {(() => {
                          const profileTargetId = catalogMachine ? catalogMachine.id : (selectedExerciseId || activeExercise.id);
                          const profileTargetName = catalogMachine ? formatMachineBrandAndModel(catalogMachine.brand, catalogMachine.modelName) : activeExercise.name;

                          return (
                            <div className="p-3 bg-gradient-to-br from-slate-950 to-[#121626] border border-cyan-500/30 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5" />
                                  {catalogMachine ? `Curva Oficial: ${formatMachineBrandAndModel(catalogMachine.brand, catalogMachine.modelName)}` : `Perfil Biomecánico: ${activeExercise.name}`}
                                </span>
                              </div>

                              <ResistanceCurveEditor
                                targetId={profileTargetId}
                                targetName={profileTargetName}
                                initialWeights={activeProfile.curveWeights}
                                initialPeakZone={activeProfile.peakZone}
                                initialLabel={activeProfile.curveLabel}
                                height={85}
                                onWeightsChange={(newW, newLabel) => {
                                  if (newLabel) setCustomTensionProfile(newLabel);
                                  if (catalogMachine) {
                                    catalogMachine.profile.curveWeights = newW;
                                    if (newLabel) catalogMachine.profile.curveLabel = newLabel;
                                  }
                                }}
                              />

                              <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                                <span className="font-bold text-cyan-300">
                                  {activeProfile.curveLabel || activeProfile.peakZone}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowMachineClassifierModal(true)}
                                  className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
                                >
                                  + Clasificar no listada
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-snug">
                                {activeProfile.resistanceCurveDescription}
                              </p>
                            </div>
                          );
                        })()}

                        {/* Factor Limitante Principal Card */}
                        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                              Factor Limitante Principal
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm shadow-purple-500/30">
                              +{effectiveCredit.toFixed(2)} Serie Efectiva
                            </span>
                          </div>
                          <p className="text-sm font-black text-white">{limiting.muscle_name}</p>
                          {limiting.reason && (
                            <p className="text-[11px] text-purple-200/80 leading-snug">{limiting.reason}</p>
                          )}
                        </div>

                        {/* Sinergistas Fraccionales */}
                        {synergists.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Sinergistas Agonistas y Estabilizadores
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {synergists.map((syn, idx) => {
                                const baseCredit = syn.effective_set_credit ?? (idx === 0 ? 0.5 : 0.3);
                                const synCredit = Number((baseCredit * factor).toFixed(2));
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200"
                                    title={syn.reason}
                                  >
                                    <span className="text-cyan-400 font-mono font-bold">+{synCredit.toFixed(2)}</span>
                                    <span>{syn.muscle_name}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 2: Ajustes Biomecánicos Recomendados */}
                      {stim?.actionable_adjustments && stim.actionable_adjustments.length > 0 && (
                        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Crosshair className="w-4 h-4 text-amber-400" />
                            Ajustes Biomecánicos Recomendados
                          </span>
                          <div className="space-y-1.5 text-xs text-slate-200">
                            {stim.actionable_adjustments.map((adj, idx) => (
                              <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                                <span className="text-amber-400 font-bold">•</span>
                                <span className="leading-snug">{adj}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CARD 3: Aplicar Ponderación al Volumen Semanal */}
                      <button
                        type="button"
                        onClick={() => {
                          setVolumeMultiplierApplied(true);
                          if (onApplyVolumeMultiplier) {
                            onApplyVolumeMultiplier(
                              effectiveCredit,
                              limiting.muscle_name
                            );
                          }
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border shadow-lg transition active:scale-95 ${
                          volumeMultiplierApplied
                            ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50'
                            : effectiveCredit === 0
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20'
                        }`}
                      >
                        {volumeMultiplierApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>¡Volumen Añadido! (+{effectiveCredit.toFixed(2)} serie en {limiting.muscle_name})</span>
                          </>
                        ) : (
                          <>
                            <Flame className={`w-4 h-4 ${effectiveCredit === 0 ? 'text-slate-500' : 'text-amber-300'}`} />
                            <span>
                              {effectiveCredit === 0
                                ? `Serie de aproximación / técnica (RIR ${rir.toFixed(1)} · +0.00 volumen): Registrar`
                                : `Añadir al Volumen Semanal (RIR ${rir.toFixed(1)} · ×${factor.toFixed(2)}): +${effectiveCredit.toFixed(2)} ${limiting.muscle_name}`}
                            </span>
                          </>
                        )}
                      </button>
                    </>
                  );
                })()}

                {/* Collapsible Accordion: Radiografía Biomecánica (Fotogramas Clave & Palancas Pro) */}
                {analysisData && (analysisData.snapshot_stretch_b64 || analysisData.snapshot_peak_b64) && (
                  <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowProSnapshots(prev => !prev)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-purple-400" />
                        Ver Radiografía de Palancas (Pro)
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProSnapshots ? 'rotate-180' : ''}`} />
                    </button>

                    {showProSnapshots && (
                      <div className="space-y-3 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Fotogramas Clave en Máxima Flexión y Extensión
                          </span>
                          {/* Tabs [Ambas] | [Estiramiento] | [Bloqueo] */}
                          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setActiveSnapshotTab('both')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                activeSnapshotTab === 'both' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Ambas
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSnapshotTab('stretch')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                activeSnapshotTab === 'stretch' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Estiramiento
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSnapshotTab('peak')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                activeSnapshotTab === 'peak' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Bloqueo
                            </button>
                          </div>
                        </div>

                        {/* Calibrate Pulley Toolbar */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Inspección estática de brazos de palanca
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsCalibratingPulley(prev => !prev)}
                            className={`px-2 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition ${
                              isCalibratingPulley
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 animate-pulse'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                            title="Haz clic sobre la polea en la foto para calcular el brazo de palanca real"
                          >
                            <Crosshair className="w-3 h-3" />
                            <span>{isCalibratingPulley ? 'Modo Clic Activo' : 'Calibrar Polea'}</span>
                          </button>
                        </div>

                        {/* Snapshot Viewer */}
                        <SnapshotViewer
                          stretchB64={analysisData.snapshot_stretch_b64}
                          peakB64={analysisData.snapshot_peak_b64}
                          jointsStretch={analysisData.joints_stretch}
                          jointsPeak={analysisData.joints_peak}
                          loadType={activeExercise.loadType}
                          isUpperBody={isUpperBody}
                          exerciseType={catalogMachine?.canonicalExerciseType || (activeExercise.exerciseType !== 'auto' ? activeExercise.exerciseType : '') || resolvedExercise || activeExercise.name}
                          activeTab={activeSnapshotTab}
                          isCalibrating={isCalibratingPulley}
                          pulleyOrigin={proPulleyOrigin}
                          onSetPulleyOrigin={setProPulleyOrigin}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Repetitions Breakdown Accordion */}            {/* Repetitions Breakdown Accordion */}
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
        <MachineResistanceClassifierModal
          isOpen={showMachineClassifierModal}
          onClose={() => setShowMachineClassifierModal(false)}
          exerciseTitle={activeExercise.name || selectedExerciseId}
          onSaveProfile={(profile: MachineResistanceProfile) => {
            const label =
              profile.curveLabel ||
              (profile.peakZone === 'stretched'
                ? 'Pico en Estiramiento'
                : profile.peakZone === 'shortened'
                ? 'Pico en Acortamiento'
                : profile.peakZone === 'mid'
                ? 'Pico en Punto Medio'
                : 'Uniforme');
            setCustomTensionProfile(label);
            if (analysisData?.stimulus_and_specificity) {
              analysisData.stimulus_and_specificity.tension_profile = label;
            }
            const customEntry: CatalogMachineEntry = {
              id: `custom_${Date.now()}`,
              brand: (profile.machineBrandGuess as any) || 'Genérica',
              modelName: profile.machineModelGuess || activeExercise.name || 'Máquina Personalizada',
              line: 'Personalizada',
              canonicalExerciseType: selectedExerciseId || 'chest_press_machine',
              muscleGroupLabel: (activeMuscleGroup.name as any) || 'Pectoral',
              profile
            };
            setCatalogMachine(customEntry);
          }}
        />

        {/* Machine Catalog Picker Modal */}
        {showCatalogPickerModal && (
          <MachineCatalogPickerModal
            isOpen={true}
            onClose={() => setShowCatalogPickerModal(false)}
            selectedMachineId={catalogMachine?.id}
            onSelectMachine={(machine) => {
              setCatalogMachine(machine);
              setSelectedExerciseId(machine.canonicalExerciseType);
              setIsManualOverride(true);
              isManualOverrideRef.current = true;
              const resolved = resolveExercise(machine.canonicalExerciseType, machine.modelName);
              const parentGroup = MUSCLE_GROUPS.find(g => g.exercises.some(e => e.id === resolved.id));
              if (parentGroup) setSelectedMuscleGroupId(parentGroup.id);
              setLoadType('machine');
              setTargetMuscle(resolved.targetMuscle);
              const label =
                machine.profile.curveLabel ||
                (machine.profile.peakZone === 'stretched'
                  ? 'Pico en Estiramiento'
                  : machine.profile.peakZone === 'shortened'
                  ? 'Pico en Acortamiento'
                  : machine.profile.peakZone === 'mid'
                  ? 'Pico en Punto Medio'
                  : 'Uniforme');
              setCustomTensionProfile(label);
              if (analysisData?.stimulus_and_specificity) {
                analysisData.stimulus_and_specificity.tension_profile = label;
              }
              setShowCatalogPickerModal(false);
            }}
          />
        )}
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
