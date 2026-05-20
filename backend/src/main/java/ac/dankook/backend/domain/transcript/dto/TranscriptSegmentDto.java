package ac.dankook.backend.domain.transcript.dto;

import ac.dankook.backend.domain.transcript.entity.TranscriptSegment;

import java.time.LocalDateTime;

public record TranscriptSegmentDto(
        String id,
        String speaker,
        String content,
        Double startTime,
        Double endTime,
        LocalDateTime createdAt
) {
    public static TranscriptSegmentDto from(TranscriptSegment segment) {
        return new TranscriptSegmentDto(
                segment.getId().toString(),
                segment.getSpeaker(),
                segment.getContent(),
                segment.getStartTime(),
                segment.getEndTime(),
                segment.getCreatedAt()
        );
    }
}
