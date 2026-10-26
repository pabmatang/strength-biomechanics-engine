package com.mia.fitness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mia.fitness.infrastructure.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authentication against a real PostgreSQL container: BCrypt hashing,
 * Spring Security, the JWT filter and the JSON error contract.
 */
class AuthFlowIT extends PostgresIntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUsers() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Registro -> login -> /me con el token emitido")
    void shouldRegisterLoginAndReadProfile() throws Exception {
        registerUser();

        String token = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"pablo@strength-lab.io","password":"StrongBioPass2026!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("pablo_coach"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String jwt = objectMapper.readTree(token).get("token").asText();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("pablo_coach"))
                .andExpect(jsonPath("$.email").value("pablo@strength-lab.io"))
                .andExpect(jsonPath("$.goal").value("strength"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    @DisplayName("El login con contraseña incorrecta devuelve 401 y no emite token")
    void shouldRejectWrongPassword() throws Exception {
        registerUser();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"pablo_coach","password":"not-the-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciales incorrectas"))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("Un email duplicado devuelve 409 en lugar de sobrescribir la cuenta")
    void shouldRejectDuplicateEmail() throws Exception {
        registerUser();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"otro_usuario","email":"pablo@strength-lab.io","password":"AnotherPass123!"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya existe una cuenta con este correo electrónico"));

        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Sin token, un endpoint protegido devuelve 401 JSON")
    void shouldRequireTokenForProtectedEndpoints() throws Exception {
        mockMvc.perform(post("/api/v1/biomechanics/substitute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentExercise":"Press banca","jointDiscomfort":"Hombro"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("La validación de entrada devuelve 400 con el detalle del campo")
    void shouldValidateRegistrationPayload() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ab","email":"not-an-email","password":"123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private void registerUser() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"pablo_coach","email":"pablo@strength-lab.io",
                                 "password":"StrongBioPass2026!","goal":"strength"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("pablo_coach"))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("user").get("id").asText()).isNotBlank();
    }
}
