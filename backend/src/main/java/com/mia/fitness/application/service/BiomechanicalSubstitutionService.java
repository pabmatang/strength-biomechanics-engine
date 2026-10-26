package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository.SimilarExercise;
import com.mia.fitness.infrastructure.web.error.AiUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * Semantic substitution: embeds the user's joint complaint and retrieves the closest
 * exercises in the pgvector knowledge base by cosine distance.
 *
 * <p>This is a <b>retrieval</b> pipeline (embeddings + kNN). It does not call an LLM to
 * generate prose; the rationale is assembled deterministically from the retrieved
 * biomechanical attributes so every number shown to the user is traceable.</p>
 */
@Service
public class BiomechanicalSubstitutionService {

    private static final Logger log = LoggerFactory.getLogger(BiomechanicalSubstitutionService.class);
    private static final int MAX_RESULTS = 4;

    private final EmbeddingModel embeddingModel;
    private final BiomechanicalVectorRepository vectorRepository;

    @Value("${app.ai.embedding-dimensions:768}")
    private int expectedDimensions;

    public BiomechanicalSubstitutionService(EmbeddingModel embeddingModel,
                                            BiomechanicalVectorRepository vectorRepository) {
        this.embeddingModel = embeddingModel;
        this.vectorRepository = vectorRepository;
    }

    public List<BiomechanicalAlternativeDto> findJointFriendlySubstitutes(SubstitutionRequestDto request) {
        List<Double> queryEmbedding = embed(buildSemanticQuery(request));
        List<SimilarExercise> matches = vectorRepository.findSimilar(
                queryEmbedding,
                request.targetMuscle(),
                MAX_RESULTS
        );

        log.debug("Substitution query for '{}' returned {} matches", request.currentExercise(), matches.size());

        return matches.stream()
                .map(match -> toDto(match, request))
                .toList();
    }

    private List<Double> embed(String semanticQuery) {
        List<Double> embedding;
        try {
            embedding = embeddingModel.embed(semanticQuery);
        } catch (RuntimeException ex) {
            throw new AiUnavailableException(
                    "El servicio de embeddings no está disponible. Comprueba que Ollama esté arrancado y el modelo descargado.",
                    ex
            );
        }
        if (embedding == null || embedding.isEmpty()) {
            throw new AiUnavailableException("El modelo de embeddings devolvió un vector vacío", null);
        }
        if (embedding.size() != expectedDimensions) {
            throw new IllegalStateException(String.format(Locale.ROOT,
                    "El embedding tiene %d dimensiones pero la columna vector(%d) espera %d. " +
                            "Ajusta app.ai.embedding-dimensions o el modelo de embeddings.",
                    embedding.size(), expectedDimensions, expectedDimensions));
        }
        return embedding;
    }

    private String buildSemanticQuery(SubstitutionRequestDto request) {
        String muscle = request.targetMuscle() != null && !request.targetMuscle().isBlank()
                ? request.targetMuscle()
                : "el músculo objetivo";
        return String.format(Locale.ROOT,
                "Ejercicio que sustituya a %s evitando estrés o dolor en %s y manteniendo el reclutamiento de %s",
                request.currentExercise(),
                request.jointDiscomfort(),
                muscle
        );
    }

    private BiomechanicalAlternativeDto toDto(SimilarExercise match, SubstitutionRequestDto request) {
        double similarity = Math.max(0.0, Math.min(1.0, match.similarity()));

        String rationale = String.format(Locale.ROOT,
                "Recuperado por similitud semántica (%.3f) frente a '%s'. Plano %s; %s; %s.",
                similarity,
                request.currentExercise(),
                match.movementPlane(),
                match.jointStress(),
                match.axialLoading() ? "con carga axial" : "sin carga axial"
        );

        return new BiomechanicalAlternativeDto(
                match.id().toString(),
                match.name(),
                match.brand(),
                match.targetMuscle(),
                match.movementPlane(),
                match.jointStress(),
                match.axialLoading(),
                similarity,
                rationale
        );
    }
}
