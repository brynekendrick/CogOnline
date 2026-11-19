package com.barangay.service;

import com.barangay.dto.LoginRequest;
import com.barangay.dto.LoginResponse;
import com.barangay.dto.RegisterRequest;
import com.barangay.dto.UserResponse;
import com.barangay.exception.ApiException;
import com.barangay.model.User;
import com.barangay.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public void register(RegisterRequest r) {
        String phone = r.phone().replaceAll("\\s", "");
        if (!phone.matches("^\\+63[0-9]{10}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE");
        }
        if (users.existsByEmail(r.email().trim())) throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS");
        if (users.existsByPhone(phone)) throw new ApiException(HttpStatus.CONFLICT, "PHONE_EXISTS");
        if (users.existsByUsername(r.username().trim())) throw new ApiException(HttpStatus.CONFLICT, "USERNAME_EXISTS");

        users.insert(r, phone, encoder.encode(r.password()));
    }

    public LoginResponse login(LoginRequest req) {
        User user = users.findByUsername(req.username().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (!encoder.matches(req.password(), user.passwordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }
        // Pending accounts get 401 too; Login.jsx shows "not yet confirmed by the Barangay".
        if (!user.active()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_PENDING");
        }
        return new LoginResponse(jwt.generate(user.id(), user.role()), UserResponse.from(user));
    }

    public UserResponse me(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "MISSING_TOKEN");
        }
        try {
            Claims claims = jwt.parse(authHeader.substring(7));
            User user = users.findById(Long.parseLong(claims.getSubject()))
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN"));
            if (!user.active()) throw new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_PENDING");
            return UserResponse.from(user);
        } catch (JwtException | IllegalArgumentException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
        }
    }
}
