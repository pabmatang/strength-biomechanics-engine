package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.RegisterRequest;
import com.mia.fitness.domain.model.User;
import com.mia.fitness.infrastructure.persistence.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Registration and credential verification. Passwords are hashed with BCrypt and
 * login goes through Spring Security's {@link AuthenticationManager}, so a token is
 * only issued after the password has actually been verified.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public User register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateUserException("El nombre de usuario ya está en uso");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateUserException("Ya existe una cuenta con este correo electrónico");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role("USER")
                .goal(request.goalOrDefault())
                .createdAt(Instant.now())
                .build();

        return userRepository.save(user);
    }

    /**
     * Verifies the password through the configured {@link AuthenticationManager}.
     *
     * @param identifier username or email
     * @throws org.springframework.security.core.AuthenticationException when credentials are invalid
     */
    @Transactional(readOnly = true)
    public User authenticate(String identifier, String password) {
        String normalized = identifier.trim();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalized, password)
        );

        String canonicalUsername = authentication.getName();
        return userRepository.findByUsernameIgnoreCase(canonicalUsername)
                .orElseThrow(() -> new IllegalStateException(
                        "Usuario autenticado no encontrado: " + canonicalUsername));
    }

    @Transactional(readOnly = true)
    public User requireByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado: " + username));
    }
}
