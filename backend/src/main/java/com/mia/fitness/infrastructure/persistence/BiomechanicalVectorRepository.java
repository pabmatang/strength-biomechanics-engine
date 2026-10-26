package com.mia.fitness.infrastructure.persistence;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Native pgvector access. Kept outside JPA on purpose: Hibernate cannot map
 * {@code vector(768)} without a custom type, and this repository needs arithmetic
 * on the distance operator ({@code <=>}) anyway.
 */
@Repository
public class BiomechanicalVectorRepository {

    private static final String BASE_SELECT = """
            SELECT id, name, brand, target_muscle, movement_plane, joint_stress, axial_loading,
                   1 - (embedding <=> cast(? as vector)) AS similarity
            FROM biomechanical_exercises
            WHERE embedding IS NOT NULL
            """;

    private static final String ORDER_AND_LIMIT = """
            ORDER BY embedding <=> cast(? as vector)
            LIMIT ?
            """;

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<SimilarExercise> rowMapper = (rs, rowNum) -> new SimilarExercise(
            rs.getObject("id", UUID.class),
            rs.getString("name"),
            rs.getString("brand"),
            rs.getString("target_muscle"),
            rs.getString("movement_plane"),
            rs.getString("joint_stress"),
            rs.getBoolean("axial_loading"),
            rs.getDouble("similarity")
    );

    public BiomechanicalVectorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void updateEmbedding(UUID id, List<Double> embedding) {
        jdbcTemplate.update(
                "UPDATE biomechanical_exercises SET embedding = cast(? as vector) WHERE id = ?",
                toVectorLiteral(embedding),
                id
        );
    }

    public boolean hasEmbedding(UUID id) {
        Boolean present = jdbcTemplate.queryForObject(
                "SELECT embedding IS NOT NULL FROM biomechanical_exercises WHERE id = ?",
                Boolean.class,
                id
        );
        return Boolean.TRUE.equals(present);
    }

    /**
     * Cosine-distance kNN. The optional {@code targetMuscle} filter is applied in SQL
     * so the index can still be used for the ordering.
     */
    public List<SimilarExercise> findSimilar(List<Double> queryEmbedding, String targetMuscle, int limit) {
        String vector = toVectorLiteral(queryEmbedding);

        if (targetMuscle != null && !targetMuscle.isBlank()) {
            return jdbcTemplate.query(
                    BASE_SELECT + " AND lower(target_muscle) = lower(?) " + ORDER_AND_LIMIT,
                    rowMapper,
                    vector, targetMuscle.trim(), vector, limit
            );
        }

        return jdbcTemplate.query(
                BASE_SELECT + ORDER_AND_LIMIT,
                rowMapper,
                vector, vector, limit
        );
    }

    static String toVectorLiteral(List<Double> embedding) {
        if (embedding == null || embedding.isEmpty()) {
            throw new IllegalArgumentException("El embedding no puede estar vacío");
        }
        StringBuilder sb = new StringBuilder(embedding.size() * 12);
        sb.append('[');
        for (int i = 0; i < embedding.size(); i++) {
            Double value = embedding.get(i);
            if (value == null || value.isNaN() || value.isInfinite()) {
                throw new IllegalArgumentException("Embedding inválido en la dimensión " + i);
            }
            if (i > 0) {
                sb.append(',');
            }
            sb.append(value);
        }
        return sb.append(']').toString();
    }

    public record SimilarExercise(
            UUID id,
            String name,
            String brand,
            String targetMuscle,
            String movementPlane,
            String jointStress,
            boolean axialLoading,
            double similarity
    ) {
    }
}
