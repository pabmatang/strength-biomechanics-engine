import React from 'react';
import { X, RefreshCw, Sparkles, Check, ArrowRight, ShieldCheck, Dumbbell, Scale } from 'lucide-react';
import { WorkoutExercise, ExerciseTemplate } from '../types/workout';
import { EXERCISE_DATABASE } from '../data/exercises';
import { formatMuscleName } from '../utils/muscleLabels';

interface MachineSubstitutionModalProps {
  exercise: WorkoutExercise;
  isOpen: boolean;
  onClose: () => void;
  onSubstitute: (newTemplate: ExerciseTemplate) => void;
}

export const MachineSubstitutionModal: React.FC<MachineSubstitutionModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onSubstitute
}) => {
  if (!isOpen) return null;

  // Find candidate substitutes:
  // Same muscle group, but different exercise_template_id
  const candidates = EXERCISE_DATABASE
    .filter(t => t.id !== exercise.exercise_template_id && t.muscle_group === exercise.muscle_group)
    .slice(0, 4);

  // If few candidates in same muscle group, add similar equipment or compound exercises
  const alternatives = candidates.length > 0 ? candidates : EXERCISE_DATABASE.filter(t => t.id !== exercise.exercise_template_id).slice(0, 3);

  const getMatchScore = (target: ExerciseTemplate) => {
    let score = 85;
    if (target.equipment_category === exercise.equipment_category) score += 8;
    if (target.exercise_type === 'weight_reps') score += 4;
    return Math.min(99, score);
  };

  const getEstimatedWeight = (target: ExerciseTemplate): number | null => {
    const currentWeight = exercise.sets.find(s => s.weight_kg && s.weight_kg > 0)?.weight_kg || 0;
    if (currentWeight <= 0) return null;

    const srcTitle = (exercise.title || '').toLowerCase();
    const tgtTitle = (target.title || '').toLowerCase();

    // Source is plates (Pure Strength / Hammer) and target is selectorized cable (Selection / Lat machine)
    if ((srcTitle.includes('pure') || srcTitle.includes('hammer') || srcTitle.includes('discos')) && (tgtTitle.includes('selection') || tgtTitle.includes('polea') || tgtTitle.includes('placas'))) {
      return Math.round(currentWeight * 1.6);
    }
    // Source is selectorized cable and target is plate loaded
    if ((srcTitle.includes('selection') || srcTitle.includes('polea')) && (tgtTitle.includes('pure') || tgtTitle.includes('hammer') || tgtTitle.includes('discos'))) {
      return Math.round(currentWeight * 0.6);
    }
    // Technogym vs Hammer leverage factor
    if (srcTitle.includes('technogym') && tgtTitle.includes('hammer')) {
      return Math.round(currentWeight * 0.9);
    }
    if (srcTitle.includes('hammer') && tgtTitle.includes('technogym')) {
      return Math.round(currentWeight * 1.05);
    }
    return currentWeight;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 sm:space-y-5 max-h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>Sustitución Biomecánica Inteligente</span>
            </div>
            <h2 className="text-xl font-black text-white">Reemplazar Máquina</h2>
            <p className="text-xs text-slate-400">
              Sustituto cinemático para: <b className="text-slate-200">{exercise.title}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Machine Mini-Card */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
            {exercise.image_url ? (
              <img src={exercise.image_url} alt={exercise.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600"><Dumbbell className="w-5 h-5" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Actual en sesión</span>
            <div className="font-bold text-slate-200 truncate">{exercise.title}</div>
            <div className="text-slate-400">{exercise.brand || 'General'} · {formatMuscleName(exercise.muscle_group)}</div>
          </div>
        </div>

        {/* Recommended Alternatives */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Máquinas Equivalentes Recomendadas:
          </div>

          {alternatives.map(cand => {
            const matchScore = getMatchScore(cand);
            const estWeight = getEstimatedWeight(cand);
            return (
              <div
                key={cand.id}
                className="p-4 bg-[#181a28] hover:bg-[#1e2133] border border-slate-800 hover:border-blue-500/40 rounded-2xl transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 flex-shrink-0">
                      {cand.image_url ? (
                        <img src={cand.image_url} alt={cand.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600"><Dumbbell className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold font-mono">
                          {cand.brand || 'General'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          {matchScore}% Compatibilidad
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white">{cand.title}</div>
                      <p className="text-xs text-slate-400 line-clamp-1">{cand.description}</p>
                    </div>
                  </div>
                </div>

                {/* Weight Converter Estimate */}
                {estWeight && (
                  <div className="flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300 p-2.5 rounded-xl font-medium">
                    <Scale className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      Carga equivalente sugerida: <strong className="text-white whitespace-nowrap">{estWeight} kg</strong> (ajustada por ratio de poleas/palancas)
                    </span>
                  </div>
                )}

                {/* Setup Tip Preview */}
                {cand.setup_tips && cand.setup_tips[0] && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><b>Tip Biomecánico:</b> {cand.setup_tips[0]}</span>
                  </div>
                )}

                {/* Substitute Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSubstitute(cand);
                    onClose();
                  }}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-blue-500/30 hover:border-transparent active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sustituir por esta máquina (conservar series)</span>
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
