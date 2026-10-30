import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, Info, Dumbbell, RefreshCw, Target, MapPin, Video } from 'lucide-react';
import { WorkoutExercise, WorkoutSet, ExerciseTemplate } from '../types/workout';
import { SetRow } from './SetRow';
import { MachineSubstitutionModal } from './MachineSubstitutionModal';
import { getSafeMachineImageUrl } from '../utils/machineImages';
import { formatMuscleName } from '../utils/muscleLabels';

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  totalExercises: number;
  showRpe?: boolean;
  onUpdate: (updated: WorkoutExercise) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSetCompleted: () => void;
  onOpenDetail: () => void;
  onOpenVideoAnalysis?: () => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  index,
  totalExercises,
  showRpe = true,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSetCompleted,
  onOpenDetail,
  onOpenVideoAnalysis
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(exercise.title);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [machinePin, setMachinePin] = useState(() => {
    try {
      return localStorage.getItem(`chance_pin_${exercise.exercise_template_id}`) || '';
    } catch {
      return '';
    }
  });

  const handleUpdatePin = (val: string) => {
    setMachinePin(val);
    try {
      localStorage.setItem(`chance_pin_${exercise.exercise_template_id}`, val);
    } catch {}
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdate({ ...exercise, title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSubstitute = (template: ExerciseTemplate) => {
    onUpdate({
      ...exercise,
      exercise_template_id: template.id,
      title: template.title,
      brand: template.brand,
      muscle_group: template.muscle_group,
      equipment_category: template.equipment_category,
      image_url: template.image_url
    });
  };

  const addSet = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: WorkoutSet = {
      id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      index: exercise.sets.length + 1,
      type: 'normal',
      weight_kg: lastSet ? lastSet.weight_kg : 20,
      reps: lastSet ? lastSet.reps : 10,
      is_completed: false,
      previous_weight_kg: lastSet ? lastSet.weight_kg : null,
      previous_reps: lastSet ? lastSet.reps : null
    };

    onUpdate({
      ...exercise,
      sets: [...exercise.sets, newSet]
    });
  };

  const updateSet = (setIdx: number, updatedSet: WorkoutSet) => {
    const newSets = [...exercise.sets];
    newSets[setIdx] = updatedSet;
    onUpdate({ ...exercise, sets: newSets });
  };

  const deleteSet = (setIdx: number) => {
    if (exercise.sets.length <= 1) return;
    const newSets = exercise.sets.filter((_, idx) => idx !== setIdx);
    onUpdate({ ...exercise, sets: newSets });
  };

  return (
    <div className="bg-[#12141e] border border-slate-800/80 rounded-2xl p-4 shadow-xl text-white space-y-3 transition">
      
      {/* Exercise Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          
          {/* Machine Photo thumbnail (Clickable to open Detail/Tips/History Modal) */}
          {(() => {
            const safeImg = getSafeMachineImageUrl(exercise.exercise_template_id, exercise.muscle_group, exercise.image_url);
            return (
              <button
                type="button"
                onClick={onOpenDetail}
                className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 flex-shrink-0 relative group cursor-pointer"
                title="Ver foto ampliada, historial y ajustes biomecánicos"
              >
                <img
                  src={safeImg}
                  alt={exercise.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/machines/technogym_pure_chest_press.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Info className="w-4 h-4 text-white drop-shadow" />
                </div>
              </button>
            );
          })()}

          {/* Exercise Details & Title Editing */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                {exercise.brand || 'General'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                {formatMuscleName(exercise.muscle_group)}
              </span>

              {/* Quick Machine Pin Badge on Card */}
              <div className="flex items-center gap-1 bg-[#1a1e30] border border-amber-500/30 px-2 py-0.5 rounded-lg text-[10px]">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span className="text-slate-400 font-bold uppercase">Pin:</span>
                <input
                  type="text"
                  placeholder="#4"
                  value={machinePin}
                  onChange={(e) => handleUpdatePin(e.target.value)}
                  className="w-10 bg-transparent text-amber-300 font-bold focus:outline-none text-center"
                  title="Pasador o regulación de altura del asiento / respaldo"
                />
              </div>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-[#181a28] border border-blue-500 rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
                  title="Guardar título"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3
                  onClick={onOpenDetail}
                  className="font-bold text-base text-slate-100 hover:text-blue-400 transition cursor-pointer truncate"
                  title="Click para ver historial y foto de la máquina"
                >
                  {exercise.title}
                </h3>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-slate-500 hover:text-blue-400 transition"
                  title="Editar nombre del ejercicio"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={onOpenDetail}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Historial & tips</span>
              </button>

              <span className="text-slate-600">·</span>

              {/* Quick Substitute Machine Button */}
              <button
                type="button"
                onClick={() => setIsSubModalOpen(true)}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                title="Cambiar máquina por una parecida recomendada"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Cambiar máquina</span>
              </button>

              {onOpenVideoAnalysis && (
                <>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={onOpenVideoAnalysis}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer bg-cyan-950/50 hover:bg-cyan-900/60 px-2 py-0.5 rounded-lg border border-cyan-500/30 text-[11px] transition"
                    title="Subir vídeo o grabar serie para corrección biomecánica"
                  >
                    <Video className="w-3 h-3 text-cyan-400" />
                    <span>Corregir técnica</span>
                  </button>
                </>
              )}

              <span className="text-slate-600">·</span>

              {/* Target Rep Range Badge & Inline Editor */}
              <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-700/80">
                <Target className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">Obj:</span>
                <input
                  type="text"
                  value={exercise.target_rep_range || '8-12'}
                  onChange={(e) => onUpdate({ ...exercise, target_rep_range: e.target.value })}
                  className="w-12 bg-transparent text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:border-b border-emerald-500 text-center"
                  placeholder="8-12"
                  title="Rango o repeticiones objetivo (ej. 8-12, 6-8, 10 reps)"
                />
                <span className="text-[10px] text-slate-500">reps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action buttons: Reorder and Delete */}
        <div className="flex items-center gap-0.5">
          {onMoveUp && index > 0 && (
            <button
              onClick={onMoveUp}
              className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
              title="Mover arriba"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && index < totalExercises - 1 && (
            <button
              onClick={onMoveDown}
              className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
              title="Mover abajo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition ml-1"
            title="Eliminar ejercicio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Field */}
      <div>
        <input
          type="text"
          placeholder="Notas de la serie (ej. 'Sillín en punto 4', 'Rango excéntrico lento')..."
          value={exercise.notes || ''}
          onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
          className="w-full bg-[#181a28]/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
        />
      </div>

      {/* Sets Header */}
      {(() => {
        const isCardio = exercise.muscle_group === 'cardio' || exercise.exercise_type === 'cardio_incline' || exercise.exercise_type === 'cardio_time_distance';
        let headerCols = 'grid-cols-[40px_1fr_75px_70px_40px]';
        if (isCardio) {
          headerCols = 'grid-cols-[40px_1fr_65px_65px_60px_40px]';
        } else if (showRpe) {
          headerCols = 'grid-cols-[40px_1fr_68px_58px_54px_40px]';
        }

        return (
          <div className={`grid ${headerCols} items-center gap-1.5 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase`}>
            <div>SET</div>
            <div>PREVIO</div>
            {isCardio ? (
              <>
                <div className="text-center">MIN</div>
                <div className="text-center">{exercise.exercise_type === 'cardio_incline' ? '% INCL' : 'KM/H'}</div>
                <div className="text-center">KCAL</div>
              </>
            ) : (
              <>
                <div className="text-center">KG</div>
                <div className="text-center">REPS</div>
                {showRpe && <div className="text-center text-purple-400 font-bold">RPE</div>}
              </>
            )}
            <div className="text-right pr-2">✓</div>
          </div>
        );
      })()}

      {/* Sets List */}
      <div className="space-y-1">
        {exercise.sets.map((set, idx) => (
          <SetRow
            key={set.id}
            set={set}
            index={idx}
            showRpe={showRpe}
            exerciseType={exercise.exercise_type}
            targetRepRange={exercise.target_rep_range}
            onUpdate={(updated) => updateSet(idx, updated)}
            onDelete={() => deleteSet(idx)}
            onCompletedChange={(completed) => {
              if (completed) onSetCompleted();
            }}
          />
        ))}
      </div>

      {/* Add Set Button */}
      <button
        type="button"
        onClick={(e) => addSet(e)}
        className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.99] text-xs font-semibold text-slate-300 rounded-xl border border-dashed border-slate-700/80 transition flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5 text-blue-400" />
        <span>Añadir Serie</span>
      </button>

      {/* Machine Substitution Modal */}
      <MachineSubstitutionModal
        exercise={exercise}
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onSubstitute={handleSubstitute}
      />

    </div>
  );
};
