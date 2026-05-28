package ac.dankook.backend.domain.meeting.entity;

import ac.dankook.backend.global.entity.BaseCreatedAtEntity;
import ac.dankook.backend.domain.entity.MeetingMinutes;
import ac.dankook.backend.domain.todo.entity.Todo;
import ac.dankook.backend.domain.transcript.entity.TranscriptSegment;
import ac.dankook.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "meetings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Meeting extends BaseCreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;


    @Column(length = 50)
    private String meetingType;

    @Column(length = 500)
    private String meetingGoal;

    @Column(columnDefinition = "TEXT")
    private String meetingAgenda;

    @Column(length = 100)
    private String password;

    @Column
    private Long maxParticipants;

    

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MeetingStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User hostUser;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "meeting_participants",
            joinColumns = @JoinColumn(name = "meeting_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants = new HashSet<>();

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    // 회의록과 일대일 양방향 연관관계 설정
    @OneToOne(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private MeetingMinutes meetingMinutes;


    // 할 일과 연관된 엔티티 추가
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Todo> todos = new ArrayList<>();


    // 회의록과 연관된 엔티티 추가
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TranscriptSegment> segments = new ArrayList<>();




    /**
     * 생성자
     * @param title
     * @param status
     * @param hostUser
     * @param participants
     * @param startedAt
     * @param endedAt
     * @param meetingMinutes
     */


    
    @Builder
    public Meeting(String title, MeetingStatus status, User hostUser, Set<User> participants,
                   LocalDateTime startedAt, LocalDateTime endedAt, MeetingMinutes meetingMinutes) {
        this.title = title;
        this.status = status == null ? MeetingStatus.SCHEDULED : status;
        this.hostUser = hostUser;
        this.participants = participants == null ? new HashSet<>() : participants;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.meetingMinutes = meetingMinutes;
    }

    public void addParticipant(User user) {
        this.participants.add(user);
    }

    public void setMeetingMinutes(MeetingMinutes meetingMinutes) {
        this.meetingMinutes = meetingMinutes;
    }

    public void addTodo(Todo todo) {
        this.todos.add(todo);
    }

    public void addSegment(TranscriptSegment segment) {
        this.segments.add(segment);
    }

    public void start(LocalDateTime startedAt) {
        this.status = MeetingStatus.IN_PROGRESS;
        this.startedAt = startedAt;
    }

    public void startReviewing(LocalDateTime endedAt) {
        this.status = MeetingStatus.REVIEWING;
        this.endedAt = endedAt;
    }

    public void startGenerating() {
        this.status = MeetingStatus.GENERATING;
    }

    public void complete() {
        this.status = MeetingStatus.COMPLETED;
    }

    // 하위 호환용
    public void complete(LocalDateTime endedAt) {
        this.status = MeetingStatus.COMPLETED;
        this.endedAt = endedAt;
    }

    public boolean isHost(User user) {
        return this.hostUser != null && this.hostUser.getId() != null && this.hostUser.getId().equals(user.getId());
    }

    public boolean isParticipant(User user) {
        return this.participants != null && this.participants.stream()
                .anyMatch(participant -> participant.getId() != null && participant.getId().equals(user.getId()));
    }
}
