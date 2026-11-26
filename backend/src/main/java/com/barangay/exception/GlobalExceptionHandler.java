package com.barangay.exception;

import java.util.HashMap;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
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
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(err -> fieldErrors.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of(
                "message", "VALIDATION_ERROR",
                "errors", fieldErrors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMalformedBody(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "INVALID_REQUEST_BODY"));
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
