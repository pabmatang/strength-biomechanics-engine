import React, { useState } from 'react';
import { 
  Folder, Play, Plus, Dumbbell, Trash2, Edit2, ArrowUp, ArrowDown, Check, 
  Info, Sparkles, ChevronDown, ChevronUp, Target, Hash, Sliders, X, Flame
} from 'lucide-react';
import { Routine, WorkoutExercise, ExerciseTemplate, Workout, WorkoutSet, SetType } from '../types/workout';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { SmartRoutineWizardModal } from './SmartRoutineWizardModal';
import { ErrorBoundary } from './ErrorBoundary';
import { getSafeMachineImageUrl } from '../utils/machineImages';

interface RoutinesScreenProps {
  routines: Routine[];
  onStartRoutine: (routine: Routine) => void;
  onCreateRoutine: (routine: Routine) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => void;
  workoutHistory?: Workout[];
}

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({
  routines,
  onStartRoutine,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  workoutHistory = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('Mis Rutinas');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);

  // Expanded exercise in editor (for editing sets/reps/weight)
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(0);

  // Smart Routine Wizard Modal (AI / Beginner recommendation)
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);

  // Exercise Detail Modal (Machine Technical Sheet)
  const [selectedExerciseForDetail, setSelectedExerciseForDetail] = useState<WorkoutExercise | null>(null);

  // Group routines by folder
  const folders = routines.reduce((acc, r) => {
    const fName = r.folder_name || 'Generales';
    if (!acc[fName]) acc[fName] = [];
    acc[fName].push(r);
    return acc;
  }, {} as Record<string, Routine[]>);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setFolder('Mis Rutinas');
    setDescription('');
    setExercises([]);
    setExpandedExerciseIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingId(routine.id);
    setTitle(routine.title);
    setFolder(routine.folder_name || 'Mis Rutinas');
    setDescription(routine.description || '');
    setExercises(JSON.parse(JSON.stringify(routine.exercises))); // Deep clone
    setExpandedExerciseIndex(routine.exercises.length > 0 ? 0 : null);
    setIsModalOpen(true);
  };

  const handleAddExerciseToRoutine = (template: ExerciseTemplate) => {
    const ex: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exercise_template_id: template.id,
      title: template.title,
      brand: template.brand,
      muscle_group: template.muscle_group,
      equipment_category: template.equipment_category,
      image_url: template.image_url,
      target_rep_range: '8-12', // default range
      sets: [
        { id: `s_${Date.now()}_1`, index: 1, type: 'normal', weight_kg: 20, reps: 10, is_completed: false },
        { id: `s_${Date.now()}_2`, index: 2, type: 'normal', weight_kg: 20, reps: 10, is_completed: false },
        { id: `s_${Date.now()}_3`, index: 3, type: 'normal', weight_kg: 20, reps: 10, is_completed: false }
      ]
    };
    setExercises(prev => {
      const next = [...prev, ex];
      setExpandedExerciseIndex(next.length - 1);
      return next;
    });
  };

  const handleMoveExercise = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;
    const copy = [...exercises];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setExercises(copy);
    if (expandedExerciseIndex === idx) setExpandedExerciseIndex(targetIdx);
  };

  // Set management for a specific exercise in routine editor
  const handleAddSet = (exerciseIdx: number) => {
    setExercises(prev => {
      return prev.map((ex, i) => {
        if (i !== exerciseIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${ex.sets.length + 1}`,
          index: ex.sets.length + 1,
          type: 'normal',
          weight_kg: lastSet ? lastSet.weight_kg : 20,
          reps: lastSet ? lastSet.reps : 10,
          is_completed: false
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      });
    });
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      return prev.map((ex, i) => {
        if (i !== exerciseIdx) return ex;
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((_, idx) => idx !== setIdx).map((s, idx) => ({ ...s, index: idx + 1 }))
        };
      });
    });
  };

  const handleUpdateSetWeight = (exerciseIdx: number, setIdx: number, weightKg: number) => {
    setExercises(prev => {
      const copy = [...prev];
      copy[exerciseIdx].sets[setIdx].weight_kg = weightKg;
      return copy;
    });
  };

  const handleUpdateSetReps = (exerciseIdx: number, setIdx: number, reps: number) => {
    setExercises(prev => {
      const copy = [...prev];
      copy[exerciseIdx].sets[setIdx].reps = reps;
      return copy;
    });
  };

  const handleUpdateSetType = (exerciseIdx: number, setIdx: number, type: SetType) => {
    setExercises(prev => {
      const copy = [...prev];
      copy[exerciseIdx].sets[setIdx].type = type;
      return copy;
    });
  };

  const handleUpdateTargetRepRange = (exerciseIdx: number, target: string) => {
    setExercises(prev => {
      const copy = [...prev];
      copy[exerciseIdx].target_rep_range = target;
      return copy;
    });
  };

  const handleSaveRoutine = () => {
    if (!title.trim() || exercises.length === 0) return;

    if (editingId) {
      // Update existing
      const updated: Routine = {
        id: editingId,
        title: title.trim(),
        folder_name: folder.trim() || 'Mis Rutinas',
        description: description.trim() || undefined,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        exercises
      };
      onUpdateRoutine(updated);
    } else {
      // Create new
      const created: Routine = {
        id: `routine_${Date.now()}`,
        title: title.trim(),
        folder_name: folder.trim() || 'Mis Rutinas',
        description: description.trim() || undefined,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        exercises
      };
      onCreateRoutine(created);
    }

    setIsModalOpen(false);
  };

  // Mini nutrition summary for Daily Dashboard
  const todayMealsSummary = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('mia_fatsecret_meals');
      const today = new Date().toISOString().split('T')[0];
      if (raw) {
        const data = JSON.parse(raw);
        const plan = data[today] || Object.values(data)[0];
        if (plan) {
          let totalCal = 0;
          let totalProt = 0;
          (plan.meals || []).forEach((m: any) => {
            (m.foods || []).forEach((f: any) => {
              totalCal += f.calories || 0;
              totalProt += f.protein || 0;
            });
          });
          const target = plan.target_calories || 2250;
          return {
            consumed: totalCal,
            target,
            remaining: target - totalCal,
            protein: Math.round(totalProt)
          };
        }
      }
    } catch {}
    return { consumed: 2150, target: 2250, remaining: 100, protein: 175 };
  }, []);

  const todaysRoutine = routines[0];

  return (
    <div className="space-y-6">
      {/* UNIFIED DAILY DASHBOARD (Qué Toca Entrenar Hoy + Anillo Compacto Nutricional) */}
      <div className="bg-gradient-to-br from-[#121626] via-[#101322] to-[#0d0f1a] border border-blue-500/25 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative z-10">
          {/* Left Column: Qué Toca Entrenar Hoy */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Qué Toca Entrenar Hoy</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Sesión Programada</span>
            </div>

            {todaysRoutine ? (
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{todaysRoutine.title}</span>
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-400 font-bold whitespace-nowrap">
                    {todaysRoutine.exercises.length} máquinas biomecánicas
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 whitespace-nowrap">~45 min estimados</span>
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-white">Crea tu primera rutina</h3>
                <p className="text-xs text-slate-400">Diseña un entrenamiento con máquinas Technogym o Hammer.</p>
              </div>
            )}

            {todaysRoutine && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onStartRoutine(todaysRoutine)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Sesión Ahora</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(todaysRoutine)}
                  className="px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                >
                  Ver / Editar
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Mini Nutrition Ring */}
          <div className="flex items-center gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800 flex-shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${Math.min(100, Math.round((todayMealsSummary.consumed / todayMealsSummary.target) * 100))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Nutrición Hoy</div>
              <div className="text-sm font-black text-white whitespace-nowrap">
                {todayMealsSummary.remaining >= 0 ? `${todayMealsSummary.remaining} kcal` : `${Math.abs(todayMealsSummary.remaining)} superávit`}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold whitespace-nowrap">
                {todayMealsSummary.consumed} / {todayMealsSummary.target} kcal · {todayMealsSummary.protein}g prot
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Rutinas de Entrenamiento</h2>
          <p className="text-xs text-slate-400">Edita, personaliza y organiza tus plantillas para el gimnasio</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSmartWizardOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition border border-indigo-400/30"
            title="Asistente inteligente: recomienda rutina según días, prioridad de músculos y tiempo"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Asistente de rutinas</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-3 py-2 bg-[#18181c] hover:bg-[#202026] active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-white/[0.08] flex items-center gap-1.5 transition"
            title="Crear rutina a mano"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>A Mano</span>
          </button>
        </div>
      </div>

      {/* Routine Folders & Cards */}
      <div className="space-y-6">
        {Object.entries(folders).map(([folderName, folderRoutines]) => (
          <div key={folderName} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>{folderName}</span>
              <span className="text-slate-600">({folderRoutines.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folderRoutines.map(routine => (
                <div
                  key={routine.id}
                  className="bg-[#12141e] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition">
                        {routine.title}
                      </h3>
                      
                      <div className="flex items-center gap-1">
                        {/* Edit Routine Button */}
                        <button
                          onClick={() => openEditModal(routine)}
                          className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Editar rutina y series"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Routine Button */}
                        <button
                          onClick={() => onDeleteRoutine(routine.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Eliminar rutina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {routine.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{routine.description}</p>
                    )}

                    {/* Exercises Preview (Clickable to view full biomechanical card) */}
                    <div className="space-y-1.5 pt-1">
                      {routine.exercises.slice(0, 5).map((ex, exIdx) => (
                        <div 
                          key={`${routine.id}_ex_${ex.id || exIdx}_${exIdx}`} 
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedExerciseForDetail(ex);
                          }}
                          className="text-xs text-slate-300 flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 active:bg-slate-800 cursor-pointer transition group/item"
                          title="Haz clic para ver la ficha técnica y biomecánica de la máquina"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 group-hover/item:bg-cyan-400" />
                            <span className="font-medium truncate group-hover/item:text-blue-300">{ex.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {ex.target_rep_range && (
                              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 font-mono">
                                {ex.target_rep_range}
                              </span>
                            )}
                            <span className="text-slate-500 text-[11px] font-mono">
                              {ex.sets.length} series
                            </span>
                          </div>
                        </div>
                      ))}
                      {routine.exercises.length > 5 && (
                        <div className="text-[11px] text-slate-500 pl-3.5">
                          + {routine.exercises.length - 5} ejercicios más...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Start Routine CTA */}
                  <div className="pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between">
                    <button
                      onClick={() => openEditModal(routine)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Rutina</span>
                    </button>

                    <button
                      onClick={() => onStartRoutine(routine)}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-500/30 hover:border-transparent active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Rutina</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Routine Creator / Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
          <div className="w-full max-w-xl bg-[#12141e] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-4 max-h-full flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-white truncate">
                    {editingId ? 'Editar Rutina & Series' : 'Crear Nueva Rutina'}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">Configura ejercicios, repes y cargas</p>
                </div>
              </div>

              {/* Top Action Buttons: Guardar and Cerrar */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleSaveRoutine}
                  disabled={!title.trim() || exercises.length === 0}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition"
                  title="Guardar rutina"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Nombre de la Rutina</label>
                  <input
                    type="text"
                    placeholder="ej. Torso Hipertrofia Technogym"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Carpeta o Grupo</label>
                  <input
                    type="text"
                    placeholder="ej. Push / Pull / Legs"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Descripción o Enfoque (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Foco en dorsal ancho bajo y pectoral superior convergente"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Added Exercises in routine with complete set/reps/weight editor */}
            <div className="flex-1 overflow-y-auto space-y-3 py-1 pr-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
                <span>Ejercicios & Máquinas ({exercises.length})</span>
                <span className="text-[10px] text-slate-500 normal-case">Toca cualquier ejercicio para editar series y repes</span>
              </div>

              {exercises.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl p-4">
                  Añade las máquinas o ejercicios con el botón inferior para personalizar series, pesos y objetivos de repeticiones.
                </div>
              ) : (
                exercises.map((ex, idx) => {
                  const isExpanded = expandedExerciseIndex === idx;
                  const safeImg = getSafeMachineImageUrl(ex.exercise_template_id, ex.muscle_group, ex.image_url);

                  return (
                    <div 
                      key={ex.id} 
                      className={`rounded-2xl border transition-all ${
                        isExpanded 
                          ? 'bg-[#181a28] border-blue-500/40 shadow-xl' 
                          : 'bg-[#141624] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Exercise Row Header */}
                      <div className="p-3 flex items-center justify-between gap-2.5">
                        <div 
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => setExpandedExerciseIndex(isExpanded ? null : idx)}
                        >
                          <img 
                            src={safeImg} 
                            alt={ex.title} 
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/machines/technogym_pure_chest_press.jpg';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-sm text-slate-100 truncate flex items-center gap-2">
                              <span>{ex.title}</span>
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-2">
                              <span className="text-blue-400 font-semibold">{ex.brand || 'General'}</span>
                              <span>·</span>
                              <span className="font-mono text-slate-300">{ex.sets.length} series</span>
                              {ex.target_rep_range && (
                                <>
                                  <span>·</span>
                                  <span className="text-cyan-400 font-mono text-[10px]">Obj: {ex.target_rep_range}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (View Details, Reorder, Expand, Delete) */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Button to view machine biomechanical specs */}
                          <button
                            type="button"
                            onClick={() => setSelectedExerciseForDetail(ex)}
                            className="p-1.5 text-blue-400 hover:text-white rounded-lg bg-blue-500/10 hover:bg-blue-600 transition"
                            title="Ver ficha biomecánica y hacks de la máquina"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 'down')}
                            disabled={idx === exercises.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedExerciseIndex(isExpanded ? null : idx)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 ml-0.5"
                            title={isExpanded ? 'Contraer series' : 'Editar series'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExercises(prev => prev.filter((_, i) => i !== idx));
                              if (expandedExerciseIndex === idx) setExpandedExerciseIndex(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 ml-0.5"
                            title="Eliminar de rutina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Sets & Target Reps Editor */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-slate-800/80 space-y-3 mt-1">
                          
                          {/* TARGET REPS / REP RANGE SELECTOR */}
                          <div className="bg-[#121420] p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Objetivo de Repeticiones en Rutina</span>
                              </span>
                              <span className="text-[10px] text-slate-400">Elige rango o repes fijas</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 items-center">
                              {/* Range presets */}
                              {['6-8', '8-12', '10-12', '12-15'].map(rng => (
                                <button
                                  key={rng}
                                  type="button"
                                  onClick={() => handleUpdateTargetRepRange(idx, rng)}
                                  className={`px-2.5 py-1 text-[11px] rounded-lg font-mono font-bold transition ${
                                    ex.target_rep_range === rng
                                      ? 'bg-blue-600 text-white shadow'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {rng} reps
                                </button>
                              ))}

                              {/* Fixed reps presets */}
                              {['5', '8', '10', '12'].map(reps => (
                                <button
                                  key={reps}
                                  type="button"
                                  onClick={() => handleUpdateTargetRepRange(idx, reps)}
                                  className={`px-2.5 py-1 text-[11px] rounded-lg font-mono font-bold transition ${
                                    ex.target_rep_range === reps
                                      ? 'bg-indigo-600 text-white shadow'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {reps} fijas
                                </button>
                              ))}

                              {/* Custom input */}
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[10px] text-slate-500">Otro:</span>
                                <input
                                  type="text"
                                  placeholder="ej. 15-20"
                                  value={ex.target_rep_range || ''}
                                  onChange={(e) => handleUpdateTargetRepRange(idx, e.target.value)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-center font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SETS EDITOR TABLE */}
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                              <span className="col-span-2">Serie</span>
                              <span className="col-span-3">Tipo</span>
                              <span className="col-span-3 text-center">Peso (kg)</span>
                              <span className="col-span-3 text-center">Reps</span>
                              <span className="col-span-1 text-center"></span>
                            </div>

                            {ex.sets.map((set, sIdx) => (
                              <div 
                                key={set.id}
                                className="grid grid-cols-12 items-center gap-1.5 bg-[#121420] p-1.5 rounded-xl border border-slate-800/80 text-xs"
                              >
                                {/* Set Index */}
                                <div className="col-span-2 font-mono font-bold text-slate-300 pl-1">
                                  #{sIdx + 1}
                                </div>

                                {/* Set Type */}
                                <div className="col-span-3">
                                  <select
                                    value={set.type}
                                    onChange={(e) => handleUpdateSetType(idx, sIdx, e.target.value as SetType)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-200 focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="warmup">Calent.</option>
                                    <option value="dropset">Drop</option>
                                    <option value="failure">Fallo</option>
                                  </select>
                                </div>

                                {/* Weight (kg) */}
                                <div className="col-span-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={set.weight_kg ?? ''}
                                    onChange={(e) => handleUpdateSetWeight(idx, sIdx, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                                    placeholder="kg"
                                  />
                                </div>

                                {/* Reps */}
                                <div className="col-span-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={set.reps ?? ''}
                                    onChange={(e) => handleUpdateSetReps(idx, sIdx, parseInt(e.target.value, 10) || 0)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                                    placeholder="reps"
                                  />
                                </div>

                                {/* Remove set */}
                                <div className="col-span-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSet(idx, sIdx)}
                                    disabled={ex.sets.length <= 1}
                                    className="text-slate-500 hover:text-rose-400 disabled:opacity-20 p-1 rounded"
                                    title="Quitar serie"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Add Set Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddSet(idx);
                              }}
                              className="w-full py-1.5 mt-1 bg-slate-800/60 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-blue-400 text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-[0.99]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Añadir Serie</span>
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsExerciseSelectorOpen(true)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Máquina o Ejercicio al Catálogo</span>
            </button>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRoutine}
                disabled={!title.trim() || exercises.length === 0}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Guardar Cambios' : 'Crear Rutina'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Selector Modal for routine creator */}
      <ExerciseSelectorModal
        isOpen={isExerciseSelectorOpen}
        onClose={() => setIsExerciseSelectorOpen(false)}
        onSelect={handleAddExerciseToRoutine}
      />

      {/* Machine & Exercise Biomechanical Sheet Modal */}
      {selectedExerciseForDetail && (
        <ErrorBoundary onReset={() => setSelectedExerciseForDetail(null)}>
          <ExerciseDetailModal
            isOpen={Boolean(selectedExerciseForDetail)}
            onClose={() => setSelectedExerciseForDetail(null)}
            exercise={selectedExerciseForDetail}
            workoutHistory={workoutHistory}
          />
        </ErrorBoundary>
      )}

      {/* Smart Routine Wizard Modal (AI / Beginner) */}
      <SmartRoutineWizardModal
        isOpen={isSmartWizardOpen}
        onClose={() => setIsSmartWizardOpen(false)}
        onSaveRoutine={(routine) => {
          onCreateRoutine(routine);
        }}
        onSaveAllRoutines={(routines) => {
          routines.forEach(r => onCreateRoutine(r));
        }}
      />

    </div>
  );
};
