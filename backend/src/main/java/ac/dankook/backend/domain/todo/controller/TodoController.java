package ac.dankook.backend.domain.todo.controller;

import ac.dankook.backend.domain.meeting.service.MeetingService;
import ac.dankook.backend.domain.todo.dto.TodoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/meetings/{meetingId}/todos")
public class TodoController {

    private final MeetingService meetingService;

    @GetMapping
    public ResponseEntity<List<TodoResponse>> getTodos(@PathVariable Long meetingId) {
        return ResponseEntity.ok(meetingService.getTodos(meetingId));
    }

    @PatchMapping("/{todoId}/complete")
    public ResponseEntity<TodoResponse> completeTodo(@PathVariable Long meetingId, @PathVariable Long todoId) {
        return ResponseEntity.ok(meetingService.completeTodo(meetingId, todoId));
    }
}
