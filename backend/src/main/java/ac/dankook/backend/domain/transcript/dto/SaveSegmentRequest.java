package ac.dankook.backend.domain.transcript.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveSegmentRequest(
        @NotBlank String speaker,
        @NotBlank String content,
        @NotNull Double startTime,
        @NotNull Double endTime
) {}
