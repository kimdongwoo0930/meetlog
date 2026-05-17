package ac.dankook.backend.domain.meeting.dto.meeting;

import ac.dankook.backend.domain.meeting.entity.MeetingStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateMeetingStatusRequest(
        @NotNull MeetingStatus status
) {
}
