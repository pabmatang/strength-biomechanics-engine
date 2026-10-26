package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud de registro de nuevo usuario")
public record RegisterRequest(
        @Schema(description = "Nombre de usuario", example = "pablo_coach")
        @NotBlank(message = "El username es obligatorio")
        @Size(min = 3, max = 50)
        String username,

        @Schema(description = "Correo electrónico", example = "pablo@strength-lab.io")
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Formato de email inválido")
        String email,

        @Schema(description = "Contraseña segura", example = "StrongBioPass2026!")
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String password
) {}
