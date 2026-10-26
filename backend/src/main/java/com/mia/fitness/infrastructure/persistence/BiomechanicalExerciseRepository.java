package com.mia.fitness.infrastructure.persistence;

import com.mia.fitness.domain.model.BiomechanicalExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Relational access to the knowledge base. Vector similarity lives in
 * {@link BiomechanicalVectorRepository}.
 */
@Repository
public interface BiomechanicalExerciseRepository extends JpaRepository<BiomechanicalExercise, UUID> {

    Optional<BiomechanicalExercise> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
