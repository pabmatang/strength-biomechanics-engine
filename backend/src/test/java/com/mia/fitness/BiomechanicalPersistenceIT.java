package com.mia.fitness;

import com.mia.fitness.domain.model.BiomechanicalExercise;
import com.mia.fitness.infrastructure.persistence.BiomechanicalExerciseRepository;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository.SimilarExercise;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BiomechanicalPersistenceIT extends PostgresIntegrationTestBase {

    @Autowired
    private BiomechanicalExerciseRepository repository;

    @Autowired
    private BiomechanicalVectorRepository vectorRepository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("Persiste y recupera ejercicios biomecánicos con el esquema de Flyway")
    void shouldPersistAndRetrieveBiomechanicalExercises() {
        BiomechanicalExercise exercise = BiomechanicalExercise.builder()
                .name("Technogym Pure Strength Chest Press")
                .brand("Technogym")
                .targetMuscle("chest")
                .movementPlane("Scapular convergent")
                .jointStress("Low subacromial shear")
                .axialLoading(false)
                .description("Press convergente con pedal de precarga")
                .build();

        BiomechanicalExercise saved = repository.save(exercise);
        assertThat(saved.getId()).isNotNull();

        List<BiomechanicalExercise> all = repository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getName()).isEqualTo("Technogym Pure Strength Chest Press");
    }

    @Test
    @DisplayName("La búsqueda kNN ordena por distancia coseno real y devuelve la similitud calculada")
    void shouldOrderByCosineDistance() {
        BiomechanicalExercise chestPress = repository.save(exercise("Technogym Pure Chest Press", "chest"));
        BiomechanicalExercise peckDeck = repository.save(exercise("Technogym Selection Pec Deck", "chest"));
        BiomechanicalExercise row = repository.save(exercise("Matrix Ultra Seated Row", "back"));

        // chestPress ~= query, peckDeck shares half of the direction, row is orthogonal.
        vectorRepository.updateEmbedding(chestPress.getId(), unitVector(0));
        vectorRepository.updateEmbedding(peckDeck.getId(), mixedVector(0, 1));
        vectorRepository.updateEmbedding(row.getId(), unitVector(1));

        List<SimilarExercise> matches = vectorRepository.findSimilar(unitVector(0), null, 3);

        assertThat(matches).hasSize(3);
        assertThat(matches.get(0).name()).isEqualTo("Technogym Pure Chest Press");
        assertThat(matches.get(0).similarity()).isCloseTo(1.0, org.assertj.core.data.Offset.offset(1e-6));
        assertThat(matches.get(1).name()).isEqualTo("Technogym Selection Pec Deck");
        assertThat(matches.get(1).similarity()).isCloseTo(0.7071, org.assertj.core.data.Offset.offset(1e-3));
        assertThat(matches.get(2).similarity()).isCloseTo(0.0, org.assertj.core.data.Offset.offset(1e-6));
    }

    @Test
    @DisplayName("El filtro por músculo se aplica en SQL antes del ranking vectorial")
    void shouldFilterByTargetMuscle() {
        BiomechanicalExercise chestPress = repository.save(exercise("Technogym Pure Chest Press", "chest"));
        BiomechanicalExercise row = repository.save(exercise("Matrix Ultra Seated Row", "back"));

        vectorRepository.updateEmbedding(chestPress.getId(), unitVector(0));
        vectorRepository.updateEmbedding(row.getId(), unitVector(0));

        List<SimilarExercise> matches = vectorRepository.findSimilar(unitVector(0), "back", 4);

        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).name()).isEqualTo("Matrix Ultra Seated Row");
    }

    private BiomechanicalExercise exercise(String name, String muscle) {
        return BiomechanicalExercise.builder()
                .name(name)
                .brand("Test")
                .targetMuscle(muscle)
                .movementPlane("Sagittal")
                .jointStress("Low")
                .axialLoading(false)
                .description("test fixture")
                .build();
    }

    private List<Double> unitVector(int index) {
        List<Double> vector = new ArrayList<>(Collections.nCopies(768, 0.0));
        vector.set(index, 1.0);
        return vector;
    }

    private List<Double> mixedVector(int first, int second) {
        List<Double> vector = new ArrayList<>(Collections.nCopies(768, 0.0));
        vector.set(first, 1.0);
        vector.set(second, 1.0);
        return vector;
    }
}
