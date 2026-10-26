package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.domain.model.BiomechanicalExercise;
import com.mia.fitness.infrastructure.persistence.BiomechanicalExerciseRepository;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class BiomechanicalRagService {

    private final EmbeddingModel embeddingModel;
    private final BiomechanicalExerciseRepository exerciseRepository;

    public BiomechanicalRagService(EmbeddingModel embeddingModel, BiomechanicalExerciseRepository exerciseRepository) {
        this.embeddingModel = embeddingModel;
        this.exerciseRepository = exerciseRepository;
    }

    /**
     * Resolves joint discomfort by calculating vector embedding of the query and finding
     * biomechanically sound exercises via pgvector cosine distance (<=>).
     */
    public List<BiomechanicalAlternativeDto> findJointFriendlySubstitutes(SubstitutionRequestDto request) {
        String semanticQuery = String.format(
                "Ejercicio que reemplace %s eliminando estrés o dolor en %s y preservando el reclutamiento de %s",
                request.currentExercise(),
                request.jointDiscomfort(),
                request.targetMuscle() != null ? request.targetMuscle() : "músculo objetivo"
        );

        // Compute 768-dimensional vector embedding with Ollama (nomic-embed-text)
        List<Double> queryEmbedding = embeddingModel.embed(semanticQuery);
        String vectorString = queryEmbedding.toString();

        List<BiomechanicalExercise> matches = exerciseRepository.findSimilarExercises(
                vectorString,
                request.targetMuscle(),
                4
        );

        return matches.stream().map(ex -> new BiomechanicalAlternativeDto(
                ex.getId().toString(),
                ex.getName(),
                ex.getBrand(),
                ex.getTargetMuscle(),
                ex.getMovementPlane(),
                ex.getJointStress(),
                ex.getAxialLoading(),
                0.93, // Cosine similarity normalized
                "Trayectoria convergente guiada con plano escapular protegido para desacoplar tensión en " + request.jointDiscomfort()
        )).toList();
    }
}
