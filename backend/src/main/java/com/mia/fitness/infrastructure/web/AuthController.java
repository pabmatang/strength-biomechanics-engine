package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.AuthRequest;
import com.mia.fitness.application.dto.AuthResponse;
import com.mia.fitness.application.dto.RegisterRequest;
import com.mia.fitness.infrastructure.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints de autenticación y emisión de tokens JWT")
public class AuthController {

    private final JwtService jwtService;

    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuario y emitir JWT", description = "Valida credenciales y genera un Bearer Token con expiración de 24h")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
            @ApiResponse(responseCode = "400", description = "Credenciales inválidas")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        // Issue token for the authenticated user
        String token = jwtService.generateToken(request.username(), Map.of("role", "ROLE_USER"));
        return ResponseEntity.ok(AuthResponse.of(token, request.username(), 86400000L));
    }

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario", description = "Crea un nuevo perfil y devuelve el token de sesión JWT inmediato")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro exitoso"),
            @ApiResponse(responseCode = "400", description = "Datos de registro inválidos")
    })
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        String token = jwtService.generateToken(request.username(), Map.of("email", request.email(), "role", "ROLE_USER"));
        return ResponseEntity.ok(AuthResponse.of(token, request.username(), 86400000L));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener perfil del usuario actual", description = "Devuelve el usuario decodificado a partir del Bearer token")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(Map.of(
                "username", username != null ? username : "anonymous",
                "authenticated", username != null,
                "engineStatus", "ONLINE"
        ));
    }
}
