package com.mia.fitness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mia.fitness.infrastructure.persistence.UserRepository;
import com.mia.fitness.infrastructure.persistence.WorkoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Workout CRUD and analytics against real PostgreSQL: cascade persistence,
 * weekly volume aggregation (which used to hit MultipleBagFetchException) and
 * ownership checks on GET /workouts/{id}.
 */
class WorkoutFlowIT extends PostgresIntegrationTestBase {

    private static final String PASSWORD = "StrongBioPass2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkoutRepository workoutRepository;

    @BeforeEach
    void cleanDatabase() {
        workoutRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Crea un entrenamiento y lo agrega en volumen semanal sin MultipleBagFetchException")
    void shouldCreateWorkoutAndAggregateWeeklyVolume() throws Exception {
        String token = registerAndGetToken("pablo_coach", "pablo@strength-lab.io");

        String createdBody = mockMvc.perform(post("/api/v1/workouts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(workoutPayload()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exercises.length()").value(2))
                .andExpect(jsonPath("$.exercises[0].sets.length()").value(2))
                .andExpect(jsonPath("$.totalVolumeKg").value(2080.0))
                .andExpect(jsonPath("$.completedSetsCount").value(3))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String workoutId = objectMapper.readTree(createdBody).get("id").asText();

        mockMvc.perform(get("/api/v1/workouts").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].exercises[1].sets[0].reps").value(12));

        mockMvc.perform(get("/api/v1/workouts/{id}", workoutId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(workoutId))
                .andExpect(jsonPath("$.exercises[0].title").value("Technogym Chest Press"));

        mockMvc.perform(get("/api/v1/workouts/analysis/weekly-volume")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveSetsByMuscle.chest").value(2))
                .andExpect(jsonPath("$.effectiveSetsByMuscle.shoulders").value(1))
                .andExpect(jsonPath("$.tonnageByMuscle.chest").value(1600.0))
                .andExpect(jsonPath("$.volumeStatus").value("UNDER_TRAINED_MEV"));
    }

    @Test
    @DisplayName("Un usuario no puede leer el entrenamiento de otra cuenta")
    void shouldNotExposeAnotherUsersWorkout() throws Exception {
        String ownerToken = registerAndGetToken("pablo_coach", "pablo@strength-lab.io");

        String createdBody = mockMvc.perform(post("/api/v1/workouts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(workoutPayload()))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode created = objectMapper.readTree(createdBody);
        String workoutId = created.get("id").asText();

        String otherToken = registerAndGetToken("otro_atleta", "otro@strength-lab.io");

        mockMvc.perform(get("/api/v1/workouts/{id}", workoutId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("La detección de estancamiento exige exerciseTemplateId y devuelve 400 si falta")
    void shouldValidatePlateauParameters() throws Exception {
        String token = registerAndGetToken("pablo_coach", "pablo@strength-lab.io");

        mockMvc.perform(get("/api/v1/workouts/analysis/plateau-detection")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Falta el parámetro obligatorio: exerciseTemplateId"));

        mockMvc.perform(get("/api/v1/workouts/analysis/plateau-detection")
                        .param("exerciseTemplateId", "technogym_chest_press")
                        .param("exerciseTitle", "Technogym Chest Press")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isStagnated").value(false))
                .andExpect(jsonPath("$.suggestedAction").value("CONTINUE_PROGRESSION"));
    }

    @Test
    @DisplayName("Un JSON mal formado devuelve 400, no un 500 genérico")
    void shouldRejectMalformedJsonWithBadRequest() throws Exception {
        String token = registerAndGetToken("pablo_coach", "pablo@strength-lab.io");

        mockMvc.perform(post("/api/v1/workouts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("Una serie con repeticiones no positivas o RPE fuera de rango devuelve 400")
    void shouldRejectInvalidSetValues() throws Exception {
        String token = registerAndGetToken("pablo_coach", "pablo@strength-lab.io");

        String invalidSet = """
                {
                  "title": "Push Day",
                  "exercises": [
                    {
                      "exerciseTemplateId": "bench_press",
                      "title": "Bench Press",
                      "muscleGroup": "chest",
                      "sets": [
                        {"setType": "normal", "weightKg": 80.0, "reps": 0, "rpe": 12.0, "completed": true}
                      ]
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/v1/workouts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidSet))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private String registerAndGetToken(String username, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","email":"%s","password":"%s","goal":"strength"}
                                """.formatted(username, email, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private String workoutPayload() {
        return """
                {
                  "title": "Push Day",
                  "description": "Pecho y hombro",
                  "exercises": [
                    {
                      "exerciseTemplateId": "technogym_chest_press",
                      "title": "Technogym Chest Press",
                      "brand": "Technogym",
                      "muscleGroup": "chest",
                      "equipmentCategory": "machine",
                      "sets": [
                        {"setType": "normal", "weightKg": 80.0, "reps": 10, "rpe": 8.5, "completed": true},
                        {"setType": "normal", "weightKg": 80.0, "reps": 10, "rpe": 9.0, "completed": true}
                      ]
                    },
                    {
                      "exerciseTemplateId": "shoulder_press",
                      "title": "Shoulder Press",
                      "brand": "Technogym",
                      "muscleGroup": "shoulders",
                      "equipmentCategory": "machine",
                      "sets": [
                        {"setType": "normal", "weightKg": 40.0, "reps": 12, "rpe": 8.0, "completed": true}
                      ]
                    }
                  ]
                }
                """;
    }
}
