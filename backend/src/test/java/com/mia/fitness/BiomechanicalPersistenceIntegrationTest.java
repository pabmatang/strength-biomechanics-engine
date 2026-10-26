package com.mia.fitness;

import com.mia.fitness.domain.model.BiomechanicalExercise;
import com.mia.fitness.infrastructure.persistence.BiomechanicalExerciseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class BiomechanicalPersistenceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgresWithVector = new PostgreSQLContainer<>(
            DockerImageName.parse("pgvector/pgvector:pg16")
    ).withDatabaseName("mia_fitness_test")
     .withUsername("postgres")
     .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgresWithVector::getJdbcUrl);
        registry.add("spring.datasource.username", postgresWithVector::getUsername);
        registry.add("spring.datasource.password", postgresWithVector::getPassword);
    }

    @Autowired
    private BiomechanicalExerciseRepository repository;

    @Test
    @DisplayName("Debe persistir y recuperar ejercicios biomecánicos con pgvector correctamente")
    void shouldPersistAndRetrieveBiomechanicalExercises() {
        BiomechanicalExercise exercise = BiomechanicalExercise.builder()
                .name("Technogym Pure Strength Chest Press")
                .brand("Technogym")
                .targetMuscle("chest")
                .movementPlane("Scapular Convergent")
                .jointStress("Zero subacromial impingement")
                .axialLoading(false)
                .description("Press convergente con pedal de precarga")
                .build();

        BiomechanicalExercise saved = repository.save(exercise);
        assertThat(saved.getId()).isNotNull();

        List<BiomechanicalExercise> all = repository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getName()).isEqualTo("Technogym Pure Strength Chest Press");
    }
}
