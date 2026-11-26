package com.barangay.service;

import com.barangay.exception.ApiException;
import java.util.Set;
import org.springframework.http.HttpStatus;

public final class PasswordPolicy {

    private static final Set<String> VALID_CIVIL_STATUSES =
            Set.of("Single", "Married", "Widowed", "Separated");

    private PasswordPolicy() {
    }

    public static String normalizeAndValidatePhone(String rawPhone) {
        String phone = rawPhone == null ? "" : rawPhone.replaceAll("\\s", "");
        if (!phone.matches("^\\+63[0-9]{10}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE");
        }
        return phone;
    }

    public static String validateCivilStatus(String rawStatus) {
        String trimmed = rawStatus == null ? "" : rawStatus.trim();
        if (!VALID_CIVIL_STATUSES.contains(trimmed)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CIVIL_STATUS");
        }
        return trimmed;
    }

    public static void validateNewPassword(String newPassword, String confirmPassword) {
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD");
        }
        boolean hasUpper = newPassword.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = newPassword.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = newPassword.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = newPassword.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH");
        }
    }
}
