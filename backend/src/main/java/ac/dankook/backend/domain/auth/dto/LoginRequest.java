package ac.dankook.backend.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 100) String password
) {
}
