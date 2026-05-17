package ac.dankook.backend.domain.signaling.dto;

public record SignalMessage(
        String type,    // offer | answer | ice-candidate | join | leave
        String from,    // 발신자 식별자 (userId or 이름)
        String to,      // 수신자 식별자 (null이면 전체 브로드캐스트)
        Object payload  // SDP 또는 ICE candidate JSON
) {}
