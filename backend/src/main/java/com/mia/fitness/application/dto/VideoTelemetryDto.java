package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Payload ligero de telemetría cinemática enviado por el cliente móvil/web tras el análisis
 * por vídeo con estimación de pose en dispositivo (Edge Computing).
 */
@Schema(description = "Telemetría cinemática extraída fotograma a fotograma en el dispositivo móvil")
public record VideoTelemetryDto(
        @Schema(description = "ID del usuario o username", example = "pablo_coach")
        String userId,

        @Schema(description = "Identificador del ejercicio analizado", example = "squat")
        @NotBlank(message = "El exerciseId es obligatorio")
        String exerciseId,

        @Schema(description = "Nombre descriptivo del ejercicio", example = "Sentadilla Libre")
        @NotBlank(message = "El exerciseName es obligatorio")
        String exerciseName,

        @Schema(description = "Duración total de la grabación en segundos", example = "42.5")
        Double videoDurationSeconds,

        @Schema(description = "Dispositivo móvil o procesador neuronal empleado", example = "iPhone 15 Pro (Apple Neural Engine)")
        String hardwareModel,

        @Schema(description = "Métricas agregadas calculadas en dispositivo")
        @NotNull
        MetricsSummary metrics,

        @Schema(description = "Detalle cinemático repetición por repetición")
        @NotEmpty(message = "Debe incluir al menos una repetición analizada")
        List<RepDetail> repsDetail
) {
    public record MetricsSummary(
            int totalRepsCounted,
            int validRepsCount,
            int failedRepsCount,
            double averageRepCadenceSeconds,
            double romConsistencyScore
    ) {}

    public record RepDetail(
            int repIndex,
            boolean isValid,
            double eccentricTimeSeconds,
            double concentricTimeSeconds,
            Double minKneeAngle,
            Double minHipAngle,
            Double minElbowAngle,
            List<FeedbackAlert> feedbackAlerts
    ) {}

    public record FeedbackAlert(
            String ruleId,
            String joint,
            double measuredValue,
            double expectedThreshold,
            String message
    ) {}
}
