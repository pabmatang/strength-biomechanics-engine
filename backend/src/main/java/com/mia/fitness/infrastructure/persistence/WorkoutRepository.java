package com.mia.fitness.infrastructure.persistence;

import com.mia.fitness.domain.model.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutRepository extends JpaRepository<Workout, UUID> {

    List<Workout> findByUserIdOrderByStartTimeDesc(String userId);

    @Query("""
            SELECT DISTINCT w FROM Workout w
            LEFT JOIN FETCH w.exercises
            WHERE w.userId = :userId
            AND w.startTime >= :since
            ORDER BY w.startTime ASC
            """)
    List<Workout> findRecentWithDetails(
            @Param("userId") String userId,
            @Param("since") Instant since
    );

    Optional<Workout> findByIdAndUserId(UUID id, String userId);
}
