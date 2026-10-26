package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.CreateWorkoutRequest;
import com.mia.fitness.application.dto.PlateauAlertDto;
import com.mia.fitness.application.dto.WeeklyVolumeSummaryDto;
import com.mia.fitness.application.dto.WorkoutResponse;
import com.mia.fitness.application.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workouts")
@Tag(name = "Workouts & Progressive Overload",
        description = "CRUD de entrenamientos con análisis de volumen semanal y detección de estancamiento hipertrófico")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @PostMapping
    @Operation(summary = "Registrar un entrenamiento completo",
            description = "Persiste la sesión de entrenamiento con ejercicios, series, RPE y tonelaje. Calcula métricas derivadas.")
    @ApiResponse(responseCode = "201", description = "Entrenamiento creado exitosamente")
    public ResponseEntity<WorkoutResponse> createWorkout(
            @AuthenticationPrincipal String username,
            @Valid @RequestBody CreateWorkoutRequest request
    ) {
        WorkoutResponse response = workoutService.createWorkout(username, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{workoutId}")
    @Operation(summary = "Consultar un entrenamiento por ID")
    public ResponseEntity<WorkoutResponse> getWorkout(
            @AuthenticationPrincipal String username,
            @PathVariable UUID workoutId
    ) {
        return ResponseEntity.ok(workoutService.getWorkoutById(username, workoutId));
    }

    @GetMapping
    @Operation(summary = "Historial de entrenamientos del usuario autenticado")
    public ResponseEntity<List<WorkoutResponse>> getUserWorkouts(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(workoutService.getUserWorkouts(username));
    }

    @GetMapping("/analysis/weekly-volume")
    @Operation(summary = "Volumen semanal efectivo por grupo muscular",
            description = "Calcula series efectivas (RPE >= 6.5) y tonelaje mecánico de los últimos 7 días, " +
                    "clasificando el estado de volumen según MAV/MRV (Israetel & Schoenfeld)")
    public ResponseEntity<WeeklyVolumeSummaryDto> getWeeklyVolume(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(workoutService.getWeeklyVolume(username));
    }

    @GetMapping("/analysis/plateau-detection")
    @Operation(summary = "Detección de estancamiento hipertrófico",
            description = "Analiza una ventana de 4 semanas para detectar estancamiento de tonelaje y fatiga neuromuscular (RPE creciente)")
    public ResponseEntity<PlateauAlertDto> detectPlateau(
            @AuthenticationPrincipal String username,
            @RequestParam String exerciseTemplateId,
            @RequestParam String exerciseTitle
    ) {
        return ResponseEntity.ok(workoutService.detectPlateau(username, exerciseTemplateId, exerciseTitle));
    }
}
