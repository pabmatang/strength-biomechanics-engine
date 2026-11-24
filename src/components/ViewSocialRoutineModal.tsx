import React from 'react';
import { X, Copy, Play, Clock, Dumbbell, Trophy, Check, Sparkles } from 'lucide-react';
import { SocialPost, Routine } from '../types/workout';

interface ViewSocialRoutineModalProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onCloneRoutine: (routine: Routine) => void;
  onStartRoutine: (routine: Routine) => void;
}

export const ViewSocialRoutineModal: React.FC<ViewSocialRoutineModalProps> = ({
  post,
  isOpen,
  onClose,
  onCloneRoutine,
  onStartRoutine
}) => {
  if (!isOpen || !post) return null;

  const routine = post.routine_blueprint || {
    id: `routine_from_${post.id}`,
    title: post.workout_title,
    folder_name: 'Comunidad',
    description: `Rutina compartida por ${post.user_name}`,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    exercises: post.top_exercises.map((title, idx) => ({
      id: `ex_social_${idx}`,
      exercise_template_id: `tpl_social_${idx}`,
      title,
      brand: 'General' as const,
      muscle_group: 'chest' as const,
      equipment_category: 'machine' as const,
      sets: [
        { id: `s_${idx}_1`, index: 1, type: 'warmup' as const, weight_kg: 40, reps: 10, is_completed: true },
        { id: `s_${idx}_2`, index: 2, type: 'normal' as const, weight_kg: 80, reps: 8, is_completed: true },
        { id: `s_${idx}_3`, index: 3, type: 'normal' as const, weight_kg: 85, reps: 8, is_completed: true }
      ]
    }))
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img
                src={post.user_avatar}
                alt={post.user_name}
                className="w-7 h-7 rounded-xl object-cover border border-slate-700"
              />
              <span className="text-xs font-bold text-slate-300">{post.user_name}</span>
              <span className="text-[11px] text-slate-500">{post.user_handle}</span>
            </div>
            <h2 className="text-xl font-black text-white">{post.workout_title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workout Stats Ribbon */}
        <div className="grid grid-cols-3 gap-2.5 p-3 bg-[#181a28] rounded-2xl border border-slate-800 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Duración</span>
            <div className="font-mono font-bold text-white text-sm mt-0.5">{post.duration_minutes} min</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Volumen Total</span>
            <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{post.volume_kg.toLocaleString()} kg</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Ejercicios</span>
            <div className="font-mono font-bold text-blue-400 text-sm mt-0.5">{routine.exercises.length}</div>
          </div>
        </div>

        {/* Exercises & Sets Breakdown */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Desglose de Ejercicios y Series Realizadas:
          </div>

          {routine.exercises.map((ex, exIdx) => (
            <div key={ex.id || exIdx} className="p-3.5 bg-[#181a28] rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{ex.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                  {ex.brand || 'General'}
                </span>
              </div>

              {/* Sets Table */}
              <div className="space-y-1 pt-1">
                <div className="grid grid-cols-[40px_1fr_60px_60px] text-[10px] font-bold text-slate-500 uppercase px-2">
                  <span>SET</span>
                  <span>TIPO</span>
                  <span className="text-center">CARGA</span>
                  <span className="text-center">REPS</span>
                </div>

                {ex.sets.map((set, sIdx) => (
                  <div
                    key={set.id || sIdx}
                    className="grid grid-cols-[40px_1fr_60px_60px] items-center px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800/50 font-mono text-[11px]"
                  >
                    <span className="font-bold text-slate-400">{sIdx + 1}</span>
                    <span className="capitalize text-slate-400 text-[10px]">
                      {set.type === 'warmup' ? 'Calentamiento' : set.type === 'failure' ? 'Al fallo' : set.type === 'dropset' ? 'Drop set' : 'Efectiva'}
                    </span>
                    <span className="text-center font-bold text-white">{set.weight_kg} kg</span>
                    <span className="text-center text-slate-300">{set.reps} reps</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onCloneRoutine(routine);
              onClose();
            }}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar a Mis Rutinas</span>
          </button>

          <button
            onClick={() => {
              onStartRoutine(routine);
              onClose();
            }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Entrenar Esta Rutina Ahora</span>
          </button>
        </div>

      </div>
    </div>
  );
};
