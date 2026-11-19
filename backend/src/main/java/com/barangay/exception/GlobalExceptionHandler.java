package com.barangay.exception;

import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "VALIDATION_ERROR"));
    }

    // Race condition safety net: unique indexes in the DB
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateKeyException ex) {
        String m = String.valueOf(ex.getMessage());
        String code = m.contains("users_email") ? "EMAIL_EXISTS"
                : m.contains("users_phone") ? "PHONE_EXISTS"
                : m.contains("users_username") ? "USERNAME_EXISTS" : "DUPLICATE";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", code));
    }
}
