package ac.dankook.backend.domain.meeting.dto.meeting;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddParticipantRequest(@NotBlank @Email String email) {}
