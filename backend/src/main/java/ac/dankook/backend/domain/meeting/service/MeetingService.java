package ac.dankook.backend.domain.meeting.service;

import ac.dankook.backend.global.exception.CustomException;
import ac.dankook.backend.global.exception.ErrorCode;
import ac.dankook.backend.domain.meeting.dto.meeting.CreateMeetingRequest;
import ac.dankook.backend.domain.meeting.dto.meeting.MeetingResponse;
import ac.dankook.backend.domain.meeting.dto.meeting.MeetingSummaryResponse;
import ac.dankook.backend.domain.meeting.dto.meeting.UpdateMeetingStatusRequest;
import ac.dankook.backend.domain.meeting.entity.Meeting;
import ac.dankook.backend.domain.meeting.entity.MeetingStatus;
import ac.dankook.backend.domain.meeting.repository.MeetingRepository;
import ac.dankook.backend.domain.todo.dto.TodoResponse;
import ac.dankook.backend.domain.todo.entity.Todo;
import ac.dankook.backend.domain.todo.repository.TodoRepository;
import ac.dankook.backend.domain.transcript.service.TranscriptService;
import ac.dankook.backend.domain.user.dto.UserResponse;
import ac.dankook.backend.domain.user.entity.User;
import ac.dankook.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final TodoRepository todoRepository;
    private final UserRepository userRepository;
    private final TranscriptService transcriptService;

    @Transactional(readOnly = true)
    public List<MeetingSummaryResponse> getMyMeetings() {
        User currentUser = getCurrentUser();
        return meetingRepository.findAllByUser(currentUser).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional
    public MeetingResponse createMeeting(CreateMeetingRequest request) {
        User currentUser = getCurrentUser();
        Set<User> participants = new LinkedHashSet<>();
        participants.add(currentUser);
        participants.addAll(resolveParticipants(request.participantIds()));

        String pwd = (request.password() != null && !request.password().isBlank()) ? request.password() : null;
        Meeting meeting = Meeting.builder()
                .title(request.title())
                .status(MeetingStatus.IN_PROGRESS)
                .hostUser(currentUser)
                .participants(participants)
                .startedAt(LocalDateTime.now())
                .password(pwd)
                .maxParticipants(request.maxParticipants())
                .recordingEnabled(request.recordingEnabled())
                .build();

        Meeting saved = meetingRepository.save(meeting);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MeetingResponse getMeeting(Long meetingId) {
        Meeting meeting = findMeeting(meetingId);
        requireParticipant(meeting, getCurrentUser());
        return toResponse(meeting);
    }

    @Transactional
    public MeetingResponse updateMeetingStatus(Long meetingId, UpdateMeetingStatusRequest request) {
        Meeting meeting = findMeeting(meetingId);
        requireHost(meeting, getCurrentUser());
        validateStatusTransition(meeting, request.status());

        if (request.status() == MeetingStatus.IN_PROGRESS) {
            meeting.start(LocalDateTime.now());
        } else if (request.status() == MeetingStatus.REVIEWING) {
            transcriptService.flushToDatabase(meeting);
            meeting.startReviewing(LocalDateTime.now());
        } else if (request.status() == MeetingStatus.GENERATING) {
            meeting.startGenerating();
        } else if (request.status() == MeetingStatus.COMPLETED) {
            meeting.complete(meeting.getEndedAt() != null ? meeting.getEndedAt() : LocalDateTime.now());
        }

        return toResponse(meeting);
    }

    @Transactional
    public void deleteMeeting(Long meetingId) {
        Meeting meeting = findMeeting(meetingId);
        requireHost(meeting, getCurrentUser());
        meetingRepository.delete(meeting);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getParticipants(Long meetingId) {
        Meeting meeting = findMeeting(meetingId);
        requireParticipant(meeting, getCurrentUser());
        return meeting.getParticipants().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse addParticipant(Long meetingId, String email) {
        Meeting meeting = findMeeting(meetingId);
        requireHost(meeting, getCurrentUser());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        meeting.addParticipant(user);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<TodoResponse> getTodos(Long meetingId) {
        Meeting meeting = findMeeting(meetingId);
        requireParticipant(meeting, getCurrentUser());
        return todoRepository.findAllByMeetingIdOrderByCreatedAtAsc(meetingId).stream()
                .map(this::toTodoResponse)
                .toList();
    }

    @Transactional
    public TodoResponse completeTodo(Long meetingId, Long todoId) {
        Meeting meeting = findMeeting(meetingId);
        requireParticipant(meeting, getCurrentUser());

        Todo todo = todoRepository.findByIdAndMeetingId(todoId, meetingId)
                .orElseThrow(() -> new CustomException(ErrorCode.TODO_NOT_FOUND));

        todo.markDone();
        return toTodoResponse(todo);
    }

    private Meeting findMeeting(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new CustomException(ErrorCode.AUTH_INVALID_TOKEN);
        }

        Object principal = authentication.getPrincipal();
        String email = principal instanceof String ? (String) principal : authentication.getName();
        if (!StringUtils.hasText(email)) {
            throw new CustomException(ErrorCode.AUTH_INVALID_TOKEN);
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_TOKEN));
    }

    private List<User> resolveParticipants(List<Long> participantIds) {
        if (participantIds == null || participantIds.isEmpty()) {
            return List.of();
        }

        Set<Long> uniqueIds = new LinkedHashSet<>(participantIds);
        List<User> participants = StreamSupport.stream(userRepository.findAllById(uniqueIds).spliterator(), false)
                .toList();
        if (participants.size() != uniqueIds.size()) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        return participants;
    }

    private void requireParticipant(Meeting meeting, User user) {
        if (!meeting.isHost(user) && !meeting.isParticipant(user)) {
            throw new CustomException(ErrorCode.MEETING_FORBIDDEN);
        }
    }

    private void requireHost(Meeting meeting, User user) {
        if (!meeting.isHost(user)) {
            throw new CustomException(ErrorCode.MEETING_FORBIDDEN);
        }
    }

    private void validateStatusTransition(Meeting meeting, MeetingStatus nextStatus) {
        MeetingStatus currentStatus = meeting.getStatus();
        boolean valid = (currentStatus == MeetingStatus.SCHEDULED   && nextStatus == MeetingStatus.IN_PROGRESS)
                || (currentStatus == MeetingStatus.IN_PROGRESS  && nextStatus == MeetingStatus.REVIEWING)
                || (currentStatus == MeetingStatus.IN_PROGRESS  && nextStatus == MeetingStatus.COMPLETED)
                || (currentStatus == MeetingStatus.REVIEWING    && nextStatus == MeetingStatus.GENERATING)
                || (currentStatus == MeetingStatus.REVIEWING    && nextStatus == MeetingStatus.COMPLETED)
                || (currentStatus == MeetingStatus.GENERATING   && nextStatus == MeetingStatus.COMPLETED)
                || currentStatus == nextStatus;

        if (!valid) {
            throw new CustomException(ErrorCode.MEETING_INVALID_STATUS_TRANSITION);
        }
    }

    @Transactional
    public void verifyPassword(Long meetingId, String password) {
        Meeting meeting = findMeeting(meetingId);
        if (meeting.getPassword() == null || !meeting.getPassword().equals(password)) {
            throw new CustomException(ErrorCode.MEETING_FORBIDDEN);
        }
    }

    private MeetingSummaryResponse toSummaryResponse(Meeting meeting) {
        return new MeetingSummaryResponse(
                meeting.getId(),
                meeting.getTitle(),
                meeting.getStatus(),
                meeting.getHostUser().getId(),
                meeting.getParticipants().size(),
                meeting.getStartedAt(),
                meeting.getEndedAt(),
                meeting.getCreatedAt(),
                meeting.getPassword() != null && !meeting.getPassword().isBlank(),
                meeting.getMaxParticipants(),
                meeting.isRecordingEnabled(),
                meeting.getMeetingMinutes() != null
        );
    }

    private MeetingResponse toResponse(Meeting meeting) {
        return new MeetingResponse(
                meeting.getId(),
                meeting.getTitle(),
                meeting.getStatus(),
                meeting.getHostUser().getId(),
                meeting.getHostUser().getEmail(),
                meeting.getParticipants().stream()
                        .map(User::getId)
                        .sorted()
                        .toList(),
                meeting.getStartedAt(),
                meeting.getEndedAt(),
                meeting.getCreatedAt(),
                meeting.getMeetingMinutes() == null ? null : new MeetingResponse.MeetingMinutesResponse(
                        meeting.getMeetingMinutes().getSummary(),
                        meeting.getMeetingMinutes().getDecisions(),
                        meeting.getMeetingMinutes().getQuestions(),
                        meeting.getMeetingMinutes().getNextAgenda()
                ),
                meeting.getTodos().stream()
                        .map(this::toTodoResponse)
                        .toList(),
                meeting.getSegments().stream()
                        .map(segment -> new MeetingResponse.TranscriptSegmentResponse(
                                segment.getId(),
                                segment.getSpeaker(),
                                segment.getContent(),
                                segment.getStartTime(),
                                segment.getEndTime(),
                                segment.getCreatedAt()
                        ))
                        .toList(),
                meeting.getPassword() != null && !meeting.getPassword().isBlank(),
                meeting.getMaxParticipants(),
                meeting.isRecordingEnabled()
        );
    }

    private TodoResponse toTodoResponse(Todo todo) {
        return new TodoResponse(
                todo.getId(),
                todo.getText(),
                todo.getAssignee(),
                todo.isDone(),
                todo.getCreatedAt()
        );
    }
}
