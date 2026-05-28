package ac.dankook.backend.domain.transcript.entity;

import ac.dankook.backend.global.entity.BaseCreatedAtEntity;
import ac.dankook.backend.domain.meeting.entity.Meeting;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "transcript_segments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TranscriptSegment extends BaseCreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 36, unique = true)
    private String segmentUuid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @Column(nullable = false, length = 100)
    private String speaker;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(nullable = false)
    private Double startTime;

    @Column(nullable = false)
    private Double endTime;

    public void updateContent(String content) {
        this.content = content;
    }

    @Builder
    public TranscriptSegment(String segmentUuid, Meeting meeting, String speaker, String content, Double startTime, Double endTime) {
        this.segmentUuid = segmentUuid;
        this.meeting = meeting;
        this.speaker = speaker;
        this.content = content;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
