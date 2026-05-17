package ac.dankook.backend.global.exception;

import java.time.LocalDateTime;

public record ErrorResponse(
        String code,
        String message,
        int status,
        LocalDateTime timestamp
) {
}
