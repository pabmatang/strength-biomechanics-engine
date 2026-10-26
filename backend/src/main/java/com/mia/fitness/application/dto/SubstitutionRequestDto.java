package com.mia.fitness.application.dto;

import jakarta.validation.constraints.NotBlank;

public record SubstitutionRequestDto(
    @NotBlank String currentExercise,
    @NotBlank String jointDiscomfort,   // e.g. "Molestia en hombro anterior" or "Compresión lumbar L4-L5"
    String targetMuscle                 // Optional filter, e.g. "chest"
) {}
