package ac.dankook.backend.domain.todo.dto;

import java.time.LocalDateTime;

public record TodoResponse(
        Long id,
        String text,
        String assignee,
        boolean completed,
        LocalDateTime createdAt
) {
}
