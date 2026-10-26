package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.application.service.BiomechanicalSubstitutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/biomechanics")
@Tag(name = "Biomechanical Substitution", description = "Sustitución cinemática por similitud semántica con pgvector")
@SecurityRequirement(name = "bearerAuth")
public class BiomechanicalSubstitutionController {

    private final BiomechanicalSubstitutionService substitutionService;

    public BiomechanicalSubstitutionController(BiomechanicalSubstitutionService substitutionService) {
        this.substitutionService = substitutionService;
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
}
