import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Weight, Flame, CheckCircle2, Download, ArrowRight, Activity, Smile, Brain, AlertTriangle } from 'lucide-react';
import { Workout, WorkoutSurvey } from '../types/workout';
import { formatDuration, exportToHevyJson } from '../utils/fitness';

interface WorkoutSummaryModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
  onSaveSurvey?: (survey: WorkoutSurvey) => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  workout,
  isOpen,
  onClose,
  onSaveSurvey
}) => {
  const [fatigue, setFatigue] = useState(7);
  const [motivation, setMotivation] = useState(8);
  const [mindMuscle, setMindMuscle] = useState(8);
  const [selectedJoints, setSelectedJoints] = useState<string[]>(['Ninguna']);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleJoint = (joint: string) => {
    if (joint === 'Ninguna') {
      setSelectedJoints(['Ninguna']);
      return;
    }
    const filtered = selectedJoints.filter(j => j !== 'Ninguna');
    if (filtered.includes(joint)) {
      const next = filtered.filter(j => j !== joint);
      setSelectedJoints(next.length === 0 ? ['Ninguna'] : next);
    } else {
      setSelectedJoints([...filtered, joint]);
    }
  };

  const handleFinish = () => {
    if (onSaveSurvey) {
      onSaveSurvey({
        fatigue,
        motivation,
        mind_muscle_connection: mindMuscle,
        discomfort_joints: selectedJoints
      });
    }
    onClose();
  };

  const downloadHevyJson = () => {
    const payload = exportToHevyJson(workout);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hevy_workout_${workout.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const JOINTS = ['Hombros', 'Rodillas', 'Lumbares', 'Codos', 'Muñecas', 'Ninguna'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-lg bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 sm:space-y-6 max-h-full overflow-y-auto">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">¡Entrenamiento Completado!</h2>
          <p className="text-sm text-slate-400">{workout.title}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#181a28] border border-slate-800 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center text-blue-400 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Tiempo</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {formatDuration(workout.duration_seconds)}
            </div>
          </div>

          <div className="bg-[#181a28] border border-slate-800 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <Weight className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Volumen</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {workout.volume_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
            </div>
          </div>

          <div className="bg-[#181a28] border border-slate-800 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center text-purple-400 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Series</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {workout.sets_count}
            </div>
          </div>
        </div>

        {/* PR Section */}
        {workout.personal_records && workout.personal_records.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Trophy className="w-4 h-4" />
              <span>Nuevos Récords Personales (PR)</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {workout.personal_records.map(pr => (
                <div key={pr.id} className="flex items-center justify-between text-slate-300">
                  <span>{pr.exercise_title}</span>
                  <span className="font-mono font-bold text-amber-400">
                    {pr.type === 'max_weight' ? `${pr.value} kg (Peso Máximo)` : `${pr.value} kg (1RM Estimado)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encuesta Post-Entreno de Fatiga, Motivación y Molestias */}
        <div className="bg-[#181a28] border border-blue-500/20 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <Activity className="w-4 h-4" />
            <span>Encuesta de Fatiga, Motivación & Sensaciones</span>
          </div>

          {/* Fatiga slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Nivel de Fatiga Percibida:</span>
              <span className="font-mono font-bold text-amber-400">{fatigue} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={fatigue}
              onChange={(e) => setFatigue(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Fresco (1)</span>
              <span>Agotado al fallo (10)</span>
            </div>
          </div>

          {/* Motivación / Ganas de entrenar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Ganas de Entrenar / Motivación:</span>
              <span className="font-mono font-bold text-emerald-400">{motivation} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={motivation}
              onChange={(e) => setMotivation(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Baja energía (1)</span>
              <span>Máxima motivación (10)</span>
            </div>
          </div>

          {/* Conexión mente-músculo */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Conexión Mente-Músculo / Congestión:</span>
              <span className="font-mono font-bold text-purple-400">{mindMuscle} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={mindMuscle}
              onChange={(e) => setMindMuscle(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* Molestias articulares checklist */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Molestias articulares durante la sesión:</div>
            <div className="flex flex-wrap gap-1.5">
              {JOINTS.map(joint => {
                const isSelected = selectedJoints.includes(joint);
                return (
                  <button
                    key={joint}
                    type="button"
                    onClick={() => toggleJoint(joint)}
                    className={`px-2.5 py-1 text-xs rounded-xl font-medium border transition ${
                      isSelected
                        ? joint === 'Ninguna'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {joint}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={downloadHevyJson}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar en formato Hevy JSON (OAS 3.0)</span>
          </button>

          <button
            onClick={handleFinish}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
          >
            <span>Guardar Sesión y Encuesta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
