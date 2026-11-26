package com.barangay.service;

import com.barangay.dto.ChangePasswordRequest;
import com.barangay.dto.ForgotPasswordRequest;
import com.barangay.dto.ForgotPasswordResponse;
import com.barangay.dto.LoginRequest;
import com.barangay.dto.LoginResponse;
import com.barangay.dto.RegisterRequest;
import com.barangay.dto.ResetPasswordRequest;
import com.barangay.dto.UserResponse;
import com.barangay.exception.ApiException;
import com.barangay.model.User;
import com.barangay.repository.PasswordResetTokenRepository;
import com.barangay.repository.PasswordResetTokenRepository.ResetTokenRecord;
import com.barangay.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final int RESET_TOKEN_EXPIRY_MINUTES = 15;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users,
                       PasswordResetTokenRepository resetTokens,
                       PasswordEncoder encoder,
                       JwtService jwt) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public void register(RegisterRequest r) {
        String phone = PasswordPolicy.normalizeAndValidatePhone(r.phone());
        if (users.existsByEmail(r.email().trim())) throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS");
        if (users.existsByPhone(phone)) throw new ApiException(HttpStatus.CONFLICT, "PHONE_EXISTS");
        if (users.existsByUsername(r.username().trim())) throw new ApiException(HttpStatus.CONFLICT, "USERNAME_EXISTS");

        users.insert(r, phone, encoder.encode(r.password()));
    }

    public LoginResponse login(LoginRequest req) {
        User user = users.findByUsername(req.username().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (!encoder.matches(req.password(), user.passwordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }
        // Pending accounts get 401 too; Login.jsx shows "not yet confirmed by the Barangay".
        if (!user.active()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_PENDING");
        }
        return new LoginResponse(jwt.generate(user.id(), user.role()), UserResponse.from(user));
    }

    public UserResponse me(String authHeader) {
        return UserResponse.from(requireUser(authHeader));
    }

    public User requireUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "MISSING_TOKEN");
        }
        try {
            Claims claims = jwt.parse(authHeader.substring(7));
            User user = users.findById(Long.parseLong(claims.getSubject()))
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN"));
            if (!user.active()) throw new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_PENDING");
            return user;
        } catch (JwtException | IllegalArgumentException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
        }
    }

    @Transactional
    public void changePassword(String authHeader, ChangePasswordRequest req) {
        User user = requireUser(authHeader);

        if (!encoder.matches(req.currentPassword(), user.passwordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CURRENT_PASSWORD");
        }

        PasswordPolicy.validateNewPassword(req.newPassword(), req.confirmPassword());

        if (encoder.matches(req.newPassword(), user.passwordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_PASSWORD");
        }

        users.updatePasswordHash(user.id(), encoder.encode(req.newPassword()));
        resetTokens.invalidateUnusedTokensForUser(user.id());
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        String phone = PasswordPolicy.normalizeAndValidatePhone(req.phone());
        User user = users.findByIdentity(
                req.username().trim(),
                req.email().trim().toLowerCase(),
                phone,
                req.dob())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "IDENTITY_VERIFICATION_FAILED"));

        if (!user.active()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_PENDING");
        }

        resetTokens.invalidateUnusedTokensForUser(user.id());

        String rawToken = generateSecureToken();
        String tokenHash = sha256Hex(rawToken);
        Instant expiresAt = Instant.now().plus(RESET_TOKEN_EXPIRY_MINUTES, ChronoUnit.MINUTES);

        resetTokens.insertToken(user.id(), tokenHash, expiresAt);

        return new ForgotPasswordResponse(
                "IDENTITY_VERIFIED",
                rawToken,
                RESET_TOKEN_EXPIRY_MINUTES,
                expiresAt);
    }

    public Instant validateResetToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OR_EXPIRED_TOKEN");
        }
        ResetTokenRecord record = resetTokens.findValidByTokenHash(sha256Hex(rawToken.trim()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OR_EXPIRED_TOKEN"));
        return record.expiresAt();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        PasswordPolicy.validateNewPassword(req.newPassword(), req.confirmPassword());

        String tokenHash = sha256Hex(req.token().trim());
        ResetTokenRecord record = resetTokens.findValidByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OR_EXPIRED_TOKEN"));

        User user = users.findById(record.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OR_EXPIRED_TOKEN"));

        if (!user.active()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_PENDING");
        }

        if (encoder.matches(req.newPassword(), user.passwordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_PASSWORD");
        }

        // Atomic single-use check prevents concurrent token reuse
        int consumed = resetTokens.consumeValidToken(tokenHash);
        if (consumed != 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OR_EXPIRED_TOKEN");
        }

        users.updatePasswordHash(user.id(), encoder.encode(req.newPassword()));
    }

    private static String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
