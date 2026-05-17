package ac.dankook.backend.domain.auth.service;

import ac.dankook.backend.domain.auth.dto.AuthResponse;
import ac.dankook.backend.domain.auth.dto.LoginRequest;
import ac.dankook.backend.domain.auth.dto.RefreshRequest;
import ac.dankook.backend.domain.auth.dto.RegisterRequest;
import ac.dankook.backend.global.exception.CustomException;
import ac.dankook.backend.global.exception.ErrorCode;
import ac.dankook.backend.global.jwt.JwtUtil;
import ac.dankook.backend.domain.user.entity.User;
import ac.dankook.backend.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new CustomException(ErrorCode.USER_EMAIL_DUPLICATED);
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .build();

        userRepository.save(user);

        // 토큰 생성
        String accessToken = jwtUtil.generateAccessToken(user.getEmail(),user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(accessToken,refreshToken);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if(!passwordEncoder.matches(request.password(),user.getPassword())){
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        // 로그인 성공시 토큰 생성
        String accessToken = jwtUtil.generateAccessToken(user.getEmail(),user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(accessToken,refreshToken);

    }

    @Override
    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.refreshToken();

        if (!StringUtils.hasText(refreshToken)) {
            throw new CustomException(ErrorCode.AUTH_INVALID_TOKEN);
        }

        if (jwtUtil.isExpired(refreshToken)) {
            throw new CustomException(ErrorCode.AUTH_TOKEN_EXPIRED);
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.AUTH_INVALID_TOKEN);
        }

        String email = jwtUtil.getEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_TOKEN));

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(accessToken, newRefreshToken);
    }
}
