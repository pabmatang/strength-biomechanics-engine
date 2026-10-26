import React, { useState } from 'react';
import { Calendar, Clock, Weight, Flame, Trophy, ChevronDown, ChevronUp, Download, Upload, Trash2, Edit2, Dumbbell, Info } from 'lucide-react';
import { Workout, WorkoutExercise } from '../types/workout';
import { formatDuration, exportToHevyJson } from '../utils/fitness';
import { WorkoutEditModal } from './WorkoutEditModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ErrorBoundary } from './ErrorBoundary';

interface HistoryScreenProps {
  workouts: Workout[];
  onDeleteWorkout: (id: string) => void;
  onImportWorkout: (workout: Workout) => void;
  onUpdateWorkout: (workout: Workout) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  workouts,
  onDeleteWorkout,
  onImportWorkout,
  onUpdateWorkout
}) => {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<WorkoutExercise | null>(null);

  const totalVolume = workouts.reduce((sum, w) => sum + (w.volume_kg || 0), 0);
  const totalHours = Math.round(workouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) / 3600);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const target = json.workout || json;
        if (target.title && Array.isArray(target.exercises)) {
          const imported: Workout = {
            id: target.id || `imported_${Date.now()}`,
            title: target.title,
            description: target.description || '',
            start_time: target.start_time || new Date().toISOString(),
            end_time: target.end_time || new Date().toISOString(),
            duration_seconds: target.duration_seconds || 3600,
            volume_kg: target.volume_kg || 5000,
            sets_count: target.sets_count || 15,
            exercises: target.exercises.map((ex: any, idx: number) => ({
              id: `ex_${idx}`,
              exercise_template_id: ex.exercise_template_id || 'unknown',
              title: ex.title || 'Ejercicio',
              brand: ex.brand || 'General',
              muscle_group: ex.muscle_group || 'chest',
              equipment_category: ex.equipment_category || 'barbell',
              notes: ex.notes || '',
              sets: (ex.sets || []).map((s: any, sIdx: number) => ({
                id: `s_${sIdx}`,
                index: sIdx + 1,
                type: s.type || 'normal',
                weight_kg: s.weight_kg || 0,
                reps: s.reps || 0,
                rpe: s.rpe || undefined,
                is_completed: true
              }))
            })),
            personal_records: target.personal_records || []
          };
          onImportWorkout(imported);
          alert('¡Entrenamiento importado con éxito!');
        } else {
          alert('El archivo JSON no tiene la estructura de entrenamiento válida.');
        }
      } catch {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = (w: Workout) => {
    const payload = exportToHevyJson(w);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hevy_workout_${w.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">Sesiones</div>
          <div className="text-2xl font-black font-mono text-blue-400 mt-1">
            {workouts.length}
          </div>
        </div>
        <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">Volumen Total</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
          </div>
        </div>
        <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">Tiempo Total</div>
          <div className="text-2xl font-black font-mono text-purple-400 mt-1">
            {totalHours} <span className="text-xs font-normal">hrs</span>
          </div>
        </div>
      </div>

      {/* Header and Import button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Historial de Sesiones</h2>
          <p className="text-xs text-slate-400">Edita entrenamientos pasados, consulta series o exporta a Hevy</p>
        </div>

        <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 transition">
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span>Importar Hevy JSON</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Workouts Timeline */}
      {workouts.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl p-8 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">No hay entrenamientos registrados aún</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Inicia una rutina o sesión libre para que tus progresos se almacenen aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map(workout => {
            const isExpanded = expandedWorkoutId === workout.id;
            const dateStr = new Date(workout.start_time).toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={workout.id}
                className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 shadow-xl text-white space-y-3 transition"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}>
                  <div>
                    <div className="text-xs text-blue-400 font-semibold">{dateStr}</div>
                    <h3 className="text-base font-bold text-slate-100 hover:text-blue-400 transition">
                      {workout.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {workout.personal_records && workout.personal_records.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Trophy className="w-3 h-3" />
                        <span>{workout.personal_records.length} PR</span>
                      </span>
                    )}

                    {/* Edit Workout Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkout(workout);
                      }}
                      className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      title="Editar entrenamiento finalizado"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{formatDuration(workout.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{workout.volume_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-purple-400" />
                    <span>{workout.sets_count} series</span>
                  </div>
                </div>

                {/* Exercises list summary */}
                <div className="text-xs text-slate-300 space-y-1 pt-1">
                  {workout.exercises.map(ex => (
                    <div
                      key={ex.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailExercise(ex);
                      }}
                      className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-slate-800/80 cursor-pointer group transition border border-transparent hover:border-slate-700/60"
                      title="Click para ver ficha de máquina, fotos, tips biomecánicos y curva de progresión"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 group-hover:scale-125 transition" />
                        <span className="text-slate-300 font-medium truncate group-hover:text-blue-400 transition">{ex.title}</span>
                        <span className="text-[10px] text-blue-400/80 opacity-0 group-hover:opacity-100 transition font-mono flex items-center gap-0.5">
                          <Info className="w-3 h-3" /> Ver
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px] font-mono flex-shrink-0">
                        {ex.sets.filter(s => s.is_completed).length} series · {Math.max(...ex.sets.map(s => s.weight_kg || 0))} kg máx
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    {workout.exercises.map(ex => (
                      <div key={ex.id} className="p-3 bg-[#181a28] rounded-xl space-y-2 text-xs border border-slate-800 hover:border-slate-700 transition">
                        <div
                          onClick={() => setSelectedDetailExercise(ex)}
                          className="flex items-center justify-between cursor-pointer group transition"
                          title="Click para abrir ficha técnica y progresión"
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition">{ex.title}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition">
                              <Info className="w-3 h-3" /> Ficha de Máquina
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 capitalize">{ex.brand || 'General'}</span>
                        </div>
                        <div className="space-y-1">
                          {ex.sets.filter(s => s.is_completed).map((s, idx) => (
                            <div key={s.id} className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                              <span>Serie {idx + 1} ({s.type})</span>
                              <span className="font-bold text-slate-200">{s.weight_kg} kg × {s.reps} reps</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingWorkout(workout)}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar Sesión</span>
                        </button>
                        <button
                          onClick={() => handleExport(workout)}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Exportar Hevy JSON</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onDeleteWorkout(workout.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Workout Modal */}
      {editingWorkout && (
        <WorkoutEditModal
          workout={editingWorkout}
          isOpen={true}
          onClose={() => setEditingWorkout(null)}
          onSave={(updated) => onUpdateWorkout(updated)}
          workoutHistory={workouts}
        />
      )}

      {/* Machine / Exercise Detail Modal */}
      {selectedDetailExercise && (
        <ErrorBoundary onReset={() => setSelectedDetailExercise(null)}>
          <ExerciseDetailModal
            exercise={selectedDetailExercise}
            isOpen={true}
            onClose={() => setSelectedDetailExercise(null)}
            workoutHistory={workouts}
          />
        </ErrorBoundary>
      )}

    </div>
  );
};
