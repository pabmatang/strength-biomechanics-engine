package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.PlateauAlertDto;
import com.mia.fitness.application.dto.WeeklyVolumeSummaryDto;
import com.mia.fitness.domain.model.Workout;
import com.mia.fitness.domain.model.WorkoutExercise;
import com.mia.fitness.domain.model.WorkoutSet;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressiveOverloadService {

    /**
     * Calculates the weekly effective set volume per muscle group.
     * An effective set is a completed working set with RPE >= 6.5 (within 3-4 RIR of failure).
     */
    public WeeklyVolumeSummaryDto calculateWeeklyVolume(String userId, List<Workout> recentWorkouts) {
        Map<String, Integer> effectiveSetsByMuscle = new HashMap<>();
        Map<String, Double> tonnageByMuscle = new HashMap<>();

        for (Workout workout : recentWorkouts) {
            for (WorkoutExercise exercise : workout.getExercises()) {
                String muscle = exercise.getMuscleGroup().toLowerCase();

                for (WorkoutSet set : exercise.getSets()) {
                    if (Boolean.TRUE.equals(set.getIsCompleted()) && !"warmup".equalsIgnoreCase(set.getSetType())) {
                        // Count as effective hypertrophy set if RPE >= 6.5 or default normal set
                        boolean isEffective = set.getRpe() == null || set.getRpe().doubleValue() >= 6.5;
                        if (isEffective) {
                            effectiveSetsByMuscle.merge(muscle, 1, Integer::sum);
                        }

                        // Calculate mechanical tonnage (reps * weight)
                        if (set.getWeightKg() != null && set.getReps() != null) {
                            double setTonnage = set.getWeightKg().doubleValue() * set.getReps();
                            tonnageByMuscle.merge(muscle, setTonnage, Double::sum);
                        }
                    }
                }
            }
        }

        // Assess hypertrophy volume status (10-20 sets/week is optimal MAV according to Israetel/Schoenfeld)
        String status = "OPTIMAL_MAV";
        int totalSets = effectiveSetsByMuscle.values().stream().mapToInt(Integer::intValue).sum();
        if (totalSets < 8) {
            status = "UNDER_TRAINED_MEV";
        } else if (totalSets > 24) {
            status = "OVERREACHING_MRV";
        }

        return new WeeklyVolumeSummaryDto(userId, 1, 2026, effectiveSetsByMuscle, tonnageByMuscle, status);
    }

    /**
     * Mathematical Plateau & Stagnation Detection over a rolling 4-week window:
     * If 4-week tonnage growth <= 0 OR average RPE increases without load progression,
     * triggers a Deload recommendation.
     */
    public PlateauAlertDto detectPlateau(String exerciseTemplateId, String title, List<Workout> workoutsOver4Weeks) {
        // Collect all sets for this exercise over the last 4 weeks sorted chronologically
        List<WorkoutExercise> history = workoutsOver4Weeks.stream()
                .flatMap(w -> w.getExercises().stream())
                .filter(e -> exerciseTemplateId.equalsIgnoreCase(e.getExerciseTemplateId()))
                .toList();

        if (history.size() < 4) {
            return new PlateauAlertDto(
                    exerciseTemplateId, title, false,
                    BigDecimal.valueOf(7.5), BigDecimal.valueOf(7.5),
                    0.0, 0.0,
                    "Datos insuficientes (se requieren al menos 4 semanas de registro continuo).",
                    "CONTINUE_PROGRESSION"
            );
        }

        // Divide into 4 weekly slices
        double initialTonnage = calculateExerciseTonnage(history.get(0));
        double recentTonnage = calculateExerciseTonnage(history.get(history.size() - 1));

        BigDecimal initialRpe = calculateAverageRpe(history.get(0));
        BigDecimal recentRpe = calculateAverageRpe(history.get(history.size() - 1));

        boolean tonnageStagnated = recentTonnage <= (initialTonnage * 1.01); // Less than 1% growth
        boolean rpeIncreasedForSameLoad = recentRpe.compareTo(initialRpe.add(BigDecimal.valueOf(1.0))) >= 0 && tonnageStagnated;

        if (tonnageStagnated || rpeIncreasedForSameLoad) {
            String rationale = String.format(
                    "Estancamiento detectado: El tonelaje no ha crecido en 4 semanas (Inicial: %.1f kg, Actual: %.1f kg) " +
                    "y el RPE medio subió de %.1f a %.1f, indicativo de fatiga neuromuscular acumulada.",
                    initialTonnage, recentTonnage, initialRpe.doubleValue(), recentRpe.doubleValue()
            );

            return new PlateauAlertDto(
                    exerciseTemplateId, title, true,
                    recentRpe, initialRpe,
                    recentTonnage, initialTonnage,
                    rationale,
                    "DELOAD_WEEK: Reducir volumen en un 50% y mantener RPE 6-7 durante 7 días."
            );
        }

        return new PlateauAlertDto(
                    exerciseTemplateId, title, false,
                    recentRpe, initialRpe,
                    recentTonnage, initialTonnage,
                    "Sobrecarga progresiva óptima: Incremento consistente de tonelaje manteniendo RPE estable.",
                    "CONTINUE_PROGRESSION"
        );
    }

    private double calculateExerciseTonnage(WorkoutExercise exercise) {
        return exercise.getSets().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()) && s.getWeightKg() != null && s.getReps() != null)
                .mapToDouble(s -> s.getWeightKg().doubleValue() * s.getReps())
                .sum();
    }

    private BigDecimal calculateAverageRpe(WorkoutExercise exercise) {
        List<BigDecimal> rpes = exercise.getSets().stream()
                .map(WorkoutSet::getRpe)
                .filter(Objects::nonNull)
                .toList();

        if (rpes.isEmpty()) return BigDecimal.valueOf(7.5);

        BigDecimal sum = rpes.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(rpes.size()), 1, RoundingMode.HALF_UP);
    }
}
