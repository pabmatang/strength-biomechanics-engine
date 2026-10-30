package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.application.dto.TelemetryAnalysisResponseDto;
import com.mia.fitness.application.dto.VideoTelemetryDto;
import com.mia.fitness.application.service.BiomechanicalSubstitutionService;
import com.mia.fitness.application.service.VideoTelemetryAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/biomechanics")
@Tag(name = "Biomechanical Substitution & Vision Telemetry", description = "Sustitución cinemática y análisis de telemetría de vídeo")
@SecurityRequirement(name = "bearerAuth")
public class BiomechanicalSubstitutionController {

    private final BiomechanicalSubstitutionService substitutionService;
    private final VideoTelemetryAnalysisService videoTelemetryService;

    public BiomechanicalSubstitutionController(
            BiomechanicalSubstitutionService substitutionService,
            VideoTelemetryAnalysisService videoTelemetryService
    ) {
        this.substitutionService = substitutionService;
        this.videoTelemetryService = videoTelemetryService;
    }

    @PostMapping("/substitute")
    @Operation(summary = "Sustitución cinemática por molestia articular",
            description = "Embebe la consulta y recupera por distancia coseno (<=>) las alternativas más cercanas, " +
                    "devolviendo la similitud real calculada por PostgreSQL")
    public ResponseEntity<List<BiomechanicalAlternativeDto>> getSubstitutes(
            @Valid @RequestBody SubstitutionRequestDto request
    ) {
        List<BiomechanicalAlternativeDto> substitutes = substitutionService.findJointFriendlySubstitutes(request);
        return ResponseEntity.ok(substitutes);
    }

    @PostMapping("/video-telemetry")
    @Operation(summary = "Procesar telemetría biomecánica de vídeo (Edge Computing)",
            description = "Recibe los ángulos y alertas calculados en el dispositivo móvil fotograma a fotograma y devuelve diagnóstico y recomendaciones")
    public ResponseEntity<TelemetryAnalysisResponseDto> analyzeVideoTelemetry(
            @AuthenticationPrincipal String username,
            @Valid @RequestBody VideoTelemetryDto telemetry
    ) {
        TelemetryAnalysisResponseDto analysis = videoTelemetryService.processTelemetry(username, telemetry);
        return ResponseEntity.ok(analysis);
    }
}
