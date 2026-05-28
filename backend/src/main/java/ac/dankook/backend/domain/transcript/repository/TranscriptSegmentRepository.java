package ac.dankook.backend.domain.transcript.repository;

import ac.dankook.backend.domain.transcript.entity.TranscriptSegment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TranscriptSegmentRepository extends JpaRepository<TranscriptSegment, Long> {
    List<TranscriptSegment> findAllByMeetingIdOrderByStartTimeAsc(Long meetingId);
    Optional<TranscriptSegment> findBySegmentUuid(String segmentUuid);
    void deleteBySegmentUuid(String segmentUuid);
}
