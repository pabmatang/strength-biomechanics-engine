package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.TelemetryAnalysisResponseDto;
import com.mia.fitness.application.dto.VideoTelemetryDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio que evalúa la telemetría cinemática de vídeo procesada con IA en el cliente.
 * Analiza la estabilidad del rango articular, fatiga en las últimas repeticiones y genera
 * una prescripción correctiva según patrones biomecánicos (Espalda, Bíceps, Tríceps, Femoral/RDL, Pecho, Sentadilla).
 */
@Service
public class VideoTelemetryAnalysisService {

    public TelemetryAnalysisResponseDto processTelemetry(String userId, VideoTelemetryDto telemetry) {
        int totalReps = telemetry.metrics().totalRepsCounted();
        int validReps = telemetry.metrics().validRepsCount();
        double efficiency = totalReps > 0 ? ((double) validReps / totalReps) * 100.0 : 0.0;

        List<String> actionPoints = new ArrayList<>();
        double sumAngle = 0.0;
        int angleMeasurements = 0;

        String exerciseId = telemetry.exerciseId() != null ? telemetry.exerciseId().toLowerCase() : "";

        for (var rep : telemetry.repsDetail()) {
            Double jointAngle = rep.minElbowAngle();
            if (jointAngle == null || exerciseId.contains("squat") || exerciseId.contains("leg_press")) {
                jointAngle = rep.minKneeAngle();
            }
            if (jointAngle == null || exerciseId.contains("rdl") || exerciseId.contains("deadlift")) {
                jointAngle = rep.minHipAngle() != null ? rep.minHipAngle() : jointAngle;
            }

            if (jointAngle != null) {
                sumAngle += jointAngle;
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

        double avgAngle = angleMeasurements > 0 ? (sumAngle / angleMeasurements) : 90.0;

        // Categorización del estado biomecánico
        String status;
        String prescription;

        if (efficiency >= 80.0 && actionPoints.isEmpty()) {
            status = "EXCELLENT";
            if (exerciseId.contains("lat") || exerciseId.contains("pull") || exerciseId.contains("row") || exerciseId.contains("espalda")) {
                prescription = "Excelente activación de dorsal ancho y trapecios. Los codos bajaron en su plano anatómico óptimo hacia el ilíaco sin balanceo de columna.";
                actionPoints.add("Mantén el agarre neutro o con correas para maximizar la conexión mente-músculo en el dorsal sin fatiga de antebrazos.");
            } else if (exerciseId.contains("bicep") || exerciseId.contains("curl")) {
                prescription = "Aislamiento de bíceps impecable. Codos firmes a los costados con máxima contracción concéntrica sin trampeo de deltoides.";
                actionPoints.add("Aplica una pausa isométrica de 1 segundo en el punto de máxima flexión para sobrecargar la cabeza larga.");
            } else if (exerciseId.contains("tricep") || exerciseId.contains("extension")) {
                prescription = "Bloqueo completo de tríceps en todo el rango. Extensión terminal lograda sin apertura indeseada de codos.";
                actionPoints.add("Controla la fase excéntrica a 3 segundos para sobrecargar el estiramiento de la cabeza larga.");
            } else if (exerciseId.contains("rdl") || exerciseId.contains("deadlift") || exerciseId.contains("femoral")) {
                prescription = "Bisagra de cadera (Hip Hinge) biomecánicamente perfecta. Semiflexión de rodilla estable protegiendo la zona lumbar y estirando los isquiosurales.";
                actionPoints.add("Mantén la barra pegada a las espinillas/muslos para recortar el brazo de momento lumbar.");
            } else {
                prescription = "Técnica biomecánicamente óptima. El tempo excéntrico y la profundidad articular se mantuvieron estables en toda la serie.";
                actionPoints.add("Mantener la carga actual en el próximo microciclo y priorizar RPE 8-9.");
            }
        } else if (efficiency >= 55.0) {
            status = "MODERATE_FATIGUE";
            if (exerciseId.contains("rdl") || exerciseId.contains("deadlift")) {
                prescription = "Ligera pérdida de la bisagra de cadera al final de la serie con tendencia a doblar las rodillas como sentadilla.";
                actionPoints.add("Fija las rodillas a 15-20° de semiflexión y enfoca todo el movimiento en desplazar la pelvis hacia atrás.");
            } else if (exerciseId.contains("lat") || exerciseId.contains("row") || exerciseId.contains("pull")) {
                prescription = "Deterioro de la trayectoria en las últimas repeticiones por fatiga, provocando balanceo del torso hacia atrás.";
                actionPoints.add("Reduce un 10% el peso o ajusta el cojín de muslos de la máquina Technogym para anclar la pelvis.");
            } else {
                prescription = "Deterioro de la trayectoria en las últimas repeticiones debido a fatiga neuromuscular acumulada.";
                actionPoints.add("Aumentar el tiempo de descanso a 120-150s para preservar el rango completo sin compensaciones.");
            }
        } else {
            status = "CRITICAL_ADJUSTMENT";
            prescription = "Inestabilidad articular y pérdida significativa de ROM. Riesgo de estrés en articulaciones y tendones.";
            actionPoints.add("Reducir la carga entre un 15% y 20% para reaprender el patrón motor con rango completo estricto.");
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
