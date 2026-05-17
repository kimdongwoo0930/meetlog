package ac.dankook.backend.domain.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken
) {
}
