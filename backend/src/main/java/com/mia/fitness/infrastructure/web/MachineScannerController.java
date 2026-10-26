package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.ScannedMachineDto;
import com.mia.fitness.application.service.MachineScannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/exercises")
@Tag(name = "Machine Vision Scanner", description = "Escaneo multimodal de máquinas de gimnasio con Spring AI")
@SecurityRequirement(name = "bearerAuth")
public class MachineScannerController {

    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;

    private final MachineScannerService scannerService;

    public MachineScannerController(MachineScannerService scannerService) {
        this.scannerService = scannerService;
    }

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Escanear máquina con IA Multimodal",
            description = "Recibe una fotografía (JPEG/PNG/WebP, máx. 10 MB) y extrae marca, modelo, " +
                    "plano motor y consejos de ajuste con structured output")
    public ResponseEntity<ScannedMachineDto> scanExerciseImage(@RequestParam("file") MultipartFile file)
            throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debes adjuntar una imagen en el campo 'file'");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("La imagen supera el tamaño máximo permitido (10 MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("El archivo debe ser una imagen (image/jpeg, image/png o image/webp)");
        }

        ScannedMachineDto result = scannerService.scanMachineImage(file.getBytes(), contentType);
        return ResponseEntity.ok(result);
    }
}
