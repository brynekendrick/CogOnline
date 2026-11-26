package com.barangay.service;

import com.barangay.dto.UpdateProfileRequest;
import com.barangay.dto.UserResponse;
import com.barangay.exception.ApiException;
import com.barangay.model.User;
import com.barangay.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final AuthService authService;
    private final UserRepository users;

    public ProfileService(AuthService authService, UserRepository users) {
        this.authService = authService;
        this.users = users;
    }

    public UserResponse getMyProfile(String authHeader) {
        User current = authService.requireUser(authHeader);
        return UserResponse.from(current);
    }

    public UserResponse getProfileById(String authHeader, long targetUserId) {
        User current = authService.requireUser(authHeader);
        enforceOwnership(current, targetUserId);
        return UserResponse.from(current);
    }

    @Transactional
    public UserResponse updateMyProfile(String authHeader, UpdateProfileRequest req) {
        User current = authService.requireUser(authHeader);
        return applyProfileUpdate(current, req);
    }

    @Transactional
    public UserResponse updateProfileById(String authHeader, long targetUserId, UpdateProfileRequest req) {
        User current = authService.requireUser(authHeader);
        enforceOwnership(current, targetUserId);
        return applyProfileUpdate(current, req);
    }

    private void enforceOwnership(User current, long targetUserId) {
        if (current.id() != targetUserId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNAUTHORIZED_PROFILE_ACCESS");
        }
    }

    private UserResponse applyProfileUpdate(User current, UpdateProfileRequest req) {
        String phone = PasswordPolicy.normalizeAndValidatePhone(req.phone());
        PasswordPolicy.validateCivilStatus(req.civilStatus());

        if (req.dob().isAfter(LocalDate.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DOB");
        }

        String email = req.email().trim().toLowerCase();
        String username = req.username().trim();

        if (users.existsByEmailExcludingUser(email, current.id())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS");
        }
        if (users.existsByPhoneExcludingUser(phone, current.id())) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_EXISTS");
        }
        if (users.existsByUsernameExcludingUser(username, current.id())) {
            throw new ApiException(HttpStatus.CONFLICT, "USERNAME_EXISTS");
        }

        users.updateProfile(current.id(), req, phone);

        User updated = users.findById(current.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        return UserResponse.from(updated);
    }
}
