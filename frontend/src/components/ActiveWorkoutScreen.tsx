import React, { useState, useEffect } from 'react';
import { Plus, Dumbbell, Timer, Flame, Weight, Check } from 'lucide-react';
import { Workout, WorkoutExercise, ExerciseTemplate } from '../types/workout';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';
import { RestTimer } from './RestTimer';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ErrorBoundary } from './ErrorBoundary';
import { calculateWorkoutVolume, countCompletedSets, detectPersonalRecords, formatDuration } from '../utils/fitness';

interface ActiveWorkoutScreenProps {
  workout: Workout;
  onUpdateWorkout: (workout: Workout) => void;
  onFinishWorkout: (workout: Workout) => void;
  onDiscardWorkout: () => void;
  workoutHistory: Workout[];
  showRpe?: boolean;
}

export const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({
  workout,
  onUpdateWorkout,
  onFinishWorkout,
  onDiscardWorkout,
  workoutHistory,
  showRpe = true
}) => {
  const [seconds, setSeconds] = useState<number>(workout.duration_seconds || 0);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [restTimerSeconds] = useState(90);
  const [finishedWorkout, setFinishedWorkout] = useState<Workout | null>(null);
  const [detailExercise, setDetailExercise] = useState<WorkoutExercise | null>(null);

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentVolume = calculateWorkoutVolume(workout.exercises);
  const completedSets = countCompletedSets(workout.exercises);

  const handleAddExercise = (template: ExerciseTemplate) => {
    const newExercise: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exercise_template_id: template.id,
      title: template.title,
      brand: template.brand,
      muscle_group: template.muscle_group,
      equipment_category: template.equipment_category,
      image_url: template.image_url,
      sets: [
        {
          id: `set_${Date.now()}_1`,
          index: 1,
          type: 'normal',
          weight_kg: 20,
          reps: 10,
          is_completed: false
        }
      ]
    };

    onUpdateWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise]
    });
  };

  const handleAddQuickCardio = () => {
    const cardioTemplate: ExerciseTemplate = {
      id: 'cardio_incline_treadmill',
      title: 'Cinta Inclinada (Incline Treadmill Walk)',
      brand: 'Life Fitness',
      model_series: 'Elevation Series',
      muscle_group: 'cardio',
      equipment_category: 'cardio_machine',
      exercise_type: 'cardio_incline',
      description: 'Caminata en pendiente pronunciada para alto gasto calórico con cero impacto articular.',
      image_url: 'https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/239-102-elevationseries-treadmill-discoverse3-hd-arcticsilver-standardview-1000x1000.png'
    };
    handleAddExercise(cardioTemplate);
  };

  const handleUpdateExercise = (idx: number, updated: WorkoutExercise) => {
    const newExercises = [...workout.exercises];
    newExercises[idx] = updated;
    onUpdateWorkout({ ...workout, exercises: newExercises });
  };

  const handleDeleteExercise = (idx: number) => {
    const newExercises = workout.exercises.filter((_, i) => i !== idx);
    onUpdateWorkout({ ...workout, exercises: newExercises });
  };

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    const newExercises = [...workout.exercises];
    const temp = newExercises[idx];
    newExercises[idx] = newExercises[idx - 1];
    newExercises[idx - 1] = temp;
    onUpdateWorkout({ ...workout, exercises: newExercises });
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= workout.exercises.length - 1) return;
    const newExercises = [...workout.exercises];
    const temp = newExercises[idx];
    newExercises[idx] = newExercises[idx + 1];
    newExercises[idx + 1] = temp;
    onUpdateWorkout({ ...workout, exercises: newExercises });
  };

  const handleFinish = () => {
    const finalWorkout: Workout = {
      ...workout,
      end_time: new Date().toISOString(),
      duration_seconds: seconds,
      volume_kg: currentVolume,
      sets_count: completedSets,
      personal_records: []
    };

    const prs = detectPersonalRecords(finalWorkout, workoutHistory);
    finalWorkout.personal_records = prs;

    setFinishedWorkout(finalWorkout);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white pb-32">
      
      {/* Sticky Workout Top Bar with Safe Area support */}
      <header className="sticky top-0 z-40 bg-[#090a0f]/95 backdrop-blur-2xl border-b border-slate-800/80 px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.6rem))] pb-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onDiscardWorkout}
            className="text-xs font-semibold text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition active:scale-95"
          >
            Descartar
          </button>

          <div className="text-center min-w-0 flex-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-blue-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatDuration(seconds)}</span>
            </div>
            <input
              type="text"
              value={workout.title}
              onChange={(e) => onUpdateWorkout({ ...workout, title: e.target.value })}
              className="bg-transparent text-center font-bold text-sm text-white focus:outline-none focus:border-b border-blue-500 w-full truncate"
            />
          </div>

          <button
            onClick={handleFinish}
            disabled={completedSets === 0}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 active:scale-95 flex-shrink-0 ${
              completedSets > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Guardar rutina / entrenamiento terminado"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-around text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Weight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Volumen:</span>
            <span className="font-mono font-bold text-white">{currentVolume.toLocaleString()} kg</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Series:</span>
            <span className="font-mono font-bold text-white">{completedSets}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <button
            onClick={() => setIsRestTimerOpen(true)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Descanso ({restTimerSeconds}s)</span>
          </button>
        </div>
      </header>

      {/* Main Exercises Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {workout.exercises.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Dumbbell className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Tu sesión está vacía</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Añade tus máquinas de Technogym, Hammer Strength o pesos libres para registrar series en tiempo real.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsExerciseModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Máquina o Ejercicio</span>
              </button>

              <button
                onClick={handleAddQuickCardio}
                className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white active:scale-95 text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-rose-400" />
                <span>+ Añadir Cardio (Cinta / Bici)</span>
              </button>
            </div>
          </div>
        ) : (
          workout.exercises.map((exercise, idx) => (
            <WorkoutExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={idx}
              totalExercises={workout.exercises.length}
              showRpe={showRpe}
              onUpdate={(updated) => handleUpdateExercise(idx, updated)}
              onDelete={() => handleDeleteExercise(idx)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
              onSetCompleted={() => {
                setIsRestTimerOpen(true);
              }}
              onOpenDetail={() => setDetailExercise(exercise)}
            />
          ))
        )}

        {/* Action Buttons: Add Exercise & Add Cardio */}
        {workout.exercises.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setIsExerciseModalOpen(true)}
              className="py-3.5 px-4 bg-[#12141e] hover:bg-slate-800/80 active:scale-[0.99] border-2 border-dashed border-slate-700/80 hover:border-blue-500/50 rounded-2xl text-xs font-bold text-blue-400 flex items-center justify-center gap-2 transition shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Máquina o Ejercicio</span>
            </button>

            <button
              onClick={handleAddQuickCardio}
              className="py-3.5 px-4 bg-[#12141e] hover:bg-slate-800/80 active:scale-[0.99] border-2 border-dashed border-rose-900/50 hover:border-rose-500/60 rounded-2xl text-xs font-bold text-rose-400 flex items-center justify-center gap-2 transition shadow-xl"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>+ Añadir Cardio (Cinta Inclinada / Bici)</span>
            </button>
          </div>
        )}
      </main>

      {/* Exercise Catalog Modal */}
      <ExerciseSelectorModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSelect={handleAddExercise}
      />

      {/* Floating Rest Timer */}
      <RestTimer
        isOpen={isRestTimerOpen}
        initialSeconds={restTimerSeconds}
        onClose={() => setIsRestTimerOpen(false)}
      />

      {/* Exercise Detail Modal (Graph & Comments & Setup Tips) */}
      {detailExercise && (
        <ErrorBoundary onReset={() => setDetailExercise(null)}>
          <ExerciseDetailModal
            exercise={detailExercise}
            isOpen={true}
            onClose={() => setDetailExercise(null)}
            workoutHistory={workoutHistory}
          />
        </ErrorBoundary>
      )}

      {/* Finish Summary Modal */}
      {finishedWorkout && (
        <WorkoutSummaryModal
          workout={finishedWorkout}
          isOpen={true}
          onSaveSurvey={(survey) => {
            const withSurvey = { ...finishedWorkout, survey };
            onFinishWorkout(withSurvey);
            setFinishedWorkout(null);
          }}
          onClose={() => {
            if (finishedWorkout) {
              onFinishWorkout(finishedWorkout);
              setFinishedWorkout(null);
            }
          }}
        />
      )}

    </div>
  );
};
