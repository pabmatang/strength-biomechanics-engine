import React, { useState } from 'react';
import { 
  X, Sparkles, Dumbbell, Clock, Calendar, Check, ArrowRight, ArrowLeft, 
  Sliders, ShieldCheck, Layers, Play, RefreshCw, Star, Info, ThumbsDown,
  Activity, Award, Split
} from 'lucide-react';
import { Routine, WorkoutExercise, ExerciseTemplate, MuscleGroup } from '../types/workout';
import { EXERCISE_DATABASE } from '../data/exercises';
import { formatMuscleName } from '../utils/muscleLabels';

interface SmartRoutineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: Routine) => void;
  onSaveAllRoutines?: (routines: Routine[]) => void;
}

type SplitDays = 2 | 3 | 4 | 5 | 6;
type SessionDuration = 45 | 60 | 75 | 90;
type EquipmentPref = 'technogym' | 'hammer' | 'cables_selectorized' | 'free_weights' | 'hybrid';
type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';
type RoutineSplitType = 'ppl' | 'torso_pierna' | 'fullbody' | 'auto';

export const SmartRoutineWizardModal: React.FC<SmartRoutineWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  onSaveAllRoutines
}) => {
  const [step, setStep] = useState<number>(1);

  // Wizard answers
  const [daysPerWeek, setDaysPerWeek] = useState<SplitDays>(3);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermedio');
  const [routineSplitType, setRoutineSplitType] = useState<RoutineSplitType>('ppl');
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>(['lats', 'chest']);
  const [backSpecialization, setBackSpecialization] = useState<boolean>(true);
  const [dislikedMuscles, setDislikedMuscles] = useState<string[]>([]);
  const [interleavedArmMuscle, setInterleavedArmMuscle] = useState<'biceps' | 'triceps' | 'both'>('biceps');
  const [complementaryMuscle, setComplementaryMuscle] = useState<string>('abdominals');
  const [durationMinutes, setDurationMinutes] = useState<SessionDuration>(60);
  const [equipmentPref, setEquipmentPref] = useState<EquipmentPref>('technogym');

  // Generated routines result
  const [generatedRoutines, setGeneratedRoutines] = useState<Routine[] | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Toggle muscle priority
  const togglePriorityMuscle = (muscle: string) => {
    setPriorityMuscles(prev => {
      if (prev.includes(muscle)) {
        return prev.filter(m => m !== muscle);
      } else {
        if (prev.length >= 3) {
          return [...prev.slice(1), muscle];
        }
        return [...prev, muscle];
      }
    });
  };

  // Toggle disliked muscle
  const toggleDislikedMuscle = (muscle: string) => {
    setDislikedMuscles(prev => {
      if (prev.includes(muscle)) {
        return prev.filter(m => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  // Helper to pick exercise matching muscle and equipment preference
  const pickBestExercise = (
    muscle: string,
    pref: EquipmentPref,
    usedIds: Set<string>,
    variantBias?: 'lats' | 'upper_back' | 'trapezius'
  ): ExerciseTemplate => {
    let candidates = EXERCISE_DATABASE.filter(
      t => (t.muscle_group === muscle || (t.other_muscles && (t.other_muscles as string[]).includes(muscle))) && !usedIds.has(t.id)
    );

    // Apply sub-specialization bias if requested
    if (variantBias && candidates.length > 1) {
      const biased = candidates.filter(t => {
        const title = t.title.toLowerCase();
        if (variantBias === 'lats') {
          return title.includes('jalón') || title.includes('dorsal') || title.includes('lat') || title.includes('pulldown');
        } else if (variantBias === 'upper_back') {
          return title.includes('remo') || title.includes('row') || title.includes('pájaros') || title.includes('facepull');
        } else if (variantBias === 'trapezius') {
          return title.includes('encogimiento') || title.includes('shrug') || title.includes('trapecio');
        }
        return true;
      });
      if (biased.length > 0) {
        candidates = biased;
      }
    }

    if (candidates.length === 0) {
      const fallback = EXERCISE_DATABASE.find(t => t.muscle_group === (muscle as MuscleGroup)) || EXERCISE_DATABASE[0];
      return fallback;
    }

    if (pref === 'technogym') {
      const tg = candidates.find(t => t.brand?.toLowerCase().includes('technogym'));
      if (tg) return tg;
    } else if (pref === 'hammer') {
      const hammer = candidates.find(t => t.brand?.toLowerCase().includes('hammer'));
      if (hammer) return hammer;
    } else if (pref === 'cables_selectorized') {
      const cable = candidates.find(
        t => t.equipment_category === 'cable' || t.equipment_category === 'machine'
      );
      if (cable) return cable;
    } else if (pref === 'free_weights') {
      const free = candidates.find(
        t => t.equipment_category === 'dumbbell' || t.equipment_category === 'barbell'
      );
      if (free) return free;
    }

    return candidates[0];
  };

  // Main Generator Function with Strict Session Time Normalization
  const generateRoutines = () => {
    const routines: Routine[] = [];

    // Exact normalization: each duration has an exact fixed number of exercises across ALL days
    const exactExercisesCount = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;
    const setsPerPriority = experienceLevel === 'principiante' ? 3 : experienceLevel === 'intermedio' ? 4 : 4;
    const setsPerStandard = experienceLevel === 'principiante' ? 2 : experienceLevel === 'intermedio' ? 3 : 3;

    interface DayTemplate {
      name: string;
      focusCategory: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody';
      musclesQueue: Array<{ muscle: string; bias?: 'lats' | 'upper_back' | 'trapezius'; note?: string }>;
    }

    let dayTemplates: DayTemplate[] = [];

    const effectiveSplit = routineSplitType === 'auto'
      ? (daysPerWeek === 2 ? 'fullbody' : daysPerWeek === 4 ? 'torso_pierna' : 'ppl')
      : routineSplitType;

    if (effectiveSplit === 'ppl') {
      if (daysPerWeek === 3) {
        dayTemplates = [
          {
            name: 'Día 1: Push (Empuje Pectoral & Deltoides)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral principal' },
              { muscle: 'chest', note: 'Pectoral secundario' },
              { muscle: 'shoulders', note: 'Deltoides anterior/lateral' },
              { muscle: 'triceps', note: 'Tríceps' },
              { muscle: complementaryMuscle, note: 'Complementario final' },
              { muscle: 'shoulders' }
            ]
          },
          {
            name: 'Día 2: Pull (Tracción & Espalda Especializada)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal ancho (Jalón/Remo al ilíaco)' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal amplitud' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda alta y deltoides posterior' },
              { muscle: interleavedArmMuscle === 'triceps' ? 'triceps' : 'biceps', note: 'Brazos intercalados' },
              { muscle: complementaryMuscle, note: 'Complementario final' },
              { muscle: 'upper_back' }
            ]
          },
          {
            name: 'Día 3: Legs (Pierna Completa & Cadena Posterior)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Cuádriceps empuje' },
              { muscle: 'hamstrings', note: 'Femoral flexión' },
              { muscle: 'quadriceps', note: 'Cuádriceps aislamiento' },
              { muscle: 'glutes', note: 'Glúteos' },
              { muscle: 'calves', note: 'Gemelos' },
              { muscle: complementaryMuscle }
            ]
          }
        ];
      } else if (daysPerWeek === 4 || daysPerWeek === 5 || daysPerWeek === 6) {
        // Multi-frequency with alternated back specialization
        dayTemplates = [
          {
            name: 'Día 1: Pull A (Foco Dorsal Ancho Frecuencia 2)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal 1: Jalón o remo guiado al ilíaco' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal 2: Remo unilateral de tracción' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda alta / trapecio' },
              { muscle: interleavedArmMuscle === 'triceps' ? 'triceps' : 'biceps', note: 'Brazo intercalado' },
              { muscle: complementaryMuscle, note: 'Complementario final' },
              { muscle: 'upper_back' }
            ]
          },
          {
            name: 'Día 2: Push A (Empuje Pectoral & Tríceps)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Press convergente o plano' },
              { muscle: 'chest', note: 'Press inclinado' },
              { muscle: 'shoulders', note: 'Elevaciones laterales' },
              { muscle: 'triceps', note: 'Extensión de tríceps' },
              { muscle: complementaryMuscle },
              { muscle: 'shoulders' }
            ]
          },
          {
            name: 'Día 3: Legs (Tren Inferior & Sentadilla)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Hack squat / Prensa' },
              { muscle: 'hamstrings', note: 'Curl femoral sentado' },
              { muscle: 'glutes', note: 'Hip thrust / Zancadas' },
              { muscle: 'calves', note: 'Gemelo en máquina' },
              { muscle: complementaryMuscle },
              { muscle: 'quadriceps' }
            ]
          },
          {
            name: 'Día 4: Pull B (Foco Espalda Alta & Trapecios Frecuencia 2)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda alta 1: Remo con codos a 45-60°' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Espalda alta 2: Encogimientos o remo en T' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal mantenimiento: Pullover o jalón neutro' },
              { muscle: interleavedArmMuscle === 'triceps' ? 'triceps' : 'biceps', note: 'Brazo intercalado' },
              { muscle: complementaryMuscle, note: 'Complementario final' },
              { muscle: 'lats' }
            ]
          }
        ];

        if (daysPerWeek >= 5) {
          dayTemplates.push({
            name: 'Día 5: Push B (Deltoides & Énfasis Pectoral Superior)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'shoulders', note: 'Press militar o hombro máquina' },
              { muscle: 'chest', note: 'Aperturas o cruces de poleas' },
              { muscle: 'shoulders', note: 'Elevaciones laterales en polea' },
              { muscle: 'triceps', note: 'Tríceps tras nuca' },
              { muscle: complementaryMuscle }
            ]
          });
        }
        if (daysPerWeek === 6) {
          dayTemplates.push({
            name: 'Día 6: Legs B (Cadena Posterior & Isquios)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'hamstrings', note: 'Peso muerto rumano / Femoral tumbado' },
              { muscle: 'quadriceps', note: 'Prensa inclinada' },
              { muscle: 'glutes', note: 'Patada de glúteo en polea' },
              { muscle: 'calves', note: 'Elevación de talones sóleo' },
              { muscle: complementaryMuscle }
            ]
          });
        }
      }
    } else if (effectiveSplit === 'torso_pierna') {
      dayTemplates = [
        {
          name: 'Día 1: Torso A (Foco Tracción & Dorsal Ancho)',
          focusCategory: 'upper',
          musclesQueue: [
            { muscle: 'lats', bias: 'lats', note: 'Dorsal ancho principal' },
            { muscle: 'chest', note: 'Pectoral plano/inclinado' },
            { muscle: 'upper_back', bias: 'upper_back', note: 'Remo codos abiertos' },
            { muscle: 'shoulders', note: 'Deltoides lateral' },
            { muscle: 'biceps', note: 'Bíceps en banco Scott' },
            { muscle: complementaryMuscle }
          ]
        },
        {
          name: 'Día 2: Pierna A (Cuádriceps & Gemelos)',
          focusCategory: 'lower',
          musclesQueue: [
            { muscle: 'quadriceps', note: 'Prensa o sentadilla guiada' },
            { muscle: 'hamstrings', note: 'Curl femoral sentado' },
            { muscle: 'quadriceps', note: 'Extensiones de cuádriceps' },
            { muscle: 'glutes', note: 'Hip thrust' },
            { muscle: 'calves', note: 'Gemelo de pie' },
            { muscle: complementaryMuscle }
          ]
        },
        {
          name: 'Día 3: Torso B (Foco Pectoral & Espalda Alta)',
          focusCategory: 'upper',
          musclesQueue: [
            { muscle: 'chest', note: 'Press convergente de pecho' },
            { muscle: 'upper_back', bias: 'trapezius', note: 'Remo en T o trapecio' },
            { muscle: 'lats', bias: 'lats', note: 'Jalón en polea' },
            { muscle: 'shoulders', note: 'Press militar' },
            { muscle: 'triceps', note: 'Extensión de tríceps en polea' },
            { muscle: complementaryMuscle }
          ]
        },
        {
          name: 'Día 4: Pierna B (Isquiosurales & Glúteos)',
          focusCategory: 'lower',
          musclesQueue: [
            { muscle: 'hamstrings', note: 'Peso muerto rumano' },
            { muscle: 'quadriceps', note: 'Hack squat' },
            { muscle: 'glutes', note: 'Abductores en máquina' },
            { muscle: 'hamstrings', note: 'Curl femoral tumbado' },
            { muscle: 'calves', note: 'Gemelo en prensa' },
            { muscle: complementaryMuscle }
          ]
        }
      ];
    } else {
      // Full body
      dayTemplates = [
        {
          name: 'Día 1: Full Body A (Dorsal & Pectoral Pesado)',
          focusCategory: 'fullbody',
          musclesQueue: [
            { muscle: 'lats', bias: 'lats', note: 'Dorsal ancho' },
            { muscle: 'chest', note: 'Pectoral medio' },
            { muscle: 'quadriceps', note: 'Cuádriceps' },
            { muscle: 'shoulders', note: 'Deltoides' },
            { muscle: 'biceps', note: 'Bíceps' },
            { muscle: complementaryMuscle }
          ]
        },
        {
          name: 'Día 2: Full Body B (Espalda Alta & Cadena Posterior)',
          focusCategory: 'fullbody',
          musclesQueue: [
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda alta y romboides' },
            { muscle: 'hamstrings', note: 'Femoral' },
            { muscle: 'chest', note: 'Pectoral inclinado' },
            { muscle: 'triceps', note: 'Tríceps' },
            { muscle: 'glutes', note: 'Glúteos' },
            { muscle: complementaryMuscle }
          ]
        }
      ];
    }

    // Build each routine and ensure identical exercise count
    dayTemplates.forEach((day, dayIdx) => {
      const usedIds = new Set<string>();

      // Filter out muscles that the user dislikes
      const filteredQueue = day.musclesQueue.filter(
        item => !dislikedMuscles.includes(item.muscle)
      );

      // Reorder so that priority muscles appear FIRST
      const sortedQueue = [...filteredQueue].sort((a, b) => {
        const aPri = priorityMuscles.includes(a.muscle);
        const bPri = priorityMuscles.includes(b.muscle);
        if (aPri && !bPri) return -1;
        if (!aPri && bPri) return 1;
        return 0;
      });

      // Strict Normalization: Take exactly exactExercisesCount
      const chosenQueue = sortedQueue.slice(0, exactExercisesCount);

      // If there are fewer than exactExercisesCount (e.g. user filtered out many disliked muscles),
      // backfill with safe compound exercises
      while (chosenQueue.length < exactExercisesCount) {
        chosenQueue.push({
          muscle: priorityMuscles[0] || 'chest',
          note: 'Ranura de compensación de volumen'
        });
      }

      const exercises: WorkoutExercise[] = chosenQueue.map((item, exIdx) => {
        const template = pickBestExercise(item.muscle, equipmentPref, usedIds, item.bias);
        usedIds.add(template.id);

        const isPriority = priorityMuscles.includes(item.muscle);
        const setCount = isPriority ? setsPerPriority : setsPerStandard;

        const sets = Array.from({ length: setCount }, (_, sIdx) => ({
          id: `sw_${Date.now()}_${dayIdx}_${exIdx}_${sIdx}`,
          index: sIdx + 1,
          type: 'normal' as any,
          weight_kg: 20,
          reps: isPriority ? 8 : 10,
          rpe: isPriority ? 8.5 : 8.0,
          is_completed: false
        }));

        return {
          id: `ex_${Date.now()}_${dayIdx}_${exIdx}`,
          exercise_template_id: template.id,
          title: template.title,
          brand: template.brand,
          muscle_group: template.muscle_group,
          equipment_category: template.equipment_category,
          image_url: template.image_url,
          target_rep_range: isPriority ? '6-8' : '8-12',
          notes: item.note
            ? `★ ${item.note} · Tempo controlado 3-0-1. RPE ${isPriority ? 8.5 : 8.0}.`
            : `Descanso de 90-120s entre series. Técnica estricta.`,
          sets
        };
      });

      routines.push({
        id: `smart_routine_${Date.now()}_${dayIdx}`,
        title: day.name,
        folder_name: `Plan ${effectiveSplit.toUpperCase()} (${durationMinutes} min/día)`,
        description: `Sesión normalizada de ${exercises.length} ejercicios (${exercises.reduce((acc, e) => acc + e.sets.length, 0)} series). Prioridad: ${priorityMuscles.map(m => formatMuscleName(m)).join(', ')}.`,
        exercises,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    setGeneratedRoutines(routines);
    setSelectedDayIndex(0);
    setStep(7); // Jump to preview
  };

  const handleSaveSelected = () => {
    if (!generatedRoutines || !generatedRoutines[selectedDayIndex]) return;
    onSaveRoutine(generatedRoutines[selectedDayIndex]);
    onClose();
  };

  const handleSaveAll = () => {
    if (!generatedRoutines) return;
    if (onSaveAllRoutines) {
      onSaveAllRoutines(generatedRoutines);
    } else {
      generatedRoutines.forEach(r => onSaveRoutine(r));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Generador Inteligente de Rutinas</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Paso {step} de 7
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Algoritmo determinista con normalización estricta de tiempo y periodización
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* STEP 1: Días por semana */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>¿Cuántos días a la semana vas a entrenar?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Selecciona la frecuencia semanal disponible.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { days: 2, label: '2 días / semana', sub: 'Full Body A/B optimizado' },
                  { days: 3, label: '3 días / semana', sub: 'Push / Pull / Legs o Torso/Pierna' },
                  { days: 4, label: '4 días / semana', sub: 'Torso / Pierna A/B (Alta Frecuencia)' },
                  { days: 5, label: '5 días / semana', sub: 'PPL + Especialización de puntos débiles' },
                  { days: 6, label: '6 días / semana', sub: 'Push / Pull / Legs x2 avanzado' }
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDaysPerWeek(opt.days as SplitDays)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      daysPerWeek === opt.days
                        ? 'border-blue-500 bg-blue-600/15 ring-1 ring-blue-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</div>
                    </div>
                    {daysPerWeek === opt.days && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Nivel & Esquema Preferido */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Nivel de experiencia y esquema de entrenamiento</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Modularemos el volumen por serie (RPE, número de series y tempo).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'principiante', label: 'Principiante', desc: '2-3 series · RPE 7-8' },
                  { key: 'intermedio', label: 'Intermedio', desc: '3-4 series · RPE 8-8.5' },
                  { key: 'avanzado', label: 'Avanzado', desc: '4 series · RPE 8.5-9' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setExperienceLevel(item.key as ExperienceLevel)}
                    className={`p-3 rounded-2xl border text-center transition ${
                      experienceLevel === item.key
                        ? 'border-emerald-500 bg-emerald-600/15 ring-1 ring-emerald-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-blue-400" />
                  División preferida:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'ppl', name: 'Empuje / Tirón / Pierna (PPL)' },
                    { key: 'torso_pierna', name: 'Torso / Pierna' },
                    { key: 'fullbody', name: 'Full Body' },
                    { key: 'auto', name: 'Automático / Algorítmico' }
                  ].map(split => (
                    <button
                      key={split.key}
                      type="button"
                      onClick={() => setRoutineSplitType(split.key as RoutineSplitType)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                        routineSplitType === split.key
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      {split.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Músculos Prioritarios y Especialización de Espalda */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Músculos prioritarios (Frecuencia 2 a 3)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Irán en el <b>primer orden de cada sesión</b> y con volumen maximizado.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'lats', label: 'Dorsal Ancho (Espalda)' },
                  { key: 'upper_back', label: 'Espalda Alta / Trapecios' },
                  { key: 'chest', label: 'Pectoral (Pecho)' },
                  { key: 'shoulders', label: 'Deltoides (Hombros)' },
                  { key: 'quadriceps', label: 'Cuádriceps' },
                  { key: 'hamstrings', label: 'Isquiosurales' },
                  { key: 'glutes', label: 'Glúteos' },
                  { key: 'biceps', label: 'Bíceps' },
                  { key: 'triceps', label: 'Tríceps' }
                ].map(m => {
                  const isSel = priorityMuscles.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => togglePriorityMuscle(m.key)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                        isSel
                          ? 'border-amber-500 bg-amber-500/20 text-white font-bold'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Special back alternation toggle */}
              {(priorityMuscles.includes('lats') || priorityMuscles.includes('upper_back')) && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Especialización conmutada de Espalda (Dorsal vs Trapecios)
                    </span>
                    <input
                      type="checkbox"
                      checked={backSpecialization}
                      onChange={e => setBackSpecialization(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Día 1: 2 ejercicios de dorsal ancho + 1 de trapecio. Día 2: 2 de trapecio/espalda alta + 1 de dorsal. Intercalados con brazos.
                  </p>
                </div>
              )}

              {/* Interleaved arms choice */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  ¿Con qué músculo intercalar las series de espalda/torso?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'biceps', name: 'Bíceps' },
                    { key: 'triceps', name: 'Tríceps' },
                    { key: 'both', name: 'Ambos (Brazos)' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setInterleavedArmMuscle(item.key as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                        interleavedArmMuscle === item.key
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Músculos que NO gustan / menos prioritarios */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-rose-400" />
                  <span>¿Qué músculos NO te gusta entrenar o tienen baja prioridad?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Los excluiremos o reduciremos al volumen mínimo de mantenimiento (MEV).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'calves', label: 'Gemelos' },
                  { key: 'abdominals', label: 'Abdomen / Core' },
                  { key: 'forearms', label: 'Antebrazos' },
                  { key: 'trapezius_shrug', label: 'Trapecios' },
                  { key: 'glutes', label: 'Glúteos' },
                  { key: 'hamstrings', label: 'Isquiosurales' }
                ].map(m => {
                  const isDisliked = dislikedMuscles.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleDislikedMuscle(m.key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                        isDisliked
                          ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isDisliked && <X className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Complementary finishing muscle */}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-300">
                  Músculo complementario final de sesión:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'abdominals', label: 'Abdominales' },
                    { key: 'calves', label: 'Gemelos' },
                    { key: 'forearms', label: 'Antebrazo' }
                  ].map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setComplementaryMuscle(c.key)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                        complementaryMuscle === c.key
                          ? 'border-cyan-500 bg-cyan-600/20 text-white'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Tiempo de Sesión (Con normalización estricta) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Tiempo exacto por sesión (Normalización Estricta)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Todos los días tendrán <b>exactamente la misma cantidad de ejercicios y series</b>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { mins: 45, label: '45 minutos', sub: 'Exactamente 4 ejercicios · 12-14 series' },
                  { mins: 60, label: '60 minutos', sub: 'Exactamente 5 ejercicios · 18-20 series' },
                  { mins: 75, label: '75 minutos', sub: 'Exactamente 6 ejercicios · 24 series' },
                  { mins: 90, label: '90 minutos', sub: 'Exactamente 7 ejercicios · 28 series' }
                ].map(opt => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setDurationMinutes(opt.mins as SessionDuration)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      durationMinutes === opt.mins
                        ? 'border-cyan-500 bg-cyan-600/20 ring-1 ring-cyan-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</div>
                    </div>
                    {durationMinutes === opt.mins && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Maquinaria */}
          {step === 6 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Preferencia de maquinaria</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Selecciona la línea con la que prefieres entrenar.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'technogym', name: 'Technogym Pure Strength', desc: 'Palancas de discos independientes con perfiles convergentes' },
                  { key: 'hammer', name: 'Hammer Strength Iso-Lateral', desc: 'Máquinas olímpicas divergentes' },
                  { key: 'cables_selectorized', name: 'Poleas & Torres guiadas', desc: 'Tensión constante durante todo el rango articular' },
                  { key: 'hybrid', name: 'Híbrido Inteligente', desc: 'Combina máquinas de discos con peso libre' },
                  { key: 'free_weights', name: 'Peso Libre', desc: 'Barras y mancuernas' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setEquipmentPref(item.key as EquipmentPref)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      equipmentPref === item.key
                        ? 'border-purple-500 bg-purple-600/20 text-white'
                        : 'border-slate-800 bg-[#181a28] text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    {equipmentPref === item.key && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Previsualización de Rutinas */}
          {step === 7 && generatedRoutines && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Rutina Generada con Éxito
                  </h4>
                  <p className="text-xs text-slate-400">
                    {generatedRoutines.length} sesiones generadas de {durationMinutes} min cada una
                  </p>
                </div>

                <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {generatedRoutines.map((r, idx) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        selectedDayIndex === idx
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Día {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Details */}
              {generatedRoutines[selectedDayIndex] && (
                <div className="space-y-2 bg-[#181a28] p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="font-bold text-xs text-blue-300">
                      {generatedRoutines[selectedDayIndex].title}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {generatedRoutines[selectedDayIndex].exercises.length} ejercicios
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {generatedRoutines[selectedDayIndex].exercises.map((ex, i) => (
                      <div
                        key={ex.id}
                        className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200">
                            {i + 1}. {ex.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ex.sets.length} series × {ex.target_rep_range} reps · {ex.notes}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {ex.muscle_group}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          {step > 1 && step < 7 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Atrás
            </button>
          )}

          {step < 6 && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="ml-auto py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
            >
              Siguiente
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 6 && (
            <button
              onClick={generateRoutines}
              className="ml-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              Generar Rutina Personalizada
            </button>
          )}

          {step === 7 && (
            <div className="flex gap-2 w-full justify-end">
              <button
                onClick={() => setStep(1)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Modificar Respuestas
              </button>
              <button
                onClick={handleSaveSelected}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Guardar Día {selectedDayIndex + 1}
              </button>
              <button
                onClick={handleSaveAll}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar Plan Completo
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
