package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Proyección de respuesta de un Workout almacenado, incluyendo
 * métricas computadas (volumen total, series completadas, duración).
 */
@Schema(description = "Respuesta completa de un entrenamiento registrado")
public record WorkoutResponse(
        UUID id,
        String userId,
        String title,
        String description,
        Instant startTime,
        Instant endTime,
        Long durationSeconds,
        Double totalVolumeKg,
        Integer completedSetsCount,
        List<ExerciseResponse> exercises
) {
    public record ExerciseResponse(
            UUID id,
            String exerciseTemplateId,
            String title,
            String brand,
            String muscleGroup,
            List<SetResponse> sets
    ) {}

    public record SetResponse(
            UUID id,
            Integer setIndex,
            String setType,
            java.math.BigDecimal weightKg,
            Integer reps,
            java.math.BigDecimal rpe,
            Boolean isCompleted
    ) {}
}
