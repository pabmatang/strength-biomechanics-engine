package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.RegisterRequest;
import com.mia.fitness.domain.model.User;
import com.mia.fitness.infrastructure.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager);
    }

    @Test
    @DisplayName("El registro hashea la contraseña y nunca guarda el texto plano")
    void shouldHashPasswordOnRegister() {
        RegisterRequest request = new RegisterRequest("pablo_coach", "Pablo@Strength-Lab.io", "StrongBioPass2026!", "strength");

        when(userRepository.existsByUsernameIgnoreCase("pablo_coach")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("pablo@strength-lab.io")).thenReturn(false);
        when(passwordEncoder.encode("StrongBioPass2026!")).thenReturn("$2a$10$hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        User created = authService.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User persisted = captor.getValue();

        assertThat(persisted.getPasswordHash()).isEqualTo("$2a$10$hash");
        assertThat(persisted.getEmail()).isEqualTo("pablo@strength-lab.io");
        assertThat(persisted.getRole()).isEqualTo("USER");
        assertThat(persisted.getGoal()).isEqualTo("strength");
        assertThat(persisted.getPasswordHash()).doesNotContain("StrongBioPass2026!");
        assertThat(created.getId()).isNotNull();
    }

    @Test
    @DisplayName("No se permite registrar dos cuentas con el mismo email")
    void shouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("otro", "pablo@strength-lab.io", "StrongBioPass2026!", null);

        when(userRepository.existsByUsernameIgnoreCase("otro")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("pablo@strength-lab.io")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateUserException.class)
                .hasMessageContaining("correo electrónico");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("El login delega en AuthenticationManager y devuelve el usuario canónico")
    void shouldAuthenticateThroughAuthenticationManager() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("pablo_coach")
                .email("pablo@strength-lab.io")
                .passwordHash("$2a$10$hash")
                .role("USER")
                .goal("hypertrophy")
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                "pablo_coach", null, List.of());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByUsernameIgnoreCase("pablo_coach")).thenReturn(Optional.of(user));

        User authenticated = authService.authenticate("Pablo@strength-lab.io", "StrongBioPass2026!");

        assertThat(authenticated.getUsername()).isEqualTo("pablo_coach");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Credenciales incorrectas se propagan como AuthenticationException")
    void shouldPropagateBadCredentials() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.authenticate("pablo_coach", "wrong-password"))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByUsernameIgnoreCase(any());
    }
}
