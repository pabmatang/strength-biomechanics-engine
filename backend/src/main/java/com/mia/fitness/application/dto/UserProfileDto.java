package com.mia.fitness.application.dto;

import com.mia.fitness.domain.model.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Perfil público del usuario autenticado")
public record UserProfileDto(
        UUID id,
        String username,
        String email,
        String goal,
        String role,
        Instant createdAt
) {
    public static UserProfileDto from(User user) {
        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getGoal(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
