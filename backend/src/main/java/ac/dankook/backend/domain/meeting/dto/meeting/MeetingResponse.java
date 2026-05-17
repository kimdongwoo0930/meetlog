package ac.dankook.backend.domain.meeting.dto.meeting;

import ac.dankook.backend.domain.meeting.entity.MeetingStatus;
import ac.dankook.backend.domain.todo.dto.TodoResponse;

import java.time.LocalDateTime;
import java.util.List;

public record MeetingResponse(
        Long id,
        String title,
        MeetingStatus status,
        Long hostUserId,
        String hostUserEmail,
        List<Long> participantIds,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        LocalDateTime createdAt,
        MeetingMinutesResponse minutes,
        List<TodoResponse> todos,
        List<TranscriptSegmentResponse> segments
) {
    public record MeetingMinutesResponse(
            String summary,
            List<String> decisions,
            List<String> questions,
            List<String> nextAgenda
    ) {
    }

    public record TranscriptSegmentResponse(
            Long id,
            String speaker,
            String content,
            Double startTime,
            Double endTime,
            LocalDateTime createdAt
    ) {
    }
}
