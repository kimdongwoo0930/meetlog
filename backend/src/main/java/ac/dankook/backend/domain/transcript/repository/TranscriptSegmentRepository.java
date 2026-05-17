package ac.dankook.backend.domain.transcript.repository;

import ac.dankook.backend.domain.transcript.entity.TranscriptSegment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TranscriptSegmentRepository extends JpaRepository<TranscriptSegment, Long> {
    List<TranscriptSegment> findAllByMeetingIdOrderByStartTimeAsc(Long meetingId);
}
