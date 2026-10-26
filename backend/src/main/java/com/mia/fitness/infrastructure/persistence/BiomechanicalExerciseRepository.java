package com.mia.fitness.infrastructure.persistence;

import com.mia.fitness.domain.model.BiomechanicalExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BiomechanicalExerciseRepository extends JpaRepository<BiomechanicalExercise, UUID> {

    @Query(value = """
        SELECT e.* FROM biomechanical_exercises e
        WHERE (:muscle IS NULL OR LOWER(e.target_muscle) = LOWER(:muscle))
        ORDER BY e.embedding <=> cast(:queryVector as vector) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<BiomechanicalExercise> findSimilarExercises(
            @Param("queryVector") String queryVector,
            @Param("muscle") String muscle,
            @Param("limit") int limit
    );
}
