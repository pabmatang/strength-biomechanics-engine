package com.mia.fitness.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubstitutionRequestDto(
    @NotBlank @Size(max = 200) String currentExercise,
    @NotBlank @Size(max = 500) String jointDiscomfort,   // e.g. "Molestia en hombro anterior" or "Compresión lumbar L4-L5"
    @Size(max = 50) String targetMuscle                  // Optional filter, e.g. "chest"
) {}
