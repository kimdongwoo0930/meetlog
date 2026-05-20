package ac.dankook.backend.domain.transcript.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSegmentRequest(
        @NotBlank String content
) {}
