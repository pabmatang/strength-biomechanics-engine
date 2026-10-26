package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.BiomechanicalAlternativeDto;
import com.mia.fitness.application.dto.SubstitutionRequestDto;
import com.mia.fitness.application.service.BiomechanicalRagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/biomechanics")
@Tag(name = "Biomechanical Substitution RAG", description = "Endpoints de sustitución cinemática y protección articular con pgvector")
@CrossOrigin(origins = "*")
public class BiomechanicalSubstitutionController {

    private final BiomechanicalRagService ragService;

    public BiomechanicalSubstitutionController(BiomechanicalRagService ragService) {
        this.ragService = ragService;
    }

    @PostMapping("/substitute")
    @Operation(summary = "Sustitución cinemática por molestia articular", description = "Calcula la distancia coseno en pgvector para devolver alternativas mecánicamente equivalentes sin estrés articular")
    public ResponseEntity<List<BiomechanicalAlternativeDto>> getSubstitutes(
            @Valid @RequestBody SubstitutionRequestDto request
    ) {
        List<BiomechanicalAlternativeDto> substitutes = ragService.findJointFriendlySubstitutes(request);
        return ResponseEntity.ok(substitutes);
    }
}
