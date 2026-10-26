package com.mia.fitness.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de autenticación con Token JWT")
public record AuthResponse(
        @Schema(description = "Token Bearer JWT generado", example = "eyJhbGciOiJIUzI1NiIsIn...")
        String token,

        @Schema(description = "Tipo de token", example = "Bearer")
        String tokenType,

        @Schema(description = "Nombre del usuario autenticado", example = "pablo.mateos")
        String username,

        @Schema(description = "Milisegundos de validez del token", example = "86400000")
        long expiresIn
) {
    public static AuthResponse of(String token, String username, long expiresIn) {
        return new AuthResponse(token, "Bearer", username, expiresIn);
    }
}
