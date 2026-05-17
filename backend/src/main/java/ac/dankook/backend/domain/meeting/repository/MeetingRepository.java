package ac.dankook.backend.domain.meeting.repository;

import ac.dankook.backend.domain.meeting.entity.Meeting;
import ac.dankook.backend.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    @Query("SELECT DISTINCT m FROM Meeting m LEFT JOIN m.participants p WHERE m.hostUser = :user OR p = :user ORDER BY m.createdAt DESC")
    List<Meeting> findAllByUser(@Param("user") User user);
}
