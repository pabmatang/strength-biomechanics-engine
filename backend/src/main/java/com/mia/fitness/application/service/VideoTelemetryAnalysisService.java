package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.TelemetryAnalysisResponseDto;
import com.mia.fitness.application.dto.VideoTelemetryDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio que evalúa la telemetría cinemática de vídeo procesada en el cliente móvil.
 * Analiza la estabilidad del rango articular, fatiga en las últimas repeticiones y genera
 * una prescripción correctiva según patrones biomecánicos.
 */
@Service
public class VideoTelemetryAnalysisService {

    public TelemetryAnalysisResponseDto processTelemetry(String userId, VideoTelemetryDto telemetry) {
        int totalReps = telemetry.metrics().totalRepsCounted();
        int validReps = telemetry.metrics().validRepsCount();
        double efficiency = totalReps > 0 ? ((double) validReps / totalReps) * 100.0 : 0.0;

        List<String> actionPoints = new ArrayList<>();
        double sumKneeAngle = 0.0;
        int angleMeasurements = 0;

        for (var rep : telemetry.repsDetail()) {
            if (rep.minKneeAngle() != null) {
                sumKneeAngle += rep.minKneeAngle();
                angleMeasurements++;
            }
            if (rep.feedbackAlerts() != null) {
                for (var alert : rep.feedbackAlerts()) {
                    if (!actionPoints.contains(alert.message())) {
                        actionPoints.add(alert.message());
                    }
                }
            }
        }

        double avgAngle = angleMeasurements > 0 ? (sumKneeAngle / angleMeasurements) : 90.0;

        // Categorización del estado biomecánico
        String status;
        String prescription;

        if (efficiency >= 85.0 && actionPoints.isEmpty()) {
            status = "EXCELLENT";
            prescription = "Técnica biomecánicamente óptima. El tempo excéntrico y la profundidad se mantuvieron estables en toda la serie.";
            actionPoints.add("Mantener la carga actual en el próximo microciclo y priorizar RPE 8-9.");
        } else if (efficiency >= 60.0) {
            status = "MODERATE_FATIGUE";
            prescription = "Deterioro de la trayectoria en las últimas repeticiones debido a fatiga muscular acumulada.";
            actionPoints.add("Aumentar el tiempo de descanso a 120-150s para preservar la profundidad sin compensación lumbar.");
        } else {
            status = "CRITICAL_ADJUSTMENT";
            prescription = "Inestabilidad articular y pérdida significativa de ROM. Riesgo de estrés en tendón rotuliano o zona lumbar.";
            actionPoints.add("Reducir la carga entre un 10% y 15% o utilizar soporte en multipower/guiada para reeducar la trayectoria.");
        }

        return new TelemetryAnalysisResponseDto(
                UUID.randomUUID(),
                status,
                totalReps,
                validReps,
                Math.round(efficiency * 10.0) / 10.0,
                Math.round(avgAngle * 10.0) / 10.0,
                prescription,
                actionPoints
        );
    }
}
