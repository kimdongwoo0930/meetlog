package ac.dankook.backend.domain.meeting.entity;

public enum MeetingStatus {
    SCHEDULED,
    IN_PROGRESS,
    REVIEWING,    // 호스트 STT 검토 중
    GENERATING,   // AI 회의록 생성 중
    COMPLETED     // 회의록 완성
}
