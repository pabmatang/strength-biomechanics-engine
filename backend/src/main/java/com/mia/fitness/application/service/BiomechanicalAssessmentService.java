package com.mia.fitness.application.service;

import com.mia.fitness.domain.model.BiomechanicalAssessment;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.util.Locale;
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
     *
     * <p>Numbers are formatted with {@link Locale#ROOT} so API responses are deterministic
     * regardless of the server locale (e.g. {@code 4520.5} and never {@code 4520,5}).</p>
     */
    public String formulateActionPlan(BiomechanicalAssessment assessment) {
        return switch (assessment) {
            case BiomechanicalAssessment.OptimalHypertrophy(var muscle, var sets, var tonnage) ->
                    String.format(Locale.ROOT,
                            "Progreso óptimo en %s: %d series efectivas completadas con tonelaje acumulado de %.1f kg. Mantener tasa de sobrecarga.",
                            muscle.toUpperCase(Locale.ROOT), sets, tonnage);

            case BiomechanicalAssessment.AxialFatigueRisk(var exercise, var factor, var recommendation) ->
                    String.format(Locale.ROOT,
                            "Alerta de fatiga en columna axial para '%s' (Índice de compresión: %.2f). %s",
                            exercise, factor, recommendation);

            case BiomechanicalAssessment.JointStressWarning(var joint, var plane, var substitute) ->
                    String.format(Locale.ROOT,
                            "Cizallamiento detectado en %s (Plano: %s). Reemplazo biomecánico prescrito: %s.",
                            joint, plane, substitute);

            case BiomechanicalAssessment.PlateauDetected(var exercise, var weeks, var deload) ->
                    String.format(Locale.ROOT,
                            "Estancamiento hipertrófico en '%s' tras %d semanas consecutivas. Aplicar microciclo de descarga del %.0f%%.",
                            exercise, weeks, deload * 100);
        };
    }

    /**
     * Executes asynchronous batch assessment using Java 21 Virtual Threads.
     */
    public CompletableFuture<String> evaluateAsync(BiomechanicalAssessment assessment) {
        return CompletableFuture.supplyAsync(() -> formulateActionPlan(assessment), virtualThreadExecutor);
    }

    @PreDestroy
    void shutdown() {
        virtualThreadExecutor.shutdown();
    }
}
