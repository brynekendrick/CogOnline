package com.barangay.controller;

import com.barangay.dto.UpdateProfileRequest;
import com.barangay.dto.UserResponse;
import com.barangay.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public UserResponse getMyProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return profileService.getMyProfile(authHeader);
    }

    @PutMapping
    public UserResponse updateMyProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody UpdateProfileRequest req) {
        return profileService.updateMyProfile(authHeader, req);
    }

    @GetMapping("/{id}")
    public UserResponse getProfileById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("id") long id) {
        return profileService.getProfileById(authHeader, id);
    }

    @PutMapping("/{id}")
    public UserResponse updateProfileById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("id") long id,
            @Valid @RequestBody UpdateProfileRequest req) {
        return profileService.updateProfileById(authHeader, id, req);
    }
}
