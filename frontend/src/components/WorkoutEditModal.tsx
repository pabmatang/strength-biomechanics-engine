import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Calendar, Dumbbell, Check, Info } from 'lucide-react';
import { Workout, WorkoutExercise, WorkoutSet, ExerciseTemplate } from '../types/workout';
import { calculateWorkoutVolume, countCompletedSets } from '../utils/fitness';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ErrorBoundary } from './ErrorBoundary';

interface WorkoutEditModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWorkout: Workout) => void;
  workoutHistory?: Workout[];
}

export const WorkoutEditModal: React.FC<WorkoutEditModalProps> = ({
  workout,
  isOpen,
  onClose,
  onSave,
  workoutHistory
}) => {
  const [title, setTitle] = useState(workout.title);
  const [description, setDescription] = useState(workout.description || '');
  const [date, setDate] = useState(workout.start_time.split('T')[0]);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(JSON.parse(JSON.stringify(workout.exercises)));
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<WorkoutExercise | null>(null);

  if (!isOpen) return null;

  const handleUpdateSet = (exIdx: number, setIdx: number, field: keyof WorkoutSet, val: any) => {
    const copy = [...exercises];
    copy[exIdx].sets[setIdx] = {
      ...copy[exIdx].sets[setIdx],
      [field]: val
    };
    setExercises(copy);
  };

  const handleAddSet = (exIdx: number) => {
    setExercises(prev => {
      return prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${ex.sets.length + 1}`,
          index: ex.sets.length + 1,
          type: 'normal',
          weight_kg: lastSet ? lastSet.weight_kg : 20,
          reps: lastSet ? lastSet.reps : 10,
          is_completed: true
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      });
    });
  };

  const handleDeleteSet = (exIdx: number, setIdx: number) => {
    const copy = [...exercises];
    if (copy[exIdx].sets.length <= 1) return;
    copy[exIdx].sets = copy[exIdx].sets.filter((_, i) => i !== setIdx);
    setExercises(copy);
  };

  const handleDeleteExercise = (exIdx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  };

  const handleAddExercise = (template: ExerciseTemplate) => {
    const newEx: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exercise_template_id: template.id,
      title: template.title,
      brand: template.brand,
      muscle_group: template.muscle_group,
      equipment_category: template.equipment_category,
      image_url: template.image_url,
      sets: [
        { id: `s_${Date.now()}_1`, index: 1, type: 'normal', weight_kg: 20, reps: 10, is_completed: true }
      ]
    };
    setExercises(prev => [...prev, newEx]);
  };

  const handleSave = () => {
    const finalVolume = calculateWorkoutVolume(exercises);
    const finalSetsCount = countCompletedSets(exercises);

    const updated: Workout = {
      ...workout,
      title: title.trim() || workout.title,
      description: description.trim() || undefined,
      start_time: `${date}T12:00:00Z`,
      volume_kg: finalVolume,
      sets_count: finalSetsCount,
      exercises
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-2xl bg-[#12141e] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">Editar Entrenamiento Finalizado</h2>
            <p className="text-xs text-slate-400 truncate">Corrige pesos, repeticiones o series registradas</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition"
              title="Guardar cambios"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Exercises & Sets Editor List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {exercises.map((ex, exIdx) => (
            <div key={ex.id} className="p-4 bg-[#181a28] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => setSelectedDetailExercise(ex)}
                  className="cursor-pointer group flex items-start gap-2.5"
                  title="Click para ver ficha técnica de la máquina y progresión"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-200 group-hover:text-blue-400 transition flex items-center gap-1.5">
                      <span>{ex.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono flex items-center gap-0.5 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Info className="w-3 h-3" /> Ficha
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize">{ex.brand || 'General'} · {ex.muscle_group}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteExercise(exIdx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Eliminar ejercicio del entreno"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sets Table Header */}
              <div className="grid grid-cols-[40px_1fr_1fr_40px] items-center gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                <div>SET</div>
                <div>PESO (KG)</div>
                <div>REPETICIONES</div>
                <div></div>
              </div>

              {/* Sets Rows */}
              <div className="space-y-1.5">
                {ex.sets.map((s, sIdx) => (
                  <div key={s.id} className="grid grid-cols-[40px_1fr_1fr_40px] items-center gap-2 bg-[#12141e] p-2 rounded-xl">
                    <span className="font-mono font-bold text-xs text-slate-400 text-center">{sIdx + 1}</span>
                    <input
                      type="number"
                      step="0.5"
                      value={s.weight_kg}
                      onChange={(e) => handleUpdateSet(exIdx, sIdx, 'weight_kg', parseFloat(e.target.value) || 0)}
                      className="bg-[#181a28] border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => handleUpdateSet(exIdx, sIdx, 'reps', parseInt(e.target.value, 10) || 0)}
                      className="bg-[#181a28] border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleDeleteSet(exIdx, sIdx)}
                      className="text-slate-500 hover:text-rose-400 p-1 flex justify-center"
                      title="Eliminar serie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Set button */}
              <button
                type="button"
                onClick={() => handleAddSet(exIdx)}
                className="w-full py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 border border-dashed border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Añadir Serie</span>
              </button>
            </div>
          ))}

          {/* Add Exercise button */}
          <button
            type="button"
            onClick={() => setIsExerciseModalOpen(true)}
            className="w-full py-3 bg-[#181a28] hover:bg-slate-800 text-blue-400 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 border border-dashed border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Ejercicio al Entrenamiento</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>

      </div>

      <ExerciseSelectorModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSelect={handleAddExercise}
      />

      {/* Machine & History Detail Modal */}
      {selectedDetailExercise && (
        <ErrorBoundary onReset={() => setSelectedDetailExercise(null)}>
          <ExerciseDetailModal
            exercise={selectedDetailExercise}
            isOpen={true}
            onClose={() => setSelectedDetailExercise(null)}
            workoutHistory={workoutHistory || [workout]}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};
