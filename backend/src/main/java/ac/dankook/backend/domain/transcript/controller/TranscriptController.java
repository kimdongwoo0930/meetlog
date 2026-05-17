package ac.dankook.backend.domain.transcript.controller;

import ac.dankook.backend.domain.transcript.dto.SaveSegmentRequest;
import ac.dankook.backend.domain.transcript.dto.TranscriptSegmentDto;
import ac.dankook.backend.domain.transcript.service.TranscriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/meetings/{meetingId}/segments")
public class TranscriptController {

    private final TranscriptService transcriptService;

    @PostMapping
    public ResponseEntity<TranscriptSegmentDto> saveSegment(
            @PathVariable Long meetingId,
            @Valid @RequestBody SaveSegmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transcriptService.saveAndBroadcast(meetingId, request));
    }
}
