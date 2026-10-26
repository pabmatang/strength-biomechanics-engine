package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.CreateWorkoutRequest;
import com.mia.fitness.application.dto.PlateauAlertDto;
import com.mia.fitness.application.dto.WeeklyVolumeSummaryDto;
import com.mia.fitness.application.dto.WorkoutResponse;
import com.mia.fitness.domain.exception.ResourceNotFoundException;
import com.mia.fitness.domain.model.Workout;
import com.mia.fitness.domain.model.WorkoutExercise;
import com.mia.fitness.domain.model.WorkoutSet;
import com.mia.fitness.infrastructure.persistence.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Servicio transaccional que gestiona el ciclo de vida de los entrenamientos
 * (creación, consulta e integración con el motor de Sobrecarga Progresiva).
 */
@Service
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final ProgressiveOverloadService overloadService;

    public WorkoutService(WorkoutRepository workoutRepository, ProgressiveOverloadService overloadService) {
        this.workoutRepository = workoutRepository;
        this.overloadService = overloadService;
    }

    /**
     * Persiste un entrenamiento completo con su jerarquía de ejercicios y series,
     * computando métricas derivadas (volumen total, series completadas, duración).
     */
    @Transactional
    public WorkoutResponse createWorkout(String userId, CreateWorkoutRequest request) {
        Workout workout = Workout.builder()
                .userId(userId)
                .title(request.title())
                .description(request.description())
                .startTime(Instant.now())
                .build();

        int totalSets = 0;
        double totalVolume = 0.0;

        for (int i = 0; i < request.exercises().size(); i++) {
            CreateWorkoutRequest.ExerciseEntry entry = request.exercises().get(i);

            WorkoutExercise exercise = WorkoutExercise.builder()
                    .exerciseTemplateId(entry.exerciseTemplateId())
                    .title(entry.title())
                    .brand(entry.brand())
                    .muscleGroup(entry.muscleGroup())
                    .equipmentCategory(entry.equipmentCategory())
                    .build();

            for (int j = 0; j < entry.sets().size(); j++) {
                CreateWorkoutRequest.SetEntry setEntry = entry.sets().get(j);

                WorkoutSet workoutSet = WorkoutSet.builder()
                        .setIndex(j + 1)
                        .setType(setEntry.setType())
                        .weightKg(setEntry.weightKg())
                        .reps(setEntry.reps())
                        .rpe(setEntry.rpe())
                        .isCompleted(setEntry.completed())
                        .build();

                exercise.addSet(workoutSet);

                if (Boolean.TRUE.equals(setEntry.completed()) && setEntry.weightKg() != null && setEntry.reps() != null) {
                    totalVolume += setEntry.weightKg().doubleValue() * setEntry.reps();
                    totalSets++;
                }
            }

            workout.addExercise(exercise);
        }

        workout.setEndTime(Instant.now());
        workout.setDurationSeconds(0L);
        workout.setTotalVolumeKg(totalVolume);
        workout.setCompletedSetsCount(totalSets);

        Workout saved = workoutRepository.save(workout);
        return toResponse(saved);
    }

    /**
     * Recupera un entrenamiento por su identificador, comprobando que pertenece
     * al usuario autenticado para no filtrar datos de otras cuentas.
     */
    @Transactional(readOnly = true)
    public WorkoutResponse getWorkoutById(String userId, UUID workoutId) {
        Workout workout = workoutRepository.findByIdAndUserId(workoutId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workout", "id", workoutId));
        return toResponse(workout);
    }

    /**
     * Devuelve el historial de entrenamientos de un usuario ordenados cronológicamente.
     */
    @Transactional(readOnly = true)
    public List<WorkoutResponse> getUserWorkouts(String userId) {
        return workoutRepository.findByUserIdOrderByStartTimeDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Calcula el volumen semanal efectivo agrupado por grupo muscular
     * usando los entrenamientos de los últimos 7 días.
     */
    @Transactional(readOnly = true)
    public WeeklyVolumeSummaryDto getWeeklyVolume(String userId) {
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Workout> recentWorkouts = workoutRepository.findRecentWithDetails(userId, oneWeekAgo);
        return overloadService.calculateWeeklyVolume(userId, recentWorkouts);
    }

    /**
     * Detecta estancamiento hipertrófico de un ejercicio específico
     * sobre una ventana de 4 semanas de datos.
     */
    @Transactional(readOnly = true)
    public PlateauAlertDto detectPlateau(String userId, String exerciseTemplateId, String exerciseTitle) {
        Instant fourWeeksAgo = Instant.now().minus(28, ChronoUnit.DAYS);
        List<Workout> workouts = workoutRepository.findRecentWithDetails(userId, fourWeeksAgo);
        return overloadService.detectPlateau(exerciseTemplateId, exerciseTitle, workouts);
    }

    // ──────────────────────────────────────────────────────────────
    // Mapper privado: Entidad -> DTO de respuesta (sin dependencia externa)
    // ──────────────────────────────────────────────────────────────

    private WorkoutResponse toResponse(Workout workout) {
        List<WorkoutResponse.ExerciseResponse> exerciseResponses = workout.getExercises().stream()
                .map(ex -> new WorkoutResponse.ExerciseResponse(
                        ex.getId(),
                        ex.getExerciseTemplateId(),
                        ex.getTitle(),
                        ex.getBrand(),
                        ex.getMuscleGroup(),
                        ex.getSets().stream()
                                .map(s -> new WorkoutResponse.SetResponse(
                                        s.getId(),
                                        s.getSetIndex(),
                                        s.getSetType(),
                                        s.getWeightKg(),
                                        s.getReps(),
                                        s.getRpe(),
                                        s.getIsCompleted()
                                ))
                                .toList()
                ))
                .toList();

        return new WorkoutResponse(
                workout.getId(),
                workout.getUserId(),
                workout.getTitle(),
                workout.getDescription(),
                workout.getStartTime(),
                workout.getEndTime(),
                workout.getDurationSeconds(),
                workout.getTotalVolumeKg(),
                workout.getCompletedSetsCount(),
                exerciseResponses
        );
    }
}
