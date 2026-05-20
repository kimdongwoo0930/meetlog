package ac.dankook.backend.domain.transcript.service;

import ac.dankook.backend.global.exception.CustomException;
import ac.dankook.backend.global.exception.ErrorCode;
import ac.dankook.backend.domain.meeting.entity.Meeting;
import ac.dankook.backend.domain.meeting.entity.MeetingStatus;
import ac.dankook.backend.domain.meeting.repository.MeetingRepository;
import ac.dankook.backend.domain.transcript.dto.SaveSegmentRequest;
import ac.dankook.backend.domain.transcript.dto.TranscriptSegmentDto;
import ac.dankook.backend.domain.transcript.entity.TranscriptSegment;
import ac.dankook.backend.domain.transcript.repository.TranscriptSegmentRepository;
import ac.dankook.backend.domain.user.entity.User;
import ac.dankook.backend.domain.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptService {

    static final String KEY_PREFIX = "meeting:transcript:";

    private final MeetingRepository meetingRepository;
    private final TranscriptSegmentRepository segmentRepository;
    private final UserRepository userRepository;
    private final TranscriptBroadcastService broadcastService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Transactional
    public TranscriptSegmentDto saveAndBroadcast(Long meetingId, SaveSegmentRequest request) {
        User currentUser = getCurrentUser();
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));

        if (!meeting.isParticipant(currentUser) && !meeting.isHost(currentUser)) {
            throw new CustomException(ErrorCode.MEETING_FORBIDDEN);
        }

        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new CustomException(ErrorCode.MEETING_INVALID_STATUS_TRANSITION);
        }

        LocalDateTime now = LocalDateTime.now();
        pushToRedis(meetingId, request, now);

        TranscriptSegmentDto dto = new TranscriptSegmentDto(
                System.currentTimeMillis(),
                request.speaker(),
                request.content(),
                request.startTime(),
                request.endTime(),
                now
        );
        broadcastService.broadcast(meetingId, dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<TranscriptSegmentDto> getActiveTranscripts(Long meetingId) {
        String key = KEY_PREFIX + meetingId;
        List<String> cached = redisTemplate.opsForList().range(key, 0, -1);
        if (cached == null || cached.isEmpty()) return List.of();

        List<TranscriptSegmentDto> result = new ArrayList<>();
        long baseId = System.currentTimeMillis();
        for (int i = 0; i < cached.size(); i++) {
            TranscriptSegmentDto dto = deserializeToDto(cached.get(i), baseId + i);
            if (dto != null) result.add(dto);
        }
        return result;
    }

    /** 회의 종료 시 Redis → DB 일괄 저장. MeetingService에서 호출. */
    @Transactional
    public void flushToDatabase(Meeting meeting) {
        String key = KEY_PREFIX + meeting.getId();
        List<String> cached = redisTemplate.opsForList().range(key, 0, -1);
        if (cached == null || cached.isEmpty()) return;

        List<TranscriptSegment> segments = cached.stream()
                .map(json -> deserialize(json, meeting))
                .filter(Objects::nonNull)
                .toList();

        segmentRepository.saveAll(segments);
        redisTemplate.delete(key);
        log.info("meeting={} 세그먼트 {}건 DB 저장 완료", meeting.getId(), segments.size());
    }

    private void pushToRedis(Long meetingId, SaveSegmentRequest req, LocalDateTime now) {
        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "speaker", req.speaker(),
                    "content", req.content(),
                    "startTime", req.startTime(),
                    "endTime", req.endTime(),
                    "createdAt", now.toString()
            ));
            redisTemplate.opsForList().rightPush(KEY_PREFIX + meetingId, json);
        } catch (Exception e) {
            // Redis 장애 시 즉시 DB 저장으로 폴백
            log.warn("Redis 저장 실패, DB fallback. meetingId={}", meetingId, e);
            Meeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
            segmentRepository.save(TranscriptSegment.builder()
                    .meeting(meeting)
                    .speaker(req.speaker())
                    .content(req.content())
                    .startTime(req.startTime())
                    .endTime(req.endTime())
                    .build());
        }
    }

    private TranscriptSegmentDto deserializeToDto(String json, long id) {
        try {
            JsonNode node = objectMapper.readTree(json);
            return new TranscriptSegmentDto(
                    id,
                    node.get("speaker").asText(),
                    node.get("content").asText(),
                    node.get("startTime").asDouble(),
                    node.get("endTime").asDouble(),
                    LocalDateTime.parse(node.get("createdAt").asText())
            );
        } catch (Exception e) {
            log.error("DTO 역직렬화 실패: {}", json, e);
            return null;
        }
    }

    private TranscriptSegment deserialize(String json, Meeting meeting) {
        try {
            JsonNode node = objectMapper.readTree(json);
            return TranscriptSegment.builder()
                    .meeting(meeting)
                    .speaker(node.get("speaker").asText())
                    .content(node.get("content").asText())
                    .startTime(node.get("startTime").asDouble())
                    .endTime(node.get("endTime").asDouble())
                    .build();
        } catch (JsonProcessingException e) {
            log.error("세그먼트 역직렬화 실패: {}", json, e);
            return null;
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_TOKEN));
    }
}
