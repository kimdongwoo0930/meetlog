package ac.dankook.backend.domain.meeting.controller;

import ac.dankook.backend.domain.meeting.dto.meeting.AddParticipantRequest;
import ac.dankook.backend.domain.meeting.dto.meeting.CreateMeetingRequest;
import ac.dankook.backend.domain.meeting.dto.meeting.MeetingResponse;
import ac.dankook.backend.domain.meeting.dto.meeting.MeetingSummaryResponse;
import ac.dankook.backend.domain.meeting.dto.meeting.UpdateMeetingStatusRequest;
import ac.dankook.backend.domain.meeting.service.MeetingService;
import ac.dankook.backend.domain.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    @GetMapping
    public ResponseEntity<List<MeetingSummaryResponse>> getMyMeetings() {
        return ResponseEntity.ok(meetingService.getMyMeetings());
    }

    @PostMapping
    public ResponseEntity<MeetingResponse> createMeeting(@Valid @RequestBody CreateMeetingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(meetingService.createMeeting(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingResponse> getMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.getMeeting(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MeetingResponse> updateMeetingStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMeetingStatusRequest request
    ) {
        return ResponseEntity.ok(meetingService.updateMeetingStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeeting(@PathVariable Long id) {
        meetingService.deleteMeeting(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<UserResponse>> getParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.getParticipants(id));
    }

    @PostMapping("/{id}/participants")
    public ResponseEntity<UserResponse> addParticipant(
            @PathVariable Long id,
            @Valid @RequestBody AddParticipantRequest request
    ) {
        return ResponseEntity.ok(meetingService.addParticipant(id, request.email()));
    }
}
