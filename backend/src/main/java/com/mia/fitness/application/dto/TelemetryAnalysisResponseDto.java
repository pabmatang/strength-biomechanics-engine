package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.UUID;

@Schema(description = "Evaluación biomecánica procesada por el servidor a partir de la telemetría del vídeo")
public record TelemetryAnalysisResponseDto(
        UUID analysisId,
        String status, // "EXCELLENT", "MODERATE_FATIGUE", "CRITICAL_ADJUSTMENT"
        int totalReps,
        int validReps,
        double efficiencyPercentage,
        double averageRangeOfMotionDegrees,
        String biomechanicalPrescription,
        List<String> keyActionPoints
) {}
