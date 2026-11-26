package com.barangay.dto;

import com.barangay.model.User;
import java.time.Instant;
import java.time.LocalDate;

public record UserResponse(
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
        String role,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {

    public static UserResponse from(User u) {
        return new UserResponse(
                u.id(),
                u.firstName(),
                u.middleName(),
                u.lastName(),
                u.username(),
                u.email(),
                u.phone(),
                u.dob(),
                u.civilStatus(),
                u.street(),
                u.purok(),
                u.barangay(),
                u.city(),
                u.province(),
                u.postalCode(),
                u.role(),
                u.active(),
                u.createdAt(),
                u.updatedAt());
    }
}
