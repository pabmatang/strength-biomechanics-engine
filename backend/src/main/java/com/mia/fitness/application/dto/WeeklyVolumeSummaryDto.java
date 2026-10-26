package com.mia.fitness.application.dto;

import java.util.Map;

public record WeeklyVolumeSummaryDto(
    String userId,
    int weekNumber,
    int year,
    Map<String, Integer> effectiveSetsByMuscle, // e.g. "chest": 14, "lats": 16
    Map<String, Double> tonnageByMuscle,        // e.g. "chest": 11200.0 kg
    String volumeStatus                         // "OPTIMAL_MAV", "UNDER_TRAINED", "OVERREACHING"
) {}
