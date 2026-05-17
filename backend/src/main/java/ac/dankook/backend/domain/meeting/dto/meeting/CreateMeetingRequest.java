package ac.dankook.backend.domain.meeting.dto.meeting;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateMeetingRequest(
        @NotBlank String title,
        List<Long> participantIds
) {
}
