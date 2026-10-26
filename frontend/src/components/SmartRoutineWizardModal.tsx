import React, { useState } from 'react';
import { 
  X, Sparkles, Dumbbell, Clock, Calendar, Check, ArrowRight, ArrowLeft, 
  Sliders, ShieldCheck, Layers, Play, RefreshCw, Star, Info
} from 'lucide-react';
import { Routine, WorkoutExercise, ExerciseTemplate, MuscleGroup } from '../types/workout';
import { EXERCISE_DATABASE } from '../data/exercises';
import { formatMuscleName } from '../utils/muscleLabels';
import { getSafeMachineImageUrl } from '../utils/machineImages';

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

export const SmartRoutineWizardModal: React.FC<SmartRoutineWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  onSaveAllRoutines
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Wizard answers
  const [daysPerWeek, setDaysPerWeek] = useState<SplitDays>(3);
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>(['chest', 'lats']);
  const [durationMinutes, setDurationMinutes] = useState<SessionDuration>(60);
  const [equipmentPref, setEquipmentPref] = useState<EquipmentPref>('technogym');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('principiante');

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
          // Keep max 3 prioritized muscles for biological specialization
          return [...prev.slice(1), muscle];
        }
        return [...prev, muscle];
      }
    });
  };

  // Helper to pick exercise matching muscle and equipment preference
  const pickBestExercise = (
    muscle: string,
    pref: EquipmentPref,
    usedIds: Set<string>
  ): ExerciseTemplate => {
    // 1. Candidate pool for this muscle
    const candidates = EXERCISE_DATABASE.filter(
      t => (t.muscle_group === muscle || (t.other_muscles && (t.other_muscles as string[]).includes(muscle))) && !usedIds.has(t.id)
    );

    if (candidates.length === 0) {
      // Fallback if all used
      const fallback = EXERCISE_DATABASE.find(t => t.muscle_group === (muscle as MuscleGroup)) || EXERCISE_DATABASE[0];
      return fallback;
    }

    // 2. Filter by equipment preference
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

    // Default to the first candidate with valid image
    return candidates[0];
  };

  // Main Generator Function
  const generateRoutines = () => {
    const routines: Routine[] = [];
    const maxExercisesPerSession = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;
    const setsForPriority = experienceLevel === 'principiante' ? 3 : 4;
    const setsForStandard = experienceLevel === 'principiante' ? 2 : 3;

    // Define splits based on daysPerWeek
    interface DayPlan {
      name: string;
      focusMuscles: string[];
    }

    let splitPlan: DayPlan[] = [];

    if (daysPerWeek === 2) {
      splitPlan = [
        { name: 'Día 1: Full Body A (Énfasis Prioritario)', focusMuscles: [...priorityMuscles, 'quadriceps', 'shoulders', 'biceps'] },
        { name: 'Día 2: Full Body B (Balance & Cadena Posterior)', focusMuscles: ['hamstrings', ...priorityMuscles, 'glutes', 'triceps'] }
      ];
    } else if (daysPerWeek === 3) {
      // If priority is chest or shoulders or triceps -> Push first
      splitPlan = [
        { name: 'Día 1: Push (Empuje & Pectoral)', focusMuscles: ['chest', 'shoulders', 'triceps'] },
        { name: 'Día 2: Pull (Tracción & Dorsal)', focusMuscles: ['lats', 'upper_back', 'biceps'] },
        { name: 'Día 3: Legs & Core (Pierna & Glúteos)', focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] }
      ];
    } else if (daysPerWeek === 4) {
      splitPlan = [
        { name: 'Día 1: Torso A (Foco Prioritario)', focusMuscles: ['chest', 'lats', 'shoulders', 'triceps'] },
        { name: 'Día 2: Pierna A (Cuádriceps & Gemelos)', focusMuscles: ['quadriceps', 'calves', 'abdominals'] },
        { name: 'Día 3: Torso B (Espalda & Deltoides)', focusMuscles: ['upper_back', 'chest', 'biceps', 'shoulders'] },
        { name: 'Día 4: Pierna B (Isquios & Glúteos)', focusMuscles: ['hamstrings', 'glutes', 'calves'] }
      ];
    } else if (daysPerWeek === 5) {
      splitPlan = [
        { name: 'Día 1: Push (Empuje Pesado)', focusMuscles: ['chest', 'shoulders', 'triceps'] },
        { name: 'Día 2: Pull (Tracción Pesada)', focusMuscles: ['lats', 'upper_back', 'biceps'] },
        { name: 'Día 3: Legs (Pierna Completa)', focusMuscles: ['quadriceps', 'hamstrings', 'glutes'] },
        { name: 'Día 4: Torso (Especialización Prioritaria)', focusMuscles: [...priorityMuscles, 'shoulders'] },
        { name: 'Día 5: Brazos & Puntos Débiles', focusMuscles: ['biceps', 'triceps', 'shoulders', 'abdominals'] }
      ];
    } else {
      // 6 days PPL x2
      splitPlan = [
        { name: 'Día 1: Push A', focusMuscles: ['chest', 'shoulders', 'triceps'] },
        { name: 'Día 2: Pull A', focusMuscles: ['lats', 'upper_back', 'biceps'] },
        { name: 'Día 3: Legs A', focusMuscles: ['quadriceps', 'calves'] },
        { name: 'Día 4: Push B', focusMuscles: ['shoulders', 'chest', 'triceps'] },
        { name: 'Día 5: Pull B', focusMuscles: ['upper_back', 'lats', 'biceps'] },
        { name: 'Día 6: Legs B', focusMuscles: ['hamstrings', 'glutes'] }
      ];
    }

    // Build each routine
    splitPlan.forEach((day, dayIdx) => {
      const usedIds = new Set<string>();

      // Sort muscles so that user's priority muscles come FIRST!
      const sortedMuscles = [...day.focusMuscles].sort((a, b) => {
        const aPri = priorityMuscles.includes(a);
        const bPri = priorityMuscles.includes(b);
        if (aPri && !bPri) return -1;
        if (!aPri && bPri) return 1;
        return 0;
      });

      // Select up to maxExercisesPerSession
      const chosenMuscles = sortedMuscles.slice(0, maxExercisesPerSession);

      const exercises: WorkoutExercise[] = chosenMuscles.map((muscle, exIdx) => {
        const template = pickBestExercise(muscle, equipmentPref, usedIds);
        usedIds.add(template.id);

        const isPriority = priorityMuscles.includes(muscle);
        const setCount = isPriority ? setsForPriority : setsForStandard;

        const sets = Array.from({ length: setCount }, (_, sIdx) => ({
          id: `sw_${Date.now()}_${dayIdx}_${exIdx}_${sIdx}`,
          index: sIdx + 1,
          type: (sIdx === 0 && isPriority ? 'normal' : 'normal') as any,
          weight_kg: 20,
          reps: 10,
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
          target_rep_range: isPriority ? '6-10' : '8-12',
          notes: isPriority 
            ? `★ Músculo Prioritario: Realizar al inicio de la sesión con RPE 8.5.`
            : `Descanso de 90-120s entre series. Técnica estricta.`,
          sets
        };
      });

      routines.push({
        id: `smart_routine_${Date.now()}_${dayIdx}`,
        title: day.name,
        folder_name: `Plan IA (${daysPerWeek} días • ${durationMinutes} min)`,
        description: `Rutina optimizada con ${exercises.length} ejercicios. Enfoque en: ${priorityMuscles.map(m => formatMuscleName(m)).join(', ')}.`,
        exercises,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    setGeneratedRoutines(routines);
    setSelectedDayIndex(0);
    setStep(6); // Go to Preview
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-5 max-h-full flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Asistente Inteligente de Rutinas</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Paso {step} de 6
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Programa tu rutina según días, músculos prioritarios y tiempo
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

        {/* Wizard Steps Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* STEP 1: Días por semana */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>¿Cuántos días a la semana vas a entrenar?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Diseñaremos la distribución óptima (Full Body, Torso/Pierna o Push/Pull/Legs).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { days: 2, label: '2 días / semana', sub: 'Full Body A/B · Eficiencia total' },
                  { days: 3, label: '3 días / semana', sub: 'Push / Pull / Legs clásico' },
                  { days: 4, label: '4 días / semana', sub: 'Torso / Pierna A/B (Recomendado)' },
                  { days: 5, label: '5 días / semana', sub: 'PPL + Especialización' },
                  { days: 6, label: '6 días / semana', sub: 'Push / Pull / Legs x2' }
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDaysPerWeek(opt.days as SplitDays)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      daysPerWeek === opt.days
                        ? 'border-blue-500 bg-blue-600/15 shadow-md ring-1 ring-blue-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</div>
                    </div>
                    {daysPerWeek === opt.days && (
                      <Check className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Músculos prioritarios */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>¿Qué músculos quieres priorizar? (Elige 1 a 3)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Los colocaremos al <b>principio de la sesión</b> y con <b>más series efectivas</b>.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'chest', label: 'Pectoral (Pecho)' },
                  { key: 'lats', label: 'Dorsal Ancho (Espalda)' },
                  { key: 'upper_back', label: 'Espalda Alta / Densidad' },
                  { key: 'shoulders', label: 'Deltoides (Hombros)' },
                  { key: 'quadriceps', label: 'Cuádriceps' },
                  { key: 'hamstrings', label: 'Isquiosurales' },
                  { key: 'glutes', label: 'Glúteos' },
                  { key: 'biceps', label: 'Bíceps' },
                  { key: 'triceps', label: 'Tríceps' }
                ].map(m => {
                  const isSelected = priorityMuscles.includes(m.key);
                  const order = priorityMuscles.indexOf(m.key) + 1;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => togglePriorityMuscle(m.key)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 text-white'
                          : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{m.label}</span>
                      {isSelected && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-black">
                          #{order}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Prioridad actual: <b>{priorityMuscles.map(m => formatMuscleName(m)).join(', ') || 'Ninguna'}</b>
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Tiempo por sesión */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>¿Cuánto tiempo tienes para entrenar por sesión?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Ajustaremos la cantidad exacta de ejercicios para que no te falte ni te sobre tiempo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { mins: 45, label: '45 minutos', desc: '4 ejercicios · Mínimo tiempo, alta intensidad' },
                  { mins: 60, label: '60 minutos', desc: '5 ejercicios · Estándar ideal de hipertrofia' },
                  { mins: 75, label: '75 minutos', desc: '6 ejercicios · Volumen completo' },
                  { mins: 90, label: '90 minutos', desc: '7-8 ejercicios · Atleta avanzado / accesorios' }
                ].map(opt => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setDurationMinutes(opt.mins as SessionDuration)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      durationMinutes === opt.mins
                        ? 'border-cyan-500 bg-cyan-600/15 shadow-md ring-1 ring-cyan-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {durationMinutes === opt.mins && (
                      <Check className="w-4 h-4 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Preferencia de Maquinaria */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>¿Qué maquinaria prefieres en tu gimnasio?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Priorizaremos máquinas con esa biomecánica real y peso libre en su defecto.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'technogym',
                    name: 'Technogym Pure Strength',
                    desc: 'Palancas de discos independientes con perfiles convergentes y pedales de precarga.'
                  },
                  {
                    key: 'hammer',
                    name: 'Hammer Strength Iso-Lateral',
                    desc: 'Máquinas olímpicas divergentes de alta resistencia biomecánica.'
                  },
                  {
                    key: 'cables_selectorized',
                    name: 'Poleas & Máquinas de placas guiadas',
                    desc: 'Torres ajustables, poleas con tensión continua y estaciones dobles.'
                  },
                  {
                    key: 'hybrid',
                    name: 'Híbrido Inteligente (Recomendado)',
                    desc: 'Combina lo mejor de máquinas de discos Technogym/Hammer con mancuernas y barras.'
                  },
                  {
                    key: 'free_weights',
                    name: 'Peso Libre (Mancuernas y Barra)',
                    desc: 'Bancos y pesas libres tradicionales si no dispones de máquinas avanzadas.'
                  }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setEquipmentPref(opt.key as EquipmentPref)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      equipmentPref === opt.key
                        ? 'border-purple-500 bg-purple-600/15 shadow-md ring-1 ring-purple-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {equipmentPref === opt.key && (
                      <Check className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Nivel de Experiencia */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>¿Cuál es tu nivel o experiencia actual?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Calibraremos la cercanía al fallo (RPE / RIR) y el volumen de series por ejercicio.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'principiante',
                    name: 'Principiante',
                    desc: '2 a 3 series efectivas por ejercicio. RIR 2-3 para aprender técnica segura y evitar fatiga excesiva.'
                  },
                  {
                    key: 'intermedio',
                    name: 'Intermedio',
                    desc: '3 a 4 series efectivas. RIR 1-2 con buena intensidad y volumen adaptado a la recuperación.'
                  },
                  {
                    key: 'avanzado',
                    name: 'Avanzado',
                    desc: '4 series efectivas. RIR 0-1 (fallo muscular en últimas series), máxima tensión mecánica.'
                  }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setExperienceLevel(opt.key as ExperienceLevel)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      experienceLevel === opt.key
                        ? 'border-emerald-500 bg-emerald-600/15 shadow-md ring-1 ring-emerald-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {experienceLevel === opt.key && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: PREVIEW DE RUTINAS GENERADAS */}
          {step === 6 && generatedRoutines && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Rutinas Generadas por IA ({generatedRoutines.length} sesiones)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Músculos prioritarios ubicados al inicio con mayor volumen.
                  </p>
                </div>
              </div>

              {/* Day Tabs */}
              <div className="flex gap-1.5 p-1 bg-[#181a28] rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
                {generatedRoutines.map((routine, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      selectedDayIndex === idx
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Día {idx + 1}
                  </button>
                ))}
              </div>

              {/* Routine Card Details */}
              {generatedRoutines[selectedDayIndex] && (
                <div className="p-4 bg-[#181a28] border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">
                        {generatedRoutines[selectedDayIndex].title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {generatedRoutines[selectedDayIndex].exercises.length} ejercicios · ~{durationMinutes} min
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {equipmentPref === 'technogym' ? 'Technogym' : equipmentPref === 'hammer' ? 'Hammer' : 'Híbrido'}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {generatedRoutines[selectedDayIndex].exercises.map((ex, exIdx) => {
                      const isPriority = priorityMuscles.includes(ex.muscle_group);
                      return (
                        <div
                          key={ex.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isPriority
                              ? 'bg-amber-500/10 border-amber-500/30 text-white'
                              : 'bg-[#121215] border-white/[0.04] text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getSafeMachineImageUrl(ex.exercise_template_id, ex.image_url)}
                              alt={ex.title}
                              className="w-9 h-9 object-cover rounded-lg border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold truncate text-white flex items-center gap-1.5">
                                <span>{ex.title}</span>
                                {isPriority && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                                    Prioridad
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                {formatMuscleName(ex.muscle_group)} · {ex.sets.length} series de {ex.target_rep_range} reps
                              </div>
                            </div>
                          </div>

                          <div className="tabular-nums font-bold text-xs text-right shrink-0 pl-2">
                            {ex.sets.length} sets
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>
          ) : step === 6 ? (
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconfigurar</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : step === 5 ? (
            <button
              type="button"
              onClick={generateRoutines}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar Rutina con IA</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSelected}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Guardar Día {selectedDayIndex + 1}
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Todas ({generatedRoutines?.length})</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
