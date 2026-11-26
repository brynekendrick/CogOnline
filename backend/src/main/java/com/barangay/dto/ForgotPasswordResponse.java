package com.barangay.dto;

import java.time.Instant;

public record ForgotPasswordResponse(
        String message,
        String resetToken,
        int expiresInMinutes,
        Instant expiresAt) {
}
