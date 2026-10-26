package com.mia.fitness.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workout_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String exerciseTemplateId;

    @Column(nullable = false)
    private String title;

    private String brand; // Technogym, Hammer Strength, Matrix, etc.

    @Column(nullable = false, length = 100)
    private String muscleGroup; // chest, lats, quadriceps, etc.

    @Column(length = 100)
    private String equipmentCategory;

    @Column(length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id")
    private Workout workout;

    @OneToMany(mappedBy = "workoutExercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("setIndex ASC")
    @Builder.Default
    private List<WorkoutSet> sets = new ArrayList<>();

    public void addSet(WorkoutSet set) {
        sets.add(set);
        set.setWorkoutExercise(this);
    }
}
