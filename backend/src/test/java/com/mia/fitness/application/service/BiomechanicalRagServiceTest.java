package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.domain.model.BiomechanicalExercise;
import com.mia.fitness.infrastructure.persistence.BiomechanicalExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.embedding.EmbeddingModel;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BiomechanicalRagServiceTest {

    @Mock
    private EmbeddingModel embeddingModel;

    @Mock
    private BiomechanicalExerciseRepository exerciseRepository;

    @InjectMocks
    private BiomechanicalRagService ragService;

    @Test
    @DisplayName("Debe generar embedding vectorial y buscar ejercicios sustitutos por distancia coseno")
    void shouldFindJointFriendlySubstitutes() {
        SubstitutionRequestDto request = new SubstitutionRequestDto(
                "Barbell Bench Press",
                "Hombro anterior (pinzamiento subacromial)",
                "Pecho"
        );

        List<Double> mockEmbedding = List.of(0.12, -0.45, 0.88, 0.05);
        when(embeddingModel.embed(anyString())).thenReturn(mockEmbedding);

        BiomechanicalExercise substitute = BiomechanicalExercise.builder()
                .id(UUID.randomUUID())
                .name("Pure Strength Incline Chest Press")
                .brand("Technogym")
                .targetMuscle("Pecho")
                .movementPlane("Scapular Plane Convergent")
                .jointStress("Zero subacromial shear")
                .axialLoading(false)
                .build();

        when(exerciseRepository.findSimilarExercises(anyString(), anyString(), eq(4)))
                .thenReturn(List.of(substitute));

        List<BiomechanicalAlternativeDto> results = ragService.findJointFriendlySubstitutes(request);

        assertThat(results).hasSize(1);
        BiomechanicalAlternativeDto first = results.get(0);
        assertThat(first.name()).isEqualTo("Pure Strength Incline Chest Press");
        assertThat(first.brand()).isEqualTo("Technogym");
        assertThat(first.jointStressAvoided()).isEqualTo("Zero subacromial shear");

        verify(embeddingModel).embed(contains("Barbell Bench Press"));
        verify(exerciseRepository).findSimilarExercises(contains("0.12"), eq("Pecho"), eq(4));
    }
}
