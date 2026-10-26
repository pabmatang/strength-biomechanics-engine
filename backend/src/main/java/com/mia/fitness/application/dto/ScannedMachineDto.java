package com.mia.fitness.application.dto;

import java.util.List;

public record ScannedMachineDto(
    String machineName,
    String brand,
    String modelSeries,
    String primaryMuscleGroup,
    List<String> secondaryMuscleGroups,
    String equipmentCategory,
    List<String> biomechanicalSetupTips
) {}
