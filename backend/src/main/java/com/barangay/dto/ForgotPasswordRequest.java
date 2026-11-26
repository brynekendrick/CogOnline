package com.barangay.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ForgotPasswordRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotNull LocalDate dob) {
}
