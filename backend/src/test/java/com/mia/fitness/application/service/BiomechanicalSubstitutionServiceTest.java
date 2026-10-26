package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository.SimilarExercise;
import com.mia.fitness.infrastructure.web.error.AiUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BiomechanicalSubstitutionServiceTest {

    @Mock
    private EmbeddingModel embeddingModel;

    @Mock
    private BiomechanicalVectorRepository vectorRepository;

    private BiomechanicalSubstitutionService service;

    @BeforeEach
    void setUp() {
        service = new BiomechanicalSubstitutionService(embeddingModel, vectorRepository);
        ReflectionTestUtils.setField(service, "expectedDimensions", 768);
    }

    @Test
    @DisplayName("Devuelve la similitud real calculada por pgvector y no un valor hardcodeado")
    void shouldReturnVectorSearchSimilarity() {
        SubstitutionRequestDto request = new SubstitutionRequestDto(
                "Barbell Bench Press",
                "Hombro anterior (pinzamiento subacromial)",
                "chest"
        );

        when(embeddingModel.embed(anyString())).thenReturn(unitVector(0));
        when(vectorRepository.findSimilar(any(), eq("chest"), eq(4))).thenReturn(List.of(
                new SimilarExercise(
                        UUID.randomUUID(),
                        "Technogym Pure Strength Chest Press",
                        "Technogym",
                        "chest",
                        "Scapular convergent",
                        "Low subacromial shear",
                        false,
                        0.9317
                )
        ));

        List<BiomechanicalAlternativeDto> results = service.findJointFriendlySubstitutes(request);

        assertThat(results).hasSize(1);
        BiomechanicalAlternativeDto first = results.get(0);
        assertThat(first.name()).isEqualTo("Technogym Pure Strength Chest Press");
        assertThat(first.brand()).isEqualTo("Technogym");
        assertThat(first.similarityScore()).isEqualTo(0.9317);
        assertThat(first.biomechanicalRationale())
                .contains("0.932")
                .contains("Barbell Bench Press")
                .contains("sin carga axial");
    }

    @Test
    @DisplayName("Sin coincidencias devuelve lista vacía sin inventar resultados")
    void shouldReturnEmptyListWhenNoMatches() {
        when(embeddingModel.embed(anyString())).thenReturn(unitVector(0));
        when(vectorRepository.findSimilar(any(), org.mockito.ArgumentMatchers.isNull(), eq(4)))
                .thenReturn(Collections.emptyList());

        List<BiomechanicalAlternativeDto> results = service.findJointFriendlySubstitutes(
                new SubstitutionRequestDto("Sentadilla", "Lumbar L4-L5", null));

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Si Ollama no responde se lanza AiUnavailableException (503)")
    void shouldTranslateEmbeddingFailure() {
        when(embeddingModel.embed(anyString())).thenThrow(new RuntimeException("Connection refused"));

        assertThatThrownBy(() -> service.findJointFriendlySubstitutes(
                new SubstitutionRequestDto("Press banca", "Hombro", null)))
                .isInstanceOf(AiUnavailableException.class)
                .hasMessageContaining("Ollama");
    }

    @Test
    @DisplayName("Un embedding con dimensiones distintas a la columna vector(N) falla con un mensaje claro")
    void shouldRejectDimensionMismatch() {
        when(embeddingModel.embed(anyString())).thenReturn(List.of(0.1, 0.2, 0.3));

        assertThatThrownBy(() -> service.findJointFriendlySubstitutes(
                new SubstitutionRequestDto("Press banca", "Hombro", null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("768");
    }

    private List<Double> unitVector(int index) {
        List<Double> vector = new java.util.ArrayList<>(Collections.nCopies(768, 0.0));
        vector.set(index, 1.0);
        return vector;
    }
}
