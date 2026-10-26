package com.mia.fitness.infrastructure.bootstrap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mia.fitness.domain.model.BiomechanicalExercise;
import com.mia.fitness.infrastructure.persistence.BiomechanicalExerciseRepository;
import com.mia.fitness.infrastructure.persistence.BiomechanicalVectorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Locale;

/**
 * Seeds the biomechanical knowledge base and computes its embeddings on first boot.
 *
 * <p>If Ollama is not reachable the rows are still created (so the relational model works)
 * and the embedding step is retried on the next startup. Startup never fails because of a
 * missing model.</p>
 */
@Component
@ConditionalOnProperty(prefix = "app.knowledge-base", name = "seed", havingValue = "true", matchIfMissing = true)
public class KnowledgeBaseSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseSeeder.class);
    private static final String SEED_RESOURCE = "knowledge-base/biomechanical-exercises.json";

    private final ObjectMapper objectMapper;
    private final BiomechanicalExerciseRepository exerciseRepository;
    private final BiomechanicalVectorRepository vectorRepository;
    private final EmbeddingModel embeddingModel;

    @Value("${app.ai.embedding-dimensions:768}")
    private int expectedDimensions;

    public KnowledgeBaseSeeder(ObjectMapper objectMapper,
                               BiomechanicalExerciseRepository exerciseRepository,
                               BiomechanicalVectorRepository vectorRepository,
                               EmbeddingModel embeddingModel) {
        this.objectMapper = objectMapper;
        this.exerciseRepository = exerciseRepository;
        this.vectorRepository = vectorRepository;
        this.embeddingModel = embeddingModel;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<SeedExercise> seeds = readSeedFile();
        int created = 0;
        int embedded = 0;
        int alreadyPresent = 0;

        for (SeedExercise seed : seeds) {
            BiomechanicalExercise exercise = exerciseRepository.findByNameIgnoreCase(seed.name()).orElse(null);
            if (exercise == null) {
                exercise = exerciseRepository.save(BiomechanicalExercise.builder()
                        .name(seed.name())
                        .brand(seed.brand())
                        .targetMuscle(seed.targetMuscle())
                        .movementPlane(seed.movementPlane())
                        .jointStress(seed.jointStress())
                        .axialLoading(seed.axialLoading())
                        .description(seed.description())
                        .build());
                created++;
            }

            if (vectorRepository.hasEmbedding(exercise.getId())) {
                alreadyPresent++;
                continue;
            }

            try {
                List<Double> embedding = embeddingModel.embed(seed.toEmbeddingText());
                if (embedding == null || embedding.size() != expectedDimensions) {
                    throw new IllegalStateException(String.format(Locale.ROOT,
                            "Embedding de %d dimensiones, se esperaban %d",
                            embedding == null ? 0 : embedding.size(), expectedDimensions));
                }
                vectorRepository.updateEmbedding(exercise.getId(), embedding);
                embedded++;
            } catch (Exception ex) {
                log.warn("No se pudo generar el embedding de '{}': {}. " +
                                "La búsqueda vectorial no devolverá resultados hasta que Ollama esté disponible " +
                                "y la aplicación se reinicie.",
                        seed.name(), ex.getMessage());
                // Ollama is down: stop hammering it 20 times, retry on next boot.
                break;
            }
        }

        log.info("Knowledge base: {} nuevas filas, {} embeddings generados, {} ya presentes ({} en catálogo)",
                created, embedded, alreadyPresent, seeds.size());
    }

    private List<SeedExercise> readSeedFile() {
        try (InputStream input = new ClassPathResource(SEED_RESOURCE).getInputStream()) {
            return objectMapper.readValue(input, new TypeReference<List<SeedExercise>>() {
            });
        } catch (Exception ex) {
            log.error("No se pudo leer {}: {}", SEED_RESOURCE, ex.getMessage());
            return List.of();
        }
    }

    record SeedExercise(
            String name,
            String brand,
            String targetMuscle,
            String movementPlane,
            String jointStress,
            boolean axialLoading,
            String description
    ) {
        String toEmbeddingText() {
            return String.format(Locale.ROOT,
                    "%s. Marca: %s. Músculo objetivo: %s. Plano de movimiento: %s. Estrés articular: %s. %s",
                    name, brand, targetMuscle, movementPlane, jointStress, description);
        }
    }
}
