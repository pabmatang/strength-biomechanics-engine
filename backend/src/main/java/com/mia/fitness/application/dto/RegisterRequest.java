package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud de registro de nuevo usuario")
public record RegisterRequest(
        @Schema(description = "Nombre de usuario visible", example = "pablo_coach")
        @NotBlank(message = "El username es obligatorio")
        @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
        String username,

        @Schema(description = "Correo electrónico", example = "pablo@strength-lab.io")
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Formato de email inválido")
        String email,

        @Schema(description = "Contraseña segura", example = "StrongBioPass2026!")
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres")
        String password,

        @Schema(description = "Objetivo de entrenamiento", example = "hypertrophy")
        @Pattern(
                regexp = "hypertrophy|fat_loss|strength|recomposition",
                message = "El objetivo debe ser hypertrophy, fat_loss, strength o recomposition"
        )
        String goal
) {
    public String goalOrDefault() {
        return goal == null || goal.isBlank() ? "hypertrophy" : goal;
    }
}
