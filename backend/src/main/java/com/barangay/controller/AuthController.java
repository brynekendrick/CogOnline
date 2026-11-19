package com.barangay.controller;

import com.barangay.dto.LoginRequest;
import com.barangay.dto.LoginResponse;
import com.barangay.dto.RegisterRequest;
import com.barangay.dto.UserResponse;
import com.barangay.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest req) {
        auth.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "REGISTERED"));
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    /** JWTs are stateless: the real logout is the frontend deleting the session. */
    @PostMapping("/logout")
    public Map<String, String> logout() {
        return Map.of("message", "LOGGED_OUT");
    }

    /** Lets the dashboard confirm the token is valid and read the user's role. */
    @GetMapping("/me")
    public UserResponse me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return auth.me(authHeader);
    }
}
