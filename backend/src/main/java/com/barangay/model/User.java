package com.barangay.model;

import java.time.Instant;
import java.time.LocalDate;

public record User(
        long id,
        String firstName,
        String middleName,
        String lastName,
        String username,
        String email,
        String phone,
        LocalDate dob,
        String civilStatus,
        String street,
        String purok,
        String barangay,
        String city,
        String province,
        String postalCode,
        String passwordHash,
        String role,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {
}
