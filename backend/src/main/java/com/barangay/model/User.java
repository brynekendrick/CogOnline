package com.barangay.model;

public record User(
        long id,
        String firstName,
        String lastName,
        String username,
        String email,
        String passwordHash,
        String role,
        boolean active) {
}
