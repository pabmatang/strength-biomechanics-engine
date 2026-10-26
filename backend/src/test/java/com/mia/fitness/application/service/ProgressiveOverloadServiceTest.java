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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ProgressiveOverloadServiceTest {

    private ProgressiveOverloadService overloadService;

    @BeforeEach
    void setUp() {
        overloadService = new ProgressiveOverloadService();
    }

    @Test
    @DisplayName("Debe computar series efectivas y tonelaje por grupo muscular")
    void shouldCalculateWeeklyVolumeAccurately() {
        Workout workout = new Workout();
        workout.setId(UUID.randomUUID());
        workout.setUserId("user_test");

        WorkoutExercise exercise = new WorkoutExercise();
        exercise.setMuscleGroup("chest");

        WorkoutSet set1 = new WorkoutSet();
        set1.setIsCompleted(true);
        set1.setSetType("normal");
        set1.setWeightKg(new BigDecimal("100.0"));
        set1.setReps(8);
        set1.setRpe(new BigDecimal("8.0"));

        WorkoutSet set2 = new WorkoutSet();
        set2.setIsCompleted(true);
        set2.setSetType("normal");
        set2.setWeightKg(new BigDecimal("100.0"));
        set2.setReps(8);
        set2.setRpe(new BigDecimal("9.0"));

        WorkoutSet warmupSet = new WorkoutSet();
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
    }

    @Test
    @DisplayName("Debe detectar estancamiento tras 3 o más semanas consecutivas sin ganancia de tonelaje")
    void shouldDetectPlateauWhenTonnageDoesNotIncrease() {
        List<Workout> stagnantWorkouts = new ArrayList<>();
        Instant baseTime = Instant.now().minus(28, ChronoUnit.DAYS);

        for (int i = 0; i < 4; i++) {
            Workout workout = new Workout();
            workout.setCompletedAt(baseTime.plus(i * 7, ChronoUnit.DAYS));

            WorkoutExercise we = new WorkoutExercise();
            we.setExerciseTemplateId("bench_press_id");
            we.setTitle("Press Banca con Mancuernas");

            WorkoutSet set = new WorkoutSet();
            set.setIsCompleted(true);
            set.setSetType("normal");
            set.setWeightKg(new BigDecimal("30.0"));
            set.setReps(10);
            set.setRpe(new BigDecimal("8.5"));

            we.setSets(List.of(set));
            workout.setExercises(List.of(we));
            stagnantWorkouts.add(workout);
        }

        PlateauAlertDto alert = overloadService.detectPlateau("bench_press_id", "Press Banca con Mancuernas", stagnantWorkouts);

        assertThat(alert.exerciseId()).isEqualTo("bench_press_id");
        assertThat(alert.isPlateau()).isTrue();
        assertThat(alert.recommendation()).isNotBlank();
    }
}
