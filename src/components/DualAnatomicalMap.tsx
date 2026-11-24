import React, { useState, useMemo } from 'react';
import Model, { Muscle, IExerciseData } from 'react-body-highlighter';
import { formatMuscleName } from '../utils/muscleLabels';
import { Target, Activity } from 'lucide-react';

interface DualAnatomicalMapProps {
  primaryMuscle: string;
  secondaryMuscles?: string[];
  className?: string;
}

export const DualAnatomicalMap: React.FC<DualAnatomicalMapProps> = ({
  primaryMuscle,
  secondaryMuscles = [],
  className = ''
}) => {
  const normPrimary = (primaryMuscle || '').toLowerCase().trim();
  const normSecondaries = useMemo(
    () => secondaryMuscles.map(m => (m || '').toLowerCase().trim()),
    [secondaryMuscles]
  );

  const [viewMode, setViewMode] = useState<'dual' | 'front' | 'back'>('dual');
  const [selectedMuscleName, setSelectedMuscleName] = useState<string | null>(null);

  // Calculate synergists based on primary muscle if none provided
  const resolvedSynergists = useMemo(() => {
    if (normSecondaries.length > 0) return normSecondaries;
    switch (normPrimary) {
      case 'chest':
        return ['shoulders', 'triceps'];
      case 'lats':
        return ['biceps', 'rear_delts', 'traps'];
      case 'upper_back':
        return ['biceps', 'rear_delts', 'traps', 'lats'];
      case 'quadriceps':
        return ['glutes', 'adductors', 'calves'];
      case 'hamstrings':
        return ['glutes', 'calves', 'lower_back'];
      case 'glutes':
        return ['hamstrings', 'quadriceps', 'lower_back'];
      case 'shoulders':
        return ['triceps', 'traps'];
      case 'biceps':
        return ['forearms'];
      case 'triceps':
        return ['chest', 'shoulders'];
      case 'abdominals':
        return ['obliques'];
      default:
        return [];
    }
  }, [normPrimary, normSecondaries]);

  // Convert our database muscle keys to react-body-highlighter Muscle keys
  const mapKeyToMuscles = (key: string): Muscle[] => {
    const k = key.toLowerCase();
    switch (k) {
      case 'chest':
        return ['chest'];
      case 'lats':
        return ['upper-back', 'trapezius'];
      case 'upper_back':
        return ['upper-back', 'trapezius', 'back-deltoids'];
      case 'lower_back':
        return ['lower-back'];
      case 'shoulders':
        return ['front-deltoids', 'back-deltoids'];
      case 'rear_delts':
        return ['back-deltoids'];
      case 'front_delts':
        return ['front-deltoids'];
      case 'biceps':
        return ['biceps'];
      case 'triceps':
        return ['triceps'];
      case 'forearms':
        return ['forearm'];
      case 'quadriceps':
        return ['quadriceps'];
      case 'hamstrings':
        return ['hamstring'];
      case 'glutes':
        return ['gluteal'];
      case 'calves':
        return ['calves'];
      case 'abdominals':
      case 'core':
        return ['abs', 'obliques'];
      case 'obliques':
        return ['obliques'];
      case 'adductors':
        return ['adductor'];
      case 'abductors':
        return ['abductors'];
      case 'traps':
        return ['trapezius'];
      default:
        return [];
    }
  };

  // Build model data
  const modelData = useMemo<IExerciseData[]>(() => {
    const primaryMuscles = mapKeyToMuscles(normPrimary);
    const secondaryMusclesList = resolvedSynergists.flatMap(mapKeyToMuscles);

    // Filter out primary from secondary to avoid overlapping frequencies
    const filteredSecondary = secondaryMusclesList.filter(m => !primaryMuscles.includes(m));

    return [
      {
        name: 'Motor Primario',
        muscles: primaryMuscles,
        frequency: 2
      },
      {
        name: 'Sinergista',
        muscles: filteredSecondary,
        frequency: 1
      }
    ];
  }, [normPrimary, resolvedSynergists]);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top View Selector Controls & Centered Legend */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              viewMode === 'dual' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dual (Ambos)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('front')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              viewMode === 'front' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Frontal
          </button>
          <button
            type="button"
            onClick={() => setViewMode('back')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              viewMode === 'back' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dorsal (Posterior)
          </button>
        </div>

        {/* Centered Clean Color Legend Without Overflows */}
        <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="text-emerald-400 font-bold">Motor Primario</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
            <span className="text-purple-300 font-bold">Sinergista</span>
          </span>
        </div>
      </div>

      {/* Anatomical Display Canvas */}
      <div className="bg-gradient-to-b from-[#101424] via-[#0b0e1b] to-[#070913] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-around gap-6 relative min-h-[280px] overflow-hidden">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_75%)] pointer-events-none" />

        {/* 1. ANTERIOR (FRONT) VIEW */}
        {(viewMode === 'dual' || viewMode === 'front') && (
          <div className="flex flex-col items-center relative z-10">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Vista Anterior (Frontal)
            </span>
            <div className="w-36 h-64 flex items-center justify-center">
              <Model
                type="anterior"
                data={modelData}
                highlightedColors={['#8b5cf6', '#10b981']}
                bodyColor="#1e293b"
                style={{ width: '135px', height: '100%' }}
                onClick={(stats: any) => {
                  if (stats?.muscle) setSelectedMuscleName(stats.muscle);
                }}
              />
            </div>
          </div>
        )}

        {/* 2. POSTERIOR (BACK) VIEW */}
        {(viewMode === 'dual' || viewMode === 'back') && (
          <div className="flex flex-col items-center relative z-10">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Vista Posterior (Dorsal)
            </span>
            <div className="w-36 h-64 flex items-center justify-center">
              <Model
                type="posterior"
                data={modelData}
                highlightedColors={['#8b5cf6', '#10b981']}
                bodyColor="#1e293b"
                style={{ width: '135px', height: '100%' }}
                onClick={(stats: any) => {
                  if (stats?.muscle) setSelectedMuscleName(stats.muscle);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Anatomical Activation Summary Bar */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">
            Músculo Principal:{' '}
            <strong className="text-white capitalize">{formatMuscleName(primaryMuscle)}</strong>
          </span>
        </div>
        {resolvedSynergists.length > 0 && (
          <div className="text-slate-400 text-[11px] truncate max-w-[200px] sm:max-w-none">
            Sinergistas:{' '}
            <span className="text-purple-300">
              {resolvedSynergists.map(m => formatMuscleName(m)).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
