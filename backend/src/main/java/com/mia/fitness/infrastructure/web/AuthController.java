package com.mia.fitness.infrastructure.web;

import com.mia.fitness.application.dto.AuthRequest;
import com.mia.fitness.application.dto.AuthResponse;
import com.mia.fitness.application.dto.RegisterRequest;
import com.mia.fitness.application.dto.UserProfileDto;
import com.mia.fitness.application.service.AuthService;
import com.mia.fitness.domain.model.User;
import com.mia.fitness.infrastructure.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Registro, login y perfil con JWT stateless")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuario y emitir JWT",
            description = "Verifica la contraseña con BCrypt y emite un Bearer token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
            @ApiResponse(responseCode = "401", description = "Credenciales incorrectas")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        User user = authService.authenticate(request.username(), request.password());
        return ResponseEntity.ok(issueToken(user));
    }

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario",
            description = "Crea la cuenta con la contraseña hasheada y devuelve el token de sesión")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro exitoso"),
            @ApiResponse(responseCode = "400", description = "Datos de registro inválidos"),
            @ApiResponse(responseCode = "409", description = "Usuario o email ya registrados")
    })
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.ok(issueToken(user));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obtener perfil del usuario actual",
            description = "Devuelve el perfil asociado al Bearer token")
    public ResponseEntity<UserProfileDto> getCurrentUser(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(UserProfileDto.from(authService.requireByUsername(username)));
    }

    private AuthResponse issueToken(User user) {
        String token = jwtService.generateToken(user.getUsername(), Map.of(
                "role", "ROLE_" + user.getRole(),
                "email", user.getEmail()
        ));
        return AuthResponse.of(token, UserProfileDto.from(user), jwtService.getExpirationMs());
    }
}
