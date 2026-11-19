package com.barangay.dto;

public record LoginResponse(String token, UserResponse user) {
}
