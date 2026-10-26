package com.mia.fitness.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "body_measurements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BodyMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private LocalDate measurementDate;

    // Body Weight in kg
    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal weightKg;

    // Tape Measurements in cm
    @Column(precision = 5, scale = 2)
    private BigDecimal chestCm;

    @Column(precision = 5, scale = 2)
    private BigDecimal waistCm;

    @Column(precision = 5, scale = 2)
    private BigDecimal armCm;

    @Column(precision = 5, scale = 2)
    private BigDecimal thighCm;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
