package ac.dankook.backend.domain.auth.service;

import ac.dankook.backend.domain.auth.dto.AuthResponse;
import ac.dankook.backend.domain.auth.dto.LoginRequest;
import ac.dankook.backend.domain.auth.dto.RefreshRequest;
import ac.dankook.backend.domain.auth.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshRequest request);
}
