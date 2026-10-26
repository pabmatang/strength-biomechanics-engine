package com.mia.fitness.application.service;

import com.mia.fitness.domain.model.BiomechanicalAssessment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import static org.assertj.core.api.Assertions.assertThat;

class BiomechanicalAssessmentServiceTest {

    private BiomechanicalAssessmentService assessmentService;

    @BeforeEach
    void setUp() {
        assessmentService = new BiomechanicalAssessmentService();
    }

    @Test
    @DisplayName("Java 21 Pattern Matching: Procesa caso OptimalHypertrophy correctamente")
    void shouldEvaluateOptimalHypertrophyUsingPatternMatching() {
        var assessment = new BiomechanicalAssessment.OptimalHypertrophy("chest", 14, 4520.5);

        String result = assessmentService.formulateActionPlan(assessment);

        assertThat(result)
                .contains("CHEST")
                .contains("14 series efectivas")
                .contains("4520.5 kg");
    }

    @Test
    @DisplayName("Java 21 Pattern Matching: Procesa caso AxialFatigueRisk y prescribe recomendación")
    void shouldEvaluateAxialFatigueRisk() {
        var assessment = new BiomechanicalAssessment.AxialFatigueRisk(
                "Barbell Back Squat",
                0.88,
                "Sustituir por Pendulum Squat o Hack Squat guiado"
        );

        String result = assessmentService.formulateActionPlan(assessment);

        assertThat(result)
                .contains("Barbell Back Squat")
                .contains("0.88")
                .contains("Pendulum Squat");
    }

    @Test
    @DisplayName("Java 21 Pattern Matching: Procesa caso JointStressWarning")
    void shouldEvaluateJointStressWarning() {
        var assessment = new BiomechanicalAssessment.JointStressWarning(
                "Glenohumeral Anterior",
                "Horizontal Abduction",
                "Technogym Pure Strength Chest Press"
        );

        String result = assessmentService.formulateActionPlan(assessment);

        assertThat(result)
                .contains("Glenohumeral Anterior")
                .contains("Technogym Pure Strength Chest Press");
    }

    @Test
    @DisplayName("Java 21 Virtual Threads: Ejecuta evaluación asíncrona concurrentemente")
    void shouldEvaluateAsyncUsingVirtualThreads() throws ExecutionException, InterruptedException {
        var assessment = new BiomechanicalAssessment.PlateauDetected("Overhead Press", 4, 0.15);

        CompletableFuture<String> future = assessmentService.evaluateAsync(assessment);
        String plan = future.get();

        assertThat(plan)
                .contains("Overhead Press")
                .contains("4 semanas consecutivas")
                .contains("15%");
    }
}
