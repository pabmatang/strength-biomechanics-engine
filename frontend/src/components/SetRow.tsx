import React, { useState } from 'react';
import { Check, Flame, Timer, Activity } from 'lucide-react';
import { WorkoutSet, SetType, ExerciseType } from '../types/workout';
import { playSetCompleteSound } from '../utils/audio';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  showRpe?: boolean;
  exerciseType?: ExerciseType;
  targetRepRange?: string;
  onUpdate: (updated: WorkoutSet) => void;
  onDelete: () => void;
  onCompletedChange: (isCompleted: boolean) => void;
}

const SET_BADGES: Record<SetType, { label: string; color: string; tooltip: string }> = {
  normal: { label: '', color: 'bg-slate-800 text-slate-300 border-slate-700', tooltip: 'Serie Normal' },
  warmup: { label: 'W', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', tooltip: 'Calentamiento' },
  dropset: { label: 'D', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', tooltip: 'Drop Set' },
  failure: { label: 'F', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', tooltip: 'Al fallo' }
};

export const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  showRpe = true,
  exerciseType = 'weight_reps',
  targetRepRange,
  onUpdate,
  onCompletedChange
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const isCardio = exerciseType === 'cardio_incline' || exerciseType === 'cardio_time_distance';

  const rangeStatus = React.useMemo(() => {
    if (!targetRepRange || !set.reps || !set.is_completed) return null;
    const parts = targetRepRange.split('-').map(p => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      if (set.reps < parts[0]) return 'below';
      if (set.reps > parts[1]) return 'above';
      return 'in_range';
    }
    if (parts.length === 1 && !isNaN(parts[0])) {
      return set.reps >= parts[0] ? 'in_range' : 'below';
    }
    return null;
  }, [targetRepRange, set.reps, set.is_completed]);

  const toggleComplete = () => {
    const nextCompleted = !set.is_completed;
    onUpdate({ ...set, is_completed: nextCompleted });
    onCompletedChange(nextCompleted);
    if (nextCompleted) {
      playSetCompleteSound();
    }
  };

  const handleTypeSelect = (type: SetType) => {
    onUpdate({ ...set, type });
    setShowTypeMenu(false);
  };

  const currentBadge = SET_BADGES[set.type];

  // Grid styling based on mode
  let gridCols = 'grid-cols-[40px_1fr_75px_70px_40px]';
  if (isCardio) {
    gridCols = 'grid-cols-[40px_1fr_65px_65px_60px_40px]';
  } else if (showRpe) {
    gridCols = 'grid-cols-[40px_1fr_68px_58px_54px_40px]';
  }

  return (
    <div
      className={`relative grid ${gridCols} items-center gap-1.5 py-1.5 px-2 rounded-xl transition ${
        set.is_completed
          ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-100'
          : 'hover:bg-slate-800/40 border border-transparent'
      }`}
    >
      {/* Set Badge / Type Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border transition ${currentBadge.color}`}
          title={currentBadge.tooltip}
        >
          {set.type === 'normal' ? index + 1 : currentBadge.label}
        </button>

        {showTypeMenu && (
          <div className="absolute top-9 left-0 z-30 w-36 bg-[#181a28] border border-slate-700 rounded-xl shadow-2xl py-1 text-xs">
            <button
              onClick={() => handleTypeSelect('normal')}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-700/60 flex items-center gap-2"
            >
              <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">1</span>
              Normal
            </button>
            <button
              onClick={() => handleTypeSelect('warmup')}
              className="w-full px-3 py-1.5 text-left text-amber-400 hover:bg-slate-700/60 flex items-center gap-2"
            >
              <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">W</span>
              Calentamiento
            </button>
            <button
              onClick={() => handleTypeSelect('dropset')}
              className="w-full px-3 py-1.5 text-left text-purple-400 hover:bg-slate-700/60 flex items-center gap-2"
            >
              <span className="w-4 h-4 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">D</span>
              Drop Set
            </button>
            <button
              onClick={() => handleTypeSelect('failure')}
              className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-slate-700/60 flex items-center gap-2"
            >
              <span className="w-4 h-4 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">F</span>
              Al fallo
            </button>
          </div>
        )}
      </div>

      {/* Previous Performance Preview */}
      <div className="text-[11px] text-slate-500 font-mono truncate px-1">
        {isCardio ? (
          <span>{set.duration_seconds ? `${Math.round(set.duration_seconds / 60)}m` : '—'} · {set.incline_pct ? `${set.incline_pct}%` : `${set.speed_kmh || 0}km/h`}</span>
        ) : set.previous_weight_kg && set.previous_reps ? (
          <span>{set.previous_weight_kg}k × {set.previous_reps}</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </div>

      {/* Inputs: Cardio Mode vs Strength Mode */}
      {isCardio ? (
        <>
          {/* Minutes Input */}
          <div>
            <input
              type="number"
              step="1"
              min="0"
              value={set.duration_seconds ? Math.round(set.duration_seconds / 60) : ''}
              placeholder="Min"
              onChange={(e) => {
                const mins = parseFloat(e.target.value) || 0;
                // Estimate kcal burned based on minutes and incline/speed
                const estKcal = Math.round(mins * 9.5);
                onUpdate({
                  ...set,
                  duration_seconds: mins * 60,
                  calories_kcal: estKcal
                });
              }}
              className={`w-full text-center py-1 px-1 font-mono font-semibold text-xs rounded-lg border focus:outline-none transition ${
                set.is_completed
                  ? 'bg-transparent border-emerald-800/40 text-emerald-200'
                  : 'bg-[#181a28] border-slate-700 text-white focus:border-blue-500'
              }`}
            />
          </div>

          {/* Incline % or Speed km/h Input */}
          <div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={exerciseType === 'cardio_incline' ? (set.incline_pct ?? '') : (set.speed_kmh ?? '')}
              placeholder={exerciseType === 'cardio_incline' ? '% Incl' : 'Km/h'}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                if (exerciseType === 'cardio_incline') {
                  onUpdate({ ...set, incline_pct: val });
                } else {
                  onUpdate({ ...set, speed_kmh: val });
                }
              }}
              className={`w-full text-center py-1 px-1 font-mono font-semibold text-xs rounded-lg border focus:outline-none transition ${
                set.is_completed
                  ? 'bg-transparent border-emerald-800/40 text-emerald-200'
                  : 'bg-[#181a28] border-slate-700 text-white focus:border-blue-500'
              }`}
            />
          </div>

          {/* Kcal Burned Input */}
          <div>
            <input
              type="number"
              step="5"
              min="0"
              value={set.calories_kcal || ''}
              placeholder="Kcal"
              onChange={(e) => onUpdate({ ...set, calories_kcal: parseInt(e.target.value, 10) || 0 })}
              className={`w-full text-center py-1 px-1 font-mono font-semibold text-xs rounded-lg border focus:outline-none transition ${
                set.is_completed
                  ? 'bg-transparent border-emerald-800/40 text-emerald-200'
                  : 'bg-[#181a28] border-slate-700 text-white focus:border-blue-500'
              }`}
            />
          </div>
        </>
      ) : (
        <>
          {/* Weight input (kg) */}
          <div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={set.weight_kg === 0 ? '' : set.weight_kg}
              placeholder="0"
              onChange={(e) => onUpdate({ ...set, weight_kg: parseFloat(e.target.value) || 0 })}
              className={`w-full text-center py-1 px-1 font-mono font-semibold text-xs rounded-lg border focus:outline-none transition ${
                set.is_completed
                  ? 'bg-transparent border-emerald-800/40 text-emerald-200'
                  : 'bg-[#181a28] border-slate-700 text-white focus:border-blue-500'
              }`}
            />
          </div>

          {/* Reps input */}
          <div className="relative">
            <input
              type="number"
              min="0"
              value={set.reps === 0 ? '' : set.reps}
              placeholder="0"
              onChange={(e) => onUpdate({ ...set, reps: parseInt(e.target.value, 10) || 0 })}
              className={`w-full text-center py-1 px-1 font-mono font-semibold text-xs rounded-lg border focus:outline-none transition ${
                set.is_completed
                  ? rangeStatus === 'in_range'
                    ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300 font-bold'
                    : rangeStatus === 'above'
                    ? 'bg-blue-500/10 border-blue-500/60 text-blue-300 font-bold'
                    : rangeStatus === 'below'
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-300'
                    : 'bg-transparent border-emerald-800/40 text-emerald-200'
                  : 'bg-[#181a28] border-slate-700 text-white focus:border-blue-500'
              }`}
              title={
                rangeStatus === 'in_range'
                  ? `¡En rango objetivo! (${targetRepRange})`
                  : rangeStatus === 'above'
                  ? `Superado rango objetivo (${targetRepRange}): sugerencia de subir peso`
                  : rangeStatus === 'below'
                  ? `Por debajo del rango objetivo (${targetRepRange})`
                  : undefined
              }
            />
            {rangeStatus === 'in_range' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" title="En rango objetivo" />
            )}
            {rangeStatus === 'above' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-black" title="Superaste el rango objetivo (+peso)" />
            )}
            {rangeStatus === 'below' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-black" title="Por debajo del rango objetivo" />
            )}
          </div>

          {/* RPE input (Optional, controlled by showRpe setting) */}
          {showRpe && (
            <div>
              <input
                type="number"
                step="0.5"
                min="6"
                max="10"
                value={set.rpe ?? ''}
                placeholder="RPE"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate({ ...set, rpe: isNaN(val) ? null : val });
                }}
                className={`w-full text-center py-1 px-0.5 font-mono font-bold text-xs rounded-lg border focus:outline-none transition ${
                  set.is_completed
                    ? 'bg-transparent border-purple-800/40 text-purple-300'
                    : 'bg-[#181a28] border-purple-900/50 text-purple-300 focus:border-purple-500'
                }`}
                title="RPE (Rating of Perceived Exertion): 6 a 10"
              />
            </div>
          )}
        </>
      )}

      {/* Checkmark Button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={toggleComplete}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${
            set.is_completed
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
          }`}
          title={set.is_completed ? 'Completado' : 'Marcar completado'}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

    </div>
  );
};
