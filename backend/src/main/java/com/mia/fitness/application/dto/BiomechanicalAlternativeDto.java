package com.mia.fitness.application.dto;

public record BiomechanicalAlternativeDto(
    String id,
    String name,
    String brand,
    String targetMuscle,
    String movementPlane,
    String jointStressAvoided,
    boolean axialLoading,
    double similarityScore,
    String biomechanicalRationale
) {}
