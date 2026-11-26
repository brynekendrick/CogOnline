package com.barangay.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String firstName,
        @Size(max = 100) String middleName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank String phone,
        @NotNull LocalDate dob,
        @NotBlank String civilStatus,
        @NotBlank @Size(max = 255) String street,
        @NotBlank @Size(max = 100) String purok,
        @NotBlank @Size(max = 100) String barangay,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String province,
        @NotBlank @Size(max = 20) String postalCode) {
}
