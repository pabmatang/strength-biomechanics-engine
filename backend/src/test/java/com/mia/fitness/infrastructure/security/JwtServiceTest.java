package com.mia.fitness.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", testSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    @DisplayName("Debe generar token válido y extraer claims correctamente")
    void shouldGenerateAndExtractTokenCorrectly() {
        String username = "pablo_engineer";
        Map<String, Object> claims = Map.of("role", "ROLE_ADMIN", "tier", "PRO");

        String token = jwtService.generateToken(username, claims);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo(username);
        assertThat(jwtService.isTokenValid(token, username)).isTrue();
    }

    @Test
    @DisplayName("Debe invalidar token si el username no coincide")
    void shouldInvalidateTokenForMismatchingUsername() {
        String token = jwtService.generateToken("alice", Map.of());

        assertThat(jwtService.isTokenValid(token, "bob")).isFalse();
    }
}
