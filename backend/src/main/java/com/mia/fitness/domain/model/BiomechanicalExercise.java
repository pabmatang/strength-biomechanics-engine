package com.mia.fitness.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Biomechanical knowledge-base entry.
 *
 * <p>The {@code embedding vector(768)} column is intentionally <b>not</b> mapped here:
 * Hibernate has no native pgvector type, so the vector is written and queried through
 * {@code BiomechanicalVectorRepository} using native SQL with explicit casts.</p>
 */
@Entity
@Table(name = "biomechanical_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiomechanicalExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String brand;

    @Column(name = "target_muscle", nullable = false, length = 100)
    private String targetMuscle;

    @Column(name = "movement_plane", nullable = false, length = 100)
    private String movementPlane; // Sagittal, Frontal, Transverse, Scapular

    @Column(name = "joint_stress", nullable = false, length = 100)
    private String jointStress; // e.g. "Low shoulder impingement", "No axial spine loading"

    @Column(name = "axial_loading", nullable = false)
    private Boolean axialLoading; // false = protects lower back

    @Column(columnDefinition = "TEXT")
    private String description;
}
