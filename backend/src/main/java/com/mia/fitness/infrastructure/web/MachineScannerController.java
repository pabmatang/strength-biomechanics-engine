package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.ScannedMachineDto;
import com.mia.fitness.application.service.MachineScannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/exercises")
@Tag(name = "Machine Vision Scanner", description = "Endpoints para escaneo multimodal de máquinas de gimnasio con Spring AI")
@CrossOrigin(origins = "*")
public class MachineScannerController {

    private final MachineScannerService scannerService;

    public MachineScannerController(MachineScannerService scannerService) {
        this.scannerService = scannerService;
    }

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Escanear máquina con IA Multimodal", description = "Recibe una fotografía y extrae marca, modelo, plano motor y tips biomecánicos con Llama 3.2-Vision")
    public ResponseEntity<ScannedMachineDto> scanExerciseImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        ScannedMachineDto result = scannerService.scanMachineImage(
                file.getBytes(),
                file.getContentType()
        );

        return ResponseEntity.ok(result);
    }
}
