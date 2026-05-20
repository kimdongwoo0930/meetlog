package ac.dankook.backend.domain.transcript.dto;

public record TranscriptEventDto(
        String action,   // "create" | "update" | "delete"
        String id,
        String speaker,
        String content,
        Double startTime,
        Double endTime,
        String createdAt
) {
    public static TranscriptEventDto create(TranscriptSegmentDto seg) {
        return new TranscriptEventDto(
                "create", seg.id(), seg.speaker(), seg.content(),
                seg.startTime(), seg.endTime(),
                seg.createdAt() != null ? seg.createdAt().toString() : null
        );
    }

    public static TranscriptEventDto update(String id, String content) {
        return new TranscriptEventDto("update", id, null, content, null, null, null);
    }

    public static TranscriptEventDto delete(String id) {
        return new TranscriptEventDto("delete", id, null, null, null, null, null);
    }
}
