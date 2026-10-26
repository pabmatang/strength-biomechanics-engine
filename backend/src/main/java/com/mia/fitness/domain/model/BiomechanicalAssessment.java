package com.mia.fitness.domain.model;

/**
 * Sealed hierarchy demonstrating Java 21 exhaustive pattern matching and record deconstruction.
 */
public sealed interface BiomechanicalAssessment permits
        BiomechanicalAssessment.OptimalHypertrophy,
        BiomechanicalAssessment.AxialFatigueRisk,
        BiomechanicalAssessment.JointStressWarning,
        BiomechanicalAssessment.PlateauDetected {

    record OptimalHypertrophy(
            String targetMuscle,
            int effectiveWeeklySets,
            double mechanicalTonnageKg
    ) implements BiomechanicalAssessment {}

    record AxialFatigueRisk(
            String exerciseName,
            double axialLoadingFactor,
            String correctiveRecommendation
    ) implements BiomechanicalAssessment {}

    record JointStressWarning(
            String anatomicalJoint,
            String restrictedMovementPlane,
            String recommendedSubstituteMachine
    ) implements BiomechanicalAssessment {}

    record PlateauDetected(
            String exerciseName,
            int consecutiveStagnantWeeks,
            double recommendedDeloadPercentage
    ) implements BiomechanicalAssessment {}
}
