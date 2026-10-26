package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credenciales para autenticación JWT")
public record AuthRequest(
        @Schema(description = "Nombre de usuario o email", example = "pablo.mateos@example.com")
        @NotBlank(message = "El nombre de usuario es obligatorio")
        String username,

        @Schema(description = "Contraseña del usuario", example = "Password123!")
        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {}
