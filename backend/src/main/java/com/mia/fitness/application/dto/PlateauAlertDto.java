package com.mia.fitness.application.dto;

import java.math.BigDecimal;

public record PlateauAlertDto(
    String exerciseTemplateId,
    String exerciseTitle,
    boolean isStagnated,
    BigDecimal currentAvgRpe,
    BigDecimal previousAvgRpe,
    Double currentWeekTonnage,
    Double rollingAvgTonnage,
    String rationale,
    String suggestedAction // e.g. "DELOAD_WEEK: Reduce volume by 40% and RPE to 6-7"
) {}
