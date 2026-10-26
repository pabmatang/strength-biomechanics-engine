package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.PlateauAlertDto;
import com.mia.fitness.application.dto.WeeklyVolumeSummaryDto;
import com.mia.fitness.domain.model.Workout;
import com.mia.fitness.domain.model.WorkoutExercise;
import com.mia.fitness.domain.model.WorkoutSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProgressiveOverloadServiceTest {

    private ProgressiveOverloadService overloadService;

    @BeforeEach
    void setUp() {
        overloadService = new ProgressiveOverloadService();
    }

    @Test
    @DisplayName("Computa series efectivas y tonelaje por grupo muscular, excluyendo calentamiento")
    void shouldCalculateWeeklyVolumeAccurately() {
        Workout workout = new Workout();
        workout.setUserId("user_test");
        workout.setStartTime(Instant.parse("2026-10-21T10:00:00Z"));

        WorkoutExercise exercise = new WorkoutExercise();
        exercise.setMuscleGroup("chest");
        exercise.setExerciseTemplateId("bench_press_id");
        exercise.setTitle("Press Banca");

        WorkoutSet set1 = completedSet(1, "100.0", 8, "8.0");
        WorkoutSet set2 = completedSet(2, "100.0", 8, "9.0");

        WorkoutSet warmupSet = new WorkoutSet();
        warmupSet.setSetIndex(0);
        warmupSet.setIsCompleted(true);
        warmupSet.setSetType("warmup");
        warmupSet.setWeightKg(new BigDecimal("50.0"));
        warmupSet.setReps(10);

        exercise.setSets(List.of(set1, set2, warmupSet));
        workout.setExercises(List.of(exercise));

        WeeklyVolumeSummaryDto summary = overloadService.calculateWeeklyVolume("user_test", List.of(workout));

        assertThat(summary.userId()).isEqualTo("user_test");
        assertThat(summary.effectiveSetsByMuscle().get("chest")).isEqualTo(2);
        assertThat(summary.tonnageByMuscle().get("chest")).isEqualTo(1600.0);
        assertThat(summary.volumeStatus()).isEqualTo("UNDER_TRAINED_MEV");
        assertThat(summary.weekNumber()).isBetween(1, 53);
        assertThat(summary.year()).isEqualTo(2026);
    }

    @Test
    @DisplayName("Detecta estancamiento cuando el tonelaje no crece en 4 semanas")
    void shouldDetectPlateauWhenTonnageDoesNotIncrease() {
        PlateauAlertDto alert = overloadService.detectPlateau(
                "bench_press_id",
                "Press Banca con Mancuernas",
                weeklyWorkouts(List.of(30.0, 30.0, 30.0, 30.0))
        );

        assertThat(alert.exerciseTemplateId()).isEqualTo("bench_press_id");
        assertThat(alert.isStagnated()).isTrue();
        assertThat(alert.suggestedAction()).contains("DELOAD_WEEK");
        assertThat(alert.rationale()).contains("Estancamiento");
    }

    @Test
    @DisplayName("No marca estancamiento con sobrecarga progresiva real")
    void shouldNotDetectPlateauWhenLoadProgresses() {
        PlateauAlertDto alert = overloadService.detectPlateau(
                "bench_press_id",
                "Press Banca con Mancuernas",
                weeklyWorkouts(List.of(30.0, 32.5, 35.0, 37.5))
        );

        assertThat(alert.isStagnated()).isFalse();
        assertThat(alert.suggestedAction()).isEqualTo("CONTINUE_PROGRESSION");
    }

    @Test
    @DisplayName("Con menos de 4 semanas de datos no prescribe deload")
    void shouldRequireAtLeastFourWeeks() {
        PlateauAlertDto alert = overloadService.detectPlateau(
                "bench_press_id",
                "Press Banca con Mancuernas",
                weeklyWorkouts(List.of(30.0, 30.0))
        );

        assertThat(alert.isStagnated()).isFalse();
        assertThat(alert.rationale()).contains("Datos insuficientes");
    }

    private WorkoutSet completedSet(int index, String weight, int reps, String rpe) {
        WorkoutSet set = new WorkoutSet();
        set.setSetIndex(index);
        set.setIsCompleted(true);
        set.setSetType("normal");
        set.setWeightKg(new BigDecimal(weight));
        set.setReps(reps);
        set.setRpe(new BigDecimal(rpe));
        return set;
    }

    private List<Workout> weeklyWorkouts(List<Double> weights) {
        Instant baseTime = Instant.now().minus(28, ChronoUnit.DAYS);
        List<Workout> workouts = new ArrayList<>();

        for (int i = 0; i < weights.size(); i++) {
            Workout workout = new Workout();
            workout.setUserId("user_test");
            workout.setStartTime(baseTime.plus(i * 7L, ChronoUnit.DAYS));

            WorkoutExercise we = new WorkoutExercise();
            we.setExerciseTemplateId("bench_press_id");
            we.setTitle("Press Banca con Mancuernas");
            we.setMuscleGroup("chest");
            we.setSets(List.of(completedSet(1, String.valueOf(weights.get(i)), 10, "8.5")));

            workout.setExercises(List.of(we));
            workouts.add(workout);
        }
        return workouts;
    }
}
