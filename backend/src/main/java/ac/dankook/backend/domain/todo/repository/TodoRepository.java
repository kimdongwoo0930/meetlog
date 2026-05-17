package ac.dankook.backend.domain.todo.repository;

import ac.dankook.backend.domain.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findAllByMeetingIdOrderByCreatedAtAsc(Long meetingId);

    Optional<Todo> findByIdAndMeetingId(Long id, Long meetingId);
}
