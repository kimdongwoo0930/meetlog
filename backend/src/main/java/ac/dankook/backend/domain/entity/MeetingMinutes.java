package ac.dankook.backend.domain.entity;

import ac.dankook.backend.global.entity.BaseCreatedAtEntity;
import ac.dankook.backend.domain.meeting.entity.Meeting;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meeting_minutes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingMinutes extends BaseCreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meeting_id", nullable = false, unique = true)
    private Meeting meeting;

    @Column(nullable = false, columnDefinition = "text")
    private String summary;

    @ElementCollection
    @CollectionTable(name = "meeting_minutes_decisions", joinColumns = @JoinColumn(name = "meeting_minutes_id"))
    private List<String> decisions = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "meeting_minutes_questions", joinColumns = @JoinColumn(name = "meeting_minutes_id"))
    private List<String> questions = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "meeting_minutes_next_agenda", joinColumns = @JoinColumn(name = "meeting_minutes_id"))
    private List<String> nextAgenda = new ArrayList<>();

    @Builder
    public MeetingMinutes(Meeting meeting, String summary, List<String> decisions, List<String> questions, List<String> nextAgenda) {
        this.meeting = meeting;
        this.summary = summary;
        this.decisions = decisions == null ? new ArrayList<>() : decisions;
        this.questions = questions == null ? new ArrayList<>() : questions;
        this.nextAgenda = nextAgenda == null ? new ArrayList<>() : nextAgenda;
    }
}
