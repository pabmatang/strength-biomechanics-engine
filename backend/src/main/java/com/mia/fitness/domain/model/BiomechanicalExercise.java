package com.mia.fitness.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

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

    @Column(nullable = false, length = 100)
    private String targetMuscle;

    @Column(nullable = false, length = 100)
    private String movementPlane; // Sagittal, Frontal, Transverse, Scapular

    @Column(nullable = false, length = 100)
    private String jointStress; // e.g. "Low shoulder impingement", "No axial spine loading"

    @Column(nullable = false)
    private Boolean axialLoading; // false = protects lower back

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "vector(768)")
    private String embedding; // String or pgvector PGvector representation
}
