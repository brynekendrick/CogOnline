package com.barangay.dto;

import com.barangay.model.User;

public record UserResponse(long id, String firstName, String lastName, String email, String role, boolean active) {
    public static UserResponse from(User u) {
        return new UserResponse(u.id(), u.firstName(), u.lastName(), u.email(), u.role(), u.active());
    }
}
