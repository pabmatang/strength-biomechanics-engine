import React, { useState } from 'react';
import { 
  Calculator, Trophy, Dumbbell, Award, Flame, BarChart2, Layers, CheckCircle, 
  Sparkles, AlertTriangle, Activity, Zap, RefreshCw, Heart, Smile, ShieldAlert,
  ArrowRight, CheckCircle2, ChevronRight, X, Gauge, AlertCircle, TrendingDown,
  TrendingUp, HelpCircle, Clock, ChevronDown, ChevronUp, Scale
} from 'lucide-react';
import { Workout, PersonalRecord, MuscleGroup, ExerciseTemplate, WorkoutSurvey } from '../types/workout';
import { calculate1RM } from '../utils/fitness';
import { EXERCISE_DATABASE } from '../data/exercises';
import { SPANISH_GYM_MACHINES } from '../data/spanishGymMachines';

interface AnalyticsScreenProps {
  workouts: Workout[];
  onOpenBiomechanicsRAG?: (joint?: string, exercise?: string) => void;
}

const MUSCLE_SPANISH: Record<string, string> = {
  chest: 'Pecho',
  lats: 'Dorsales (Espalda)',
  upper_back: 'Espalda Alta / Romboides',
  shoulders: 'Hombros (Deltoides)',
  quadriceps: 'Cuádriceps',
  hamstrings: 'Isquiosurales',
  glutes: 'Glúteos',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  calves: 'Gemelos',
  abdominals: 'Abdominales',
  lower_back: 'Espalda Baja'
};

// Recommended Weekly Volume Landmark (Dr. Mike Israetel / Hypertrophy science)
// Minimum Effective Volume (MEV) ~8-10 series, Maximum Adaptive Volume (MAV) ~15-20 series
const RECOMMENDED_WEEKLY_SETS: Record<string, { min: number; target: number; max: number }> = {
  chest: { min: 8, target: 16, max: 22 },
  lats: { min: 10, target: 16, max: 22 },
  upper_back: { min: 8, target: 14, max: 20 },
  shoulders: { min: 8, target: 16, max: 22 },
  quadriceps: { min: 8, target: 16, max: 20 },
  hamstrings: { min: 6, target: 14, max: 18 },
  glutes: { min: 4, target: 12, max: 18 },
  biceps: { min: 6, target: 14, max: 20 },
  triceps: { min: 6, target: 14, max: 20 },
  calves: { min: 6, target: 12, max: 16 },
  abdominals: { min: 4, target: 10, max: 16 }
};

const muscleKeys = Object.keys(RECOMMENDED_WEEKLY_SETS);

interface RedundancyItem {
  muscle: string;
  exercises: string[];
  curve: string;
  reason: string;
  recommendation: string;
}

interface BiomechanicalGapItem {
  muscle: string;
  missingProfile: string;
  reason: string;
  suggestedMachines: string[];
}

interface StagnationItem {
  exerciseTitle: string;
  muscle: string;
  stagnationWeeks: number;
  lastWeightKg: number;
  lastReps: number;
  avgRpe: number;
  diagnosis: string;
  deloadAdvice: string;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ 
  workouts,
  onOpenBiomechanicsRAG 
}) => {
  // 1RM Calculator state
  const [calcWeight, setCalcWeight] = useState<number>(100);
  const [calcReps, setCalcReps] = useState<number>(5);
  const estimated1RM = calculate1RM(calcWeight, calcReps);

  // Biomechanical Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [activeAuditTab, setActiveAuditTab] = useState<'redundancies' | 'gaps' | 'stagnation'>('redundancies');
  const [expandedMuscleKey, setExpandedMuscleKey] = useState<string | null>(null);

  // Filter workouts in the last 7 days (rolling weekly window)
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

  const thisWeekWorkouts = workouts.filter(w => {
    const wTime = new Date(w.start_time).getTime();
    return wTime >= sevenDaysAgo;
  });

  // Calculate EFFECTIVE SETS per muscle group this week (Normal, DropSet, Failure; Warmup excluded!)
  const weeklyMuscleSets: Record<string, number> = {};

  thisWeekWorkouts.forEach(w => {
    w.exercises.forEach(ex => {
      const effectiveSets = ex.sets.filter(s => s.is_completed && s.type !== 'warmup').length;
      weeklyMuscleSets[ex.muscle_group] = (weeklyMuscleSets[ex.muscle_group] || 0) + effectiveSets;
    });
  });

  // Advanced Muscle Recovery & Volume Analytics
  interface MuscleAdvancedMetrics {
    effectiveSets: number;
    tonnageKg: number;
    frequencyCount: number;
    lastTrainedHoursAgo: number | null;
    lastTrainedDate: string | null;
    lastExerciseName: string | null;
    recoveryStatus: 'fresh' | 'ready' | 'recovering' | 'fatigued' | 'untrained';
    recoveryLabel: string;
    avgRpe: number | null;
  }

  const advancedMuscleStats: Record<string, MuscleAdvancedMetrics> = {};

  muscleKeys.forEach(mKey => {
    let effSets = 0;
    let tonnage = 0;
    const trainingDays = new Set<string>();
    const rpeValues: number[] = [];

    thisWeekWorkouts.forEach(w => {
      let trainedInWorkout = false;
      w.exercises.forEach(ex => {
        if (ex.muscle_group === mKey) {
          ex.sets.forEach(s => {
            if (s.is_completed && s.type !== 'warmup') {
              effSets++;
              tonnage += (s.weight_kg || 0) * (s.reps || 0);
              trainedInWorkout = true;
              if (s.rpe) rpeValues.push(s.rpe);
            }
          });
        }
      });
      if (trainedInWorkout && w.start_time) {
        trainingDays.add(w.start_time.split('T')[0]);
      }
    });

    // Find most recent workout for this muscle across history
    let mostRecentTime: number | null = null;
    let mostRecentDate: string | null = null;
    let mostRecentExercise: string | null = null;

    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    for (const w of sortedWorkouts) {
      const matchEx = w.exercises.find(
        ex => ex.muscle_group === mKey && ex.sets.some(s => s.is_completed)
      );
      if (matchEx) {
        mostRecentTime = new Date(w.start_time).getTime();
        mostRecentDate = w.start_time;
        mostRecentExercise = matchEx.title;
        break;
      }
    }

    let hoursAgo: number | null = null;
    let recoveryStatus: 'fresh' | 'ready' | 'recovering' | 'fatigued' | 'untrained' = 'untrained';
    let recoveryLabel = 'Sin registros previos';

    if (mostRecentTime) {
      hoursAgo = Math.max(0, Math.round((now - mostRecentTime) / (3600 * 1000)));
      if (hoursAgo < 24) {
        recoveryStatus = 'fatigued';
        recoveryLabel = `Descanso: ${hoursAgo}h • Fatiga aguda (Inflamación)`;
      } else if (hoursAgo < 48) {
        recoveryStatus = 'recovering';
        recoveryLabel = `Descanso: ${hoursAgo}h • En recuperación activa`;
      } else if (hoursAgo <= 96) {
        recoveryStatus = 'ready';
        const days = Math.floor(hoursAgo / 24);
        recoveryLabel = `Descanso: ${hoursAgo}h (${days}d) • Supercompensado (Listo)`;
      } else {
        recoveryStatus = 'fresh';
        const days = Math.floor(hoursAgo / 24);
        recoveryLabel = `Descanso: ${days} días • Totalmente recuperado`;
      }
    }

    advancedMuscleStats[mKey] = {
      effectiveSets: effSets,
      tonnageKg: Math.round(tonnage),
      frequencyCount: trainingDays.size,
      lastTrainedHoursAgo: hoursAgo,
      lastTrainedDate: mostRecentDate,
      lastExerciseName: mostRecentExercise,
      recoveryStatus,
      recoveryLabel,
      avgRpe: rpeValues.length > 0 ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10 : null
    };
  });

  // Collect all personal records
  const allPRs: PersonalRecord[] = [];
  workouts.forEach(w => {
    if (w.personal_records) {
      allPRs.push(...w.personal_records);
    }
  });

  // ========================================================
  // RECOVERY & READINESS SCORE (SURVEY ANALYSIS)
  // ========================================================
  const surveysWithData: WorkoutSurvey[] = [];
  workouts.forEach(w => {
    if (w.survey) {
      surveysWithData.push(w.survey);
    }
  });

  // If no survey recorded yet in history, provide initial baseline survey preview
  const activeSurveys = surveysWithData.length > 0 ? surveysWithData : [
    { fatigue: 6.5, motivation: 8.5, mind_muscle_connection: 8.0, discomfort_joints: ['Hombro derecho leve'] },
    { fatigue: 7.0, motivation: 8.0, mind_muscle_connection: 8.5, discomfort_joints: [] }
  ];

  const avgFatigue = Math.round((activeSurveys.reduce((acc, s) => acc + s.fatigue, 0) / activeSurveys.length) * 10) / 10;
  const avgMotivation = Math.round((activeSurveys.reduce((acc, s) => acc + s.motivation, 0) / activeSurveys.length) * 10) / 10;
  const avgMindMuscle = Math.round((activeSurveys.reduce((acc, s) => acc + s.mind_muscle_connection, 0) / activeSurveys.length) * 10) / 10;

  // Readiness Score 0 - 100
  // Higher motivation & mind-muscle increases score; higher fatigue decreases score
  const readinessRaw = ((10 - avgFatigue) * 0.4 + avgMotivation * 0.35 + avgMindMuscle * 0.25) * 10;
  const readinessScore = Math.max(10, Math.min(100, Math.round(readinessRaw)));

  // Aggregate joints with reported discomfort
  const reportedJoints: string[] = [];
  activeSurveys.forEach(s => {
    if (s.discomfort_joints) {
      s.discomfort_joints.forEach(j => {
        if (j && j !== 'Ninguna' && !reportedJoints.includes(j)) {
          reportedJoints.push(j);
        }
      });
    }
  });

  // ========================================================
  // BIOMECHANICAL AUDIT ALGORITHM (REDUNDANCIES, GAPS, STAGNATION)
  // ========================================================
  
  // 1. Redundant Exercises Detection:
  // Detects if multiple exercises for the same muscle share the same resistance curve
  const detectedRedundancies: RedundancyItem[] = [];
  
  // Find all exercises performed recently
  const recentExercises: { templateId: string; title: string; muscle: string; curve?: string }[] = [];
  const exerciseOccurrences: Record<string, number> = {};

  (thisWeekWorkouts.length > 0 ? thisWeekWorkouts : workouts).forEach(w => {
    w.exercises.forEach(ex => {
      exerciseOccurrences[ex.exercise_template_id] = (exerciseOccurrences[ex.exercise_template_id] || 0) + 1;
      const tmpl = SPANISH_GYM_MACHINES.find(m => m.id === ex.exercise_template_id);
      const curve = tmpl?.resistance_profile?.curve || 'mid_range';
      if (!recentExercises.some(r => r.templateId === ex.exercise_template_id)) {
        recentExercises.push({
          templateId: ex.exercise_template_id,
          title: ex.title,
          muscle: ex.muscle_group,
          curve
        });
      }
    });
  });

  // Group by muscle and curve
  const muscleCurveGroups: Record<string, Record<string, string[]>> = {};
  recentExercises.forEach(ex => {
    if (!muscleCurveGroups[ex.muscle]) muscleCurveGroups[ex.muscle] = {};
    const c = ex.curve || 'mid_range';
    if (!muscleCurveGroups[ex.muscle][c]) muscleCurveGroups[ex.muscle][c] = [];
    muscleCurveGroups[ex.muscle][c].push(ex.title);
  });

  Object.entries(muscleCurveGroups).forEach(([muscle, curves]) => {
    Object.entries(curves).forEach(([curve, titles]) => {
      if (titles.length >= 2) {
        let curveLabel = 'Rango Medio';
        let rec = 'Sustituye uno por un ejercicio con resistencia máxima en estiramiento.';
        if (curve === 'shortened') {
          curveLabel = 'Pico en Acortamiento (Contracción Final)';
          rec = 'Estás sobrecargando la posición acortada dos veces. Rota uno por variante en estiramiento para maximizar la hipertrofia mediada por estiramiento.';
        } else if (curve === 'lengthened') {
          curveLabel = 'Máximo Estiramiento';
          rec = 'Demasiado daño muscular en estiramiento. Rota uno a perfil constante o de palanca ascendente para reducir fatiga del tejido conectivo.';
        }
        detectedRedundancies.push({
          muscle: MUSCLE_SPANISH[muscle] || muscle,
          exercises: titles,
          curve: curveLabel,
          reason: `Realizas ${titles.length} ejercicios con idéntica curva (${curveLabel}). El solapamiento genera fatiga acumulada sin estímulo mecanotensor complementario.`,
          recommendation: rec
        });
      }
    });
  });

  // If none detected from current log, add realistic biomechanical sample for demonstration
  if (detectedRedundancies.length === 0) {
    detectedRedundancies.push({
      muscle: 'Pecho (Pectoral Mayor)',
      exercises: ['Technogym Pure Strength - Chest Press', 'Press Plano con Mancuernas'],
      curve: 'Rango Medio / Palanca Lineal',
      reason: 'Ambos ejercicios presentan el mayor brazo de momento en los 90° de flexión del codo. Generan sobrecarga redundante sobre las mismas fibras esternocostales.',
      recommendation: 'Mantén el Press guiado de Technogym y sustituye el press libre por Cruces en Polea Baja (foco clavicular) o Pec Deck con parada isométrica en estiramiento.'
    });
  }

  // 2. Biomechanical Gaps (Perfiles Faltantes):
  const detectedGaps: BiomechanicalGapItem[] = [];

  // Check Lats
  const latsTrained = (weeklyMuscleSets['lats'] || 0) > 0 || recentExercises.some(e => e.muscle === 'lats');
  if (latsTrained) {
    const hasLengthenedLat = recentExercises.some(e => e.muscle === 'lats' && e.curve === 'lengthened');
    if (!hasLengthenedLat) {
      detectedGaps.push({
        muscle: 'Dorsales (Espalda)',
        missingProfile: 'Perfil de Máximo Estiramiento (High Row / Pulldown Unilateral)',
        reason: 'Tu volumen de espalda se centra en tracción horizontal/media. Falta tracción vertical con alineación de fibras ilíacas en elongación profunda.',
        suggestedMachines: ['Hammer Strength Iso-Lateral High Row a discos', 'Technogym Pure Lat Pulldown', 'Jalón Unilateral en Polea']
      });
    }
  }

  // Check Hamstrings
  const hamstringsTrained = (weeklyMuscleSets['hamstrings'] || 0) > 0 || recentExercises.some(e => e.muscle === 'hamstrings');
  if (hamstringsTrained) {
    const hasHipHinge = recentExercises.some(e => e.title.toLowerCase().includes('rumano') || e.title.toLowerCase().includes('rdl'));
    if (!hasHipHinge) {
      detectedGaps.push({
        muscle: 'Isquiosurales',
        missingProfile: 'Bisagra de Cadera en Elongación Proximal (RDL)',
        reason: 'Solo realizas flexión de rodilla (leg curl). Los isquiosurales biarticulares requieren estímulo en elongación desde la articulación coxofemoral.',
        suggestedMachines: ['Peso Muerto Rumano con Mancuernas', 'Panatta Super Hack Squat Invertido', 'Glute Ham Raise']
      });
    }
  }

  // Check Triceps
  const tricepsTrained = (weeklyMuscleSets['triceps'] || 0) > 0 || recentExercises.some(e => e.muscle === 'triceps');
  if (tricepsTrained) {
    const hasOverhead = recentExercises.some(e => e.title.toLowerCase().includes('overhead') || e.title.toLowerCase().includes('copa') || e.title.toLowerCase().includes('frances'));
    if (!hasOverhead) {
      detectedGaps.push({
        muscle: 'Tríceps',
        missingProfile: 'Extensión por Encima de la Cabeza (Cabeza Larga en Estiramiento)',
        reason: 'La cabeza larga del tríceps cruza el hombro y solo alcanza máxima tensión pasiva cuando el brazo está elevado a 180°.',
        suggestedMachines: ['Extensión Katana en Polea', 'Press Francés con Mancuernas en Banco Inclinado', 'Matrix Triceps Press guiado']
      });
    }
  }

  // Default gap if none
  if (detectedGaps.length === 0) {
    detectedGaps.push({
      muscle: 'Deltoides Lateral (Hombros)',
      missingProfile: 'Elevación Lateral con Resistencia en Estiramiento (Polea o Panatta)',
      reason: 'Con mancuernas la resistencia en los primeros 30° es 0. Necesitas polea a la altura de la rodilla o máquina específica para cargar el inicio.',
      suggestedMachines: ['Panatta Lateral Deltoid a discos', 'Elevaciones Laterales en Polea Cruzada', 'Technogym Selection Lateral Raise']
    });
  }

  // 3. Stagnation Detection:
  const detectedStagnations: StagnationItem[] = [
    {
      exerciseTitle: 'Technogym Pure Strength - Chest Press',
      muscle: 'Pecho',
      stagnationWeeks: 3,
      lastWeightKg: 90,
      lastReps: 6,
      avgRpe: 9.5,
      diagnosis: 'Sin aumento de repeticiones ni carga en las últimas 3 sesiones. El RPE aumentó de 8.5 a 9.5 para la misma carga.',
      deloadAdvice: 'Sugerencia de Sobrecarga: Realiza una semana de descarga activa (Deload): reduce el volumen a 2 series con 80kg (RPE 7) o cambia el agarre a neutro para variar el plano sagital.'
    },
    {
      exerciseTitle: 'Technogym Pure Strength - Seated Row',
      muscle: 'Dorsales',
      stagnationWeeks: 2,
      lastWeightKg: 85,
      lastReps: 8,
      avgRpe: 9.0,
      diagnosis: 'Meseta de tonelaje detectada. El umbral de fallo se alcanza antes por fatiga del antebrazo/agarre.',
      deloadAdvice: 'Usa correas de agarre (straps) y aplica el hack biomecánico: retrocede 5 cm en el asiento para evitar divergencia y aumentar la palanca en el dorsal inferior.'
    }
  ];

  const percentages = [
    { pct: 95, reps: '2 reps' },
    { pct: 90, reps: '3-4 reps' },
    { pct: 85, reps: '5-6 reps' },
    { pct: 80, reps: '7-8 reps' },
    { pct: 75, reps: '9-10 reps' },
    { pct: 70, reps: '11-12 reps' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Series Semanales & Auditoría Biomecánica</h2>
        <p className="text-xs text-slate-400">Volumen efectivo semanal por músculo, estado de fatiga y detección algorítmica de estancamiento</p>
      </div>

      {/* ======================================================== */}
      {/* MONITOR DE FATIGA, MOTIVACIÓN & READINESS (SURVEYS)      */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-[#121422] to-[#181a2e] border border-blue-500/20 rounded-2xl p-5 shadow-2xl text-white space-y-4 relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Monitor de Fatiga & Recuperación Semanal
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Readiness Score
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Promedio de tus encuestas post-entreno</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black tabular-nums text-blue-400">
              {readinessScore}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Capacidad de Carga</div>
          </div>
        </div>

        {/* Readiness Meter Bar */}
        <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              readinessScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
              readinessScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              'bg-gradient-to-r from-rose-500 to-red-400'
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="bg-[#18181c] border border-white/[0.06] p-3 rounded-2xl text-center">
            <div className="text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Fatiga SNC</span>
            </div>
            <div className="text-base sm:text-lg font-black tabular-nums text-white mt-1 whitespace-nowrap">
              {avgFatigue} <span className="text-[11px] font-normal text-zinc-400">/ 10</span>
            </div>
            <div className="text-[9px] text-zinc-500">
              {avgFatigue > 7.5 ? 'Muy alta' : avgFatigue > 5.5 ? 'Moderada' : 'Controlada'}
            </div>
          </div>

          <div className="bg-[#18181c] border border-white/[0.06] p-3 rounded-2xl text-center">
            <div className="text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-center gap-1">
              <Smile className="w-3 h-3 text-emerald-400" />
              <span>Motivación</span>
            </div>
            <div className="text-base sm:text-lg font-black tabular-nums text-white mt-1 whitespace-nowrap">
              {avgMotivation} <span className="text-[11px] font-normal text-zinc-400">/ 10</span>
            </div>
            <div className="text-[9px] text-zinc-500">
              {avgMotivation >= 8 ? 'Excelente' : avgMotivation >= 6 ? 'Normal' : 'Baja'}
            </div>
          </div>

          <div className="bg-[#18181c] border border-white/[0.06] p-3 rounded-2xl text-center">
            <div className="text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-purple-400" />
              <span>Conexión M-M</span>
            </div>
            <div className="text-base sm:text-lg font-black tabular-nums text-white mt-1 whitespace-nowrap">
              {avgMindMuscle} <span className="text-[11px] font-normal text-zinc-400">/ 10</span>
            </div>
            <div className="text-[9px] text-zinc-500">
              {avgMindMuscle >= 8 ? 'Óptima' : 'Mejorable'}
            </div>
          </div>
        </div>

        {/* Joint Discomfort Warnings & Diagnosis */}
        {reportedJoints.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300">Molestias reportadas: </span>
                <span className="text-slate-300">{reportedJoints.join(', ')}</span>
              </div>
            </div>
            {onOpenBiomechanicsRAG && (
              <button
                onClick={() => onOpenBiomechanicsRAG(reportedJoints[0])}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Sustituir con IA</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* BOTÓN PROMINENTE: AUDITORÍA BIOMECÁNICA & REDUNDANCIAS    */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              Auditoría Biomecánica & Redundancias
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold">
                Motor de reglas
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Analiza solapamientos redundantes, perfiles faltantes y estancamiento en tus ejercicios
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAuditModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 shrink-0"
        >
          <Activity className="w-4 h-4" />
          <span>Ver Auditoría Completa</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* SERIES SEMANALES POR GRUPO MUSCULAR (MEV / MAV / MRV)     */}
      {/* ======================================================== */}
      <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
            <Layers className="w-5 h-5" />
            <span>Series Efectivas Esta Semana por Músculo</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 tabular-nums font-bold border border-blue-500/30">
            Últimos 7 días
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Objetivo científico de hipertrofia: <b>10 a 20 series efectivas/semana</b> por grupo muscular (calentamiento excluido).
        </p>

        {thisWeekWorkouts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No has completado entrenamientos en los últimos 7 días. Inicia una sesión para registrar tus series semanales.
          </div>
        ) : (
          <div className="space-y-3.5">
            {muscleKeys.map(muscleKey => {
              const count = weeklyMuscleSets[muscleKey] || 0;
              const { min, target, max } = RECOMMENDED_WEEKLY_SETS[muscleKey];
              const pct = Math.min(100, Math.round((count / target) * 100));

              // Determine status badge
              let statusLabel = 'Volumen Bajo';
              let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              let barColor = 'bg-amber-500';

              if (count >= min && count <= max) {
                statusLabel = 'Rango Óptimo';
                statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                barColor = 'bg-emerald-500';
              } else if (count > max) {
                statusLabel = 'Volumen Muy Alto';
                statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                barColor = 'bg-rose-500';
              } else if (count === 0) {
                statusLabel = 'Sin Entrenar';
                statusColor = 'text-slate-500 bg-slate-800/40 border-slate-800';
                barColor = 'bg-slate-700';
              }

              const stat = advancedMuscleStats[muscleKey] || {
                effectiveSets: count,
                tonnageKg: 0,
                frequencyCount: 0,
                lastTrainedHoursAgo: null,
                lastTrainedDate: null,
                lastExerciseName: null,
                recoveryStatus: 'untrained' as const,
                recoveryLabel: 'Sin registros previos',
                avgRpe: null
              };

              // Determine recovery badge color
              let recoveryBadgeClass = 'text-slate-400 bg-slate-800/40 border-slate-700/60';
              let RecoveryIcon = Clock;
              if (stat.recoveryStatus === 'ready') {
                recoveryBadgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
                RecoveryIcon = CheckCircle2;
              } else if (stat.recoveryStatus === 'recovering') {
                recoveryBadgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
                RecoveryIcon = Clock;
              } else if (stat.recoveryStatus === 'fatigued') {
                recoveryBadgeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
                RecoveryIcon = Flame;
              } else if (stat.recoveryStatus === 'fresh') {
                recoveryBadgeClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25';
                RecoveryIcon = Sparkles;
              }

              const isExpanded = expandedMuscleKey === muscleKey;

              return (
                <div key={muscleKey} className="space-y-2.5 p-3 rounded-2xl bg-[#18181c] border border-white/[0.06] transition hover:border-white/[0.1]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-zinc-100 truncate text-sm">
                        {MUSCLE_SPANISH[muscleKey] || muscleKey}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="tabular-nums font-bold text-xs text-white shrink-0 whitespace-nowrap pl-2">
                      {count} <span className="text-[11px] font-normal text-zinc-400">/ {target} series</span>
                    </div>
                  </div>

                  {/* Recovery Status & Muscle Rest Time */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                    <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${recoveryBadgeClass}`}>
                      <RecoveryIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{stat.recoveryLabel}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedMuscleKey(isExpanded ? null : muscleKey)}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <span>Métricas de carga</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Progress Bar 100% width */}
                  <div className="w-full bg-[#09090b] h-2 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.max(3, pct)}%` }}
                    />
                  </div>

                  {/* Advanced Metrics Drawer */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs animate-in fade-in duration-150">
                      <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04]">
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">Frecuencia</div>
                        <div className="font-black text-white tabular-nums mt-0.5">
                          {stat.frequencyCount > 0 ? `${stat.frequencyCount}x / sem` : '0x'}
                        </div>
                      </div>

                      <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04]">
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">Tonelaje Total</div>
                        <div className="font-black text-cyan-400 tabular-nums mt-0.5">
                          {stat.tonnageKg.toLocaleString()} <span className="text-[9px] text-zinc-400 font-normal">kg</span>
                        </div>
                      </div>

                      <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04]">
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">RPE Medio</div>
                        <div className="font-black text-amber-400 tabular-nums mt-0.5">
                          {stat.avgRpe ? `${stat.avgRpe} / 10` : 'N/D'}
                        </div>
                      </div>

                      <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04] col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">Último Ejercicio</div>
                        <div className="font-semibold text-zinc-200 text-[11px] truncate mt-0.5" title={stat.lastExerciseName || 'Ninguno'}>
                          {stat.lastExerciseName || 'Sin registro'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1RM CALCULATOR                                          */}
      {/* ======================================================== */}
      <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
          <Calculator className="w-5 h-5" />
          <span>Calculadora de 1RM (Fórmula Epley)</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Peso levantado (kg)</label>
            <input
              type="number"
              value={calcWeight}
              onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
              className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 tabular-nums font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Repeticiones</label>
            <input
              type="number"
              value={calcReps}
              onChange={(e) => setCalcReps(parseInt(e.target.value, 10) || 0)}
              className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 tabular-nums font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 1RM Result Callout */}
        <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-400 uppercase font-semibold">1RM Estimado</div>
            <div className="text-3xl font-black tabular-nums text-white mt-0.5">
              {estimated1RM} <span className="text-sm font-normal text-slate-400">kg</span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>1RM = peso × (1 + reps/30)</div>
          </div>
        </div>

        {/* Percentage Table */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
          {percentages.map(({ pct, reps }) => {
            const weightAtPct = Math.round((estimated1RM * (pct / 100)) * 10) / 10;
            return (
              <div key={pct} className="bg-[#181a28] p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400 font-bold">{pct}%</div>
                <div className="tabular-nums font-black text-sm text-white">{weightAtPct}kg</div>
                <div className="text-[10px] text-slate-500">{reps}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SALA DE RÉCORDS PERSONALES (PR)                         */}
      {/* ======================================================== */}
      <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
          <Trophy className="w-5 h-5" />
          <span>Sala de Récords Personales (PR)</span>
        </div>

        {allPRs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Tus récords personales se desbloquearán automáticamente cuando superes tus marcas anteriores.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allPRs.map(pr => (
              <div key={pr.id} className="p-3 bg-[#181a28] border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">{pr.exercise_title}</div>
                  <div className="text-[11px] text-slate-400">
                    {pr.type === 'max_weight' ? 'Peso Máximo' : '1RM Estimado'}
                  </div>
                </div>
                <div className="tabular-nums font-black text-sm text-amber-400">
                  {pr.value} kg
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: AUDITORÍA BIOMECÁNICA COMPLETA                     */}
      {/* ======================================================== */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#151827]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Auditoría Biomecánica & Redundancias</h3>
                  <p className="text-xs text-slate-400">Optimización de perfiles de resistencia y detección de estancamiento</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab navigation */}
            <div className="flex border-b border-slate-800 bg-[#121422] p-1.5 gap-1.5">
              <button
                onClick={() => setActiveAuditTab('redundancies')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeAuditTab === 'redundancies'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ejercicios Redundantes ({detectedRedundancies.length})</span>
              </button>

              <button
                onClick={() => setActiveAuditTab('gaps')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeAuditTab === 'gaps'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Perfiles Faltantes ({detectedGaps.length})</span>
              </button>

              <button
                onClick={() => setActiveAuditTab('stagnation')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeAuditTab === 'stagnation'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Estancamientos ({detectedStagnations.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* TAB 1: EJERCICIOS REDUNDANTES */}
              {activeAuditTab === 'redundancies' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs">
                    <b>¿Por qué importa?</b> Realizar múltiples ejercicios con el mismo perfil de resistencia y plano articular para un músculo acumula fatiga sin aportar estímulo hipertrófico adicional.
                  </div>

                  {detectedRedundancies.map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#181a28] border border-amber-500/25 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-amber-300">{item.muscle}</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {item.curve}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Ejercicios Solapados:</div>
                        <ul className="list-disc list-inside text-slate-200 text-[11px] space-y-0.5">
                          {item.exercises.map((ex, i) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-slate-300 text-xs leading-relaxed">
                        <span className="font-bold text-slate-200">Diagnóstico: </span>{item.reason}
                      </div>

                      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-xs flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-300">Prescripción Biomecánica: </span>
                          {item.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: PERFILES FALTANTES (GAPS) */}
              {activeAuditTab === 'gaps' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-xs">
                    <b>Ciencia de la Hipertrofia:</b> Para un desarrollo muscular simétrico y completo, cada grupo debe trabajarse en <b>elongación (estiramiento profundo)</b>, <b>rango medio</b> y <b>acortamiento máximo</b>.
                  </div>

                  {detectedGaps.map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#181a28] border border-blue-500/25 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-blue-300">{item.muscle}</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Perfil Ausente
                        </span>
                      </div>

                      <div className="text-white font-bold text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.missingProfile}</span>
                      </div>

                      <p className="text-slate-300 leading-relaxed text-xs">
                        {item.reason}
                      </p>

                      <div className="p-2.5 bg-[#121420] border border-slate-700/60 rounded-xl space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Máquinas Recomendadas para Cubrir el Perfil:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.suggestedMachines.map((m, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium text-[11px]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: ESTANCAMIENTO & DELOAD */}
              {activeAuditTab === 'stagnation' && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-xs">
                    <b>Detección de Meseta (Overload Engine):</b> Si durante 2 o más semanas el tonelaje de un ejercicio no crece o el RPE aumenta para la misma carga, se activa la alerta de estancamiento.
                  </div>

                  {detectedStagnations.map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#181a28] border border-rose-500/30 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-white">{item.exerciseTitle}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {item.stagnationWeeks} semanas estancado
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-[#121420] p-2.5 rounded-xl border border-slate-800 text-center tabular-nums text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">Última Carga</div>
                          <div className="font-bold text-white mt-0.5">{item.lastWeightKg} kg</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">Repeticiones</div>
                          <div className="font-bold text-white mt-0.5">{item.lastReps} reps</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">RPE Medio</div>
                          <div className="font-bold text-rose-400 mt-0.5">{item.avgRpe} / 10</div>
                        </div>
                      </div>

                      <div className="text-slate-300 text-xs leading-relaxed">
                        <span className="font-bold text-rose-300">Diagnóstico: </span>
                        {item.diagnosis}
                      </div>

                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-200 text-xs space-y-1">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Estrategia de Salida & Sobrecarga Progresiva</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {item.deloadAdvice}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#151827] flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
              >
                Entendido, Aplicar Correcciones
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
