package com.mia.fitness.application.service;

import com.mia.fitness.domain.model.BiomechanicalAssessment;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class BiomechanicalAssessmentService {

    // Java 21 Virtual Thread Per Task Executor for high-throughput concurrent biomechanical analysis
    private final ExecutorService virtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();

    /**
     * Demonstrates Java 21 Pattern Matching for switch with Record Deconstruction Patterns (JEP 440 & JEP 441).
     * Provides compiler-enforced exhaustiveness without needing a default branch.
     */
    public String formulateActionPlan(BiomechanicalAssessment assessment) {
        return switch (assessment) {
            case BiomechanicalAssessment.OptimalHypertrophy(var muscle, var sets, var tonnage) ->
                    "Progreso óptimo en %s: %d series efectivas completadas con tonelaje acumulado de %.1f kg. Mantener tasa de sobrecarga.".formatted(
                            muscle.toUpperCase(), sets, tonnage);

            case BiomechanicalAssessment.AxialFatigueRisk(var exercise, var factor, var recommendation) ->
                    "Alerta de fatiga en columna axial para '%s' (Índice de compresión: %.2f). %s".formatted(
                            exercise, factor, recommendation);

            case BiomechanicalAssessment.JointStressWarning(var joint, var plane, var substitute) ->
                    "Cizallamiento detectado en %s (Plano: %s). Reemplazo biomecánico prescrito: %s.".formatted(
                            joint, plane, substitute);

            case BiomechanicalAssessment.PlateauDetected(var exercise, var weeks, var deload) ->
                    "Estancamiento hipertrófico en '%s' tras %d semanas consecutivas. Aplicar microciclo de descarga del %.0f%%.".formatted(
                            exercise, weeks, deload * 100);
        };
    }

    /**
     * Executes asynchronous batch assessment using Java 21 Virtual Threads.
     */
    public CompletableFuture<String> evaluateAsync(BiomechanicalAssessment assessment) {
        return CompletableFuture.supplyAsync(() -> formulateActionPlan(assessment), virtualThreadExecutor);
    }
}
