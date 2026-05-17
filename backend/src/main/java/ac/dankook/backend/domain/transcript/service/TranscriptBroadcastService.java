package ac.dankook.backend.domain.transcript.service;

import ac.dankook.backend.domain.transcript.dto.TranscriptSegmentDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TranscriptBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcast(Long meetingId, TranscriptSegmentDto segment) {
        messagingTemplate.convertAndSend(
                "/topic/meetings/" + meetingId + "/transcript",
                segment
        );
    }
}
