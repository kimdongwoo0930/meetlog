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
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final MeetingRepository meetingRepository;
    private final TranscriptSegmentRepository segmentRepository;
    private final UserRepository userRepository;
    private final TranscriptBroadcastService broadcastService;

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

        TranscriptSegment segment = TranscriptSegment.builder()
                .meeting(meeting)
                .speaker(request.speaker())
                .content(request.content())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .build();

        TranscriptSegment saved = segmentRepository.save(segment);
        TranscriptSegmentDto dto = TranscriptSegmentDto.from(saved);
        broadcastService.broadcast(meetingId, dto);

        return dto;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_TOKEN));
    }
}
