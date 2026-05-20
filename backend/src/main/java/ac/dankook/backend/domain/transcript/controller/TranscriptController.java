package ac.dankook.backend.domain.transcript.controller;

import ac.dankook.backend.domain.transcript.dto.SaveSegmentRequest;
import ac.dankook.backend.domain.transcript.dto.TranscriptSegmentDto;
import ac.dankook.backend.domain.transcript.dto.UpdateSegmentRequest;
import ac.dankook.backend.domain.transcript.service.TranscriptService;
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
@RequestMapping("/api/meetings/{meetingId}/segments")
public class TranscriptController {

    private final TranscriptService transcriptService;

    @GetMapping
    public ResponseEntity<List<TranscriptSegmentDto>> getSegments(@PathVariable Long meetingId) {
        return ResponseEntity.ok(transcriptService.getActiveTranscripts(meetingId));
    }

    @PostMapping
    public ResponseEntity<TranscriptSegmentDto> saveSegment(
            @PathVariable Long meetingId,
            @Valid @RequestBody SaveSegmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transcriptService.saveAndBroadcast(meetingId, request));
    }

    @PatchMapping("/{segmentId}")
    public ResponseEntity<Void> updateSegment(
            @PathVariable Long meetingId,
            @PathVariable String segmentId,
            @Valid @RequestBody UpdateSegmentRequest request
    ) {
        transcriptService.updateSegment(meetingId, segmentId, request.content());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{segmentId}")
    public ResponseEntity<Void> deleteSegment(
            @PathVariable Long meetingId,
            @PathVariable String segmentId
    ) {
        transcriptService.deleteSegment(meetingId, segmentId);
        return ResponseEntity.noContent().build();
    }
}
