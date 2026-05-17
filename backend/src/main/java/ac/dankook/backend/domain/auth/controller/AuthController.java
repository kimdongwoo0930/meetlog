package ac.dankook.backend.domain.auth.controller;

import ac.dankook.backend.domain.auth.dto.AuthResponse;
import ac.dankook.backend.domain.auth.dto.LoginRequest;
import ac.dankook.backend.domain.auth.dto.RefreshRequest;
import ac.dankook.backend.domain.auth.dto.RegisterRequest;
import ac.dankook.backend.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final ObjectProvider<AuthService> authServiceProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService().register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService().login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService().refresh(request));
    }

    private AuthService authService() {
        return authServiceProvider.getIfAvailable(() -> {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "AuthService bean is not configured");
        });
    }
}
