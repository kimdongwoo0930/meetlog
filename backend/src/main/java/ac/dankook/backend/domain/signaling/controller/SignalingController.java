package ac.dankook.backend.domain.signaling.controller;

import ac.dankook.backend.domain.signaling.dto.SignalMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    // 클라이언트 → /app/meetings/{meetingId}/signal
    // 서버  → /topic/meetings/{meetingId}/signal 로 전체 릴레이
    @MessageMapping("/meetings/{meetingId}/signal")
    public void relay(
            @DestinationVariable String meetingId,
            @Payload SignalMessage message
    ) {
        messagingTemplate.convertAndSend(
                "/topic/meetings/" + meetingId + "/signal",
                message
        );
    }
}
