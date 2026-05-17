package ac.dankook.backend.domain.todo.entity;

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
@Table(name = "todos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Todo extends BaseCreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @Column(nullable = false, length = 500)
    private String text;

    @Column(nullable = true, length = 100)
    private String assignee;

    @Column(nullable = false)
    private boolean done;

    @Builder
    public Todo(Meeting meeting, String text, String assignee, boolean done) {
        this.meeting = meeting;
        this.text = text;
        this.assignee = assignee;
        this.done = done;
    }

    public void markDone() {
        this.done = true;
    }
}
