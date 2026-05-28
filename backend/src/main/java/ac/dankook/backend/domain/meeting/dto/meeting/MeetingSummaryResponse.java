package ac.dankook.backend.domain.meeting.dto.meeting;

import ac.dankook.backend.domain.meeting.entity.MeetingStatus;

import java.time.LocalDateTime;

public record MeetingSummaryResponse(
        Long id,
        String title,
        MeetingStatus status,
        Long hostUserId,
        int participantCount,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        LocalDateTime createdAt,
        boolean hasPassword,
        Long maxParticipants,
        boolean recordingEnabled
) {
}
