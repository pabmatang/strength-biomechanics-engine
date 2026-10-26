package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para la creación de un entrenamiento completo (Workout + Exercises + Sets).
 * Utiliza Java 21 Records anidados para modelar la jerarquía de forma inmutable.
 */
@Schema(description = "Payload para registrar un entrenamiento completo con ejercicios y series")
public record CreateWorkoutRequest(

        @Schema(description = "Título descriptivo del entrenamiento", example = "Push Day – Pecho y Hombro")
        @NotBlank(message = "El título del entrenamiento es obligatorio")
        @Size(max = 255, message = "El título no puede superar 255 caracteres")
        String title,

        @Schema(description = "Descripción opcional del entrenamiento")
        String description,

        @Schema(description = "Lista de ejercicios realizados en la sesión")
        @NotEmpty(message = "Debe incluir al menos un ejercicio")
        @Valid
        List<ExerciseEntry> exercises
) {
    @Schema(description = "Ejercicio individual dentro de un entrenamiento")
    public record ExerciseEntry(

            @Schema(description = "ID de la plantilla del ejercicio", example = "technogym_chest_press")
            @NotBlank @Size(max = 255) String exerciseTemplateId,

            @Schema(description = "Nombre visible del ejercicio", example = "Technogym Pure Strength Chest Press")
            @NotBlank @Size(max = 255) String title,

            @Schema(description = "Marca del equipamiento", example = "Technogym")
            @Size(max = 255) String brand,

            @Schema(description = "Grupo muscular principal", example = "chest")
            @NotBlank @Size(max = 100) String muscleGroup,

            @Schema(description = "Categoría del equipamiento", example = "plate_loaded")
            @Size(max = 100) String equipmentCategory,

            @Schema(description = "Series realizadas en este ejercicio")
            @NotEmpty(message = "Debe incluir al menos una serie")
            @Valid
            List<SetEntry> sets
    ) {}

    @Schema(description = "Serie individual dentro de un ejercicio")
    public record SetEntry(

            @Schema(description = "Tipo de serie", example = "normal")
            @NotBlank @Size(max = 30) String setType,

            @Schema(description = "Peso utilizado en kg", example = "100.0")
            @DecimalMin(value = "0.0", message = "El peso no puede ser negativo")
            @DecimalMax(value = "9999.99", message = "El peso no puede superar 9999.99 kg")
            BigDecimal weightKg,

            @Schema(description = "Repeticiones completadas", example = "8")
            @NotNull(message = "Las repeticiones son obligatorias")
            @Positive(message = "Las repeticiones deben ser mayores que cero")
            Integer reps,

            @Schema(description = "RPE (Rating of Perceived Exertion)", example = "8.5")
            @DecimalMin(value = "1.0", message = "El RPE mínimo es 1.0")
            @DecimalMax(value = "10.0", message = "El RPE máximo es 10.0")
            BigDecimal rpe,

            @Schema(description = "Si la serie fue completada", example = "true")
            @NotNull Boolean completed
    ) {}
}
