package com.barangay.repository;

import com.barangay.dto.RegisterRequest;
import com.barangay.dto.UpdateProfileRequest;
import com.barangay.model.User;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final String COLS = """
            id, first_name, middle_name, last_name, username, email, phone, dob,
            civil_status, street, purok, barangay, city, province, postal_code,
            password_hash, role, active, created_at, updated_at
            """;

    private static final RowMapper<User> MAPPER = (rs, i) -> {
        Date dobDate = rs.getDate("dob");
        Timestamp createdTs = rs.getTimestamp("created_at");
        Timestamp updatedTs = rs.getTimestamp("updated_at");
        return new User(
                rs.getLong("id"),
                rs.getString("first_name"),
                rs.getString("middle_name"),
                rs.getString("last_name"),
                rs.getString("username"),
                rs.getString("email"),
                rs.getString("phone"),
                dobDate != null ? dobDate.toLocalDate() : null,
                rs.getString("civil_status"),
                rs.getString("street"),
                rs.getString("purok"),
                rs.getString("barangay"),
                rs.getString("city"),
                rs.getString("province"),
                rs.getString("postal_code"),
                rs.getString("password_hash"),
                rs.getString("role"),
                rs.getBoolean("active"),
                createdTs != null ? createdTs.toInstant() : Instant.now(),
                updatedTs != null ? updatedTs.toInstant() : Instant.now());
    };

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByUsername(String username) {
        return jdbc.query("select " + COLS + " from users where lower(username) = lower(?)", MAPPER, username)
                .stream().findFirst();
    }

    public Optional<User> findById(long id) {
        return jdbc.query("select " + COLS + " from users where id = ?", MAPPER, id)
                .stream().findFirst();
    }

    public Optional<User> findByIdentity(String username, String email, String phone, LocalDate dob) {
        return jdbc.query("""
                select %s from users
                 where lower(username) = lower(?)
                   and lower(email) = lower(?)
                   and phone = ?
                   and dob = ?
                """.formatted(COLS), MAPPER, username, email, phone, Date.valueOf(dob))
                .stream().findFirst();
    }

    public boolean existsByEmail(String email) {
        return count("select count(*) from users where lower(email) = lower(?)", email);
    }

    public boolean existsByPhone(String phone) {
        return count("select count(*) from users where phone = ?", phone);
    }

    public boolean existsByUsername(String username) {
        return count("select count(*) from users where lower(username) = lower(?)", username);
    }

    public boolean existsByEmailExcludingUser(String email, long userId) {
        Integer n = jdbc.queryForObject(
                "select count(*) from users where lower(email) = lower(?) and id <> ?",
                Integer.class, email, userId);
        return n != null && n > 0;
    }

    public boolean existsByPhoneExcludingUser(String phone, long userId) {
        Integer n = jdbc.queryForObject(
                "select count(*) from users where phone = ? and id <> ?",
                Integer.class, phone, userId);
        return n != null && n > 0;
    }

    public boolean existsByUsernameExcludingUser(String username, long userId) {
        Integer n = jdbc.queryForObject(
                "select count(*) from users where lower(username) = lower(?) and id <> ?",
                Integer.class, username, userId);
        return n != null && n > 0;
    }

    private boolean count(String sql, String value) {
        Integer n = jdbc.queryForObject(sql, Integer.class, value);
        return n != null && n > 0;
    }

    /** New accounts are always RESIDENT + inactive (pending barangay verification). */
    public void insert(RegisterRequest r, String phone, String passwordHash) {
        jdbc.update("""
                insert into users (first_name, middle_name, last_name, username, email, phone, dob,
                                   civil_status, street, purok, barangay, city, province, postal_code,
                                   password_hash, role, active)
                values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'RESIDENT',false)
                """,
                r.firstName().trim(), normalizeNullable(r.middleName()),
                r.lastName().trim(), r.username().trim(), r.email().trim().toLowerCase(), phone,
                Date.valueOf(r.dob()),
                r.civilStatus() == null ? "Single" : r.civilStatus().trim(),
                r.street().trim(), r.purok().trim(), r.barangay().trim(), r.city().trim(),
                r.province().trim(), r.postalCode().trim(), passwordHash);
    }

    public void updateProfile(long userId, UpdateProfileRequest r, String normalizedPhone) {
        jdbc.update("""
                update users
                   set first_name = ?,
                       middle_name = ?,
                       last_name = ?,
                       username = ?,
                       email = ?,
                       phone = ?,
                       dob = ?,
                       civil_status = ?,
                       street = ?,
                       purok = ?,
                       barangay = ?,
                       city = ?,
                       province = ?,
                       postal_code = ?,
                       updated_at = now()
                 where id = ?
                """,
                r.firstName().trim(),
                normalizeNullable(r.middleName()),
                r.lastName().trim(),
                r.username().trim(),
                r.email().trim().toLowerCase(),
                normalizedPhone,
                Date.valueOf(r.dob()),
                r.civilStatus().trim(),
                r.street().trim(),
                r.purok().trim(),
                r.barangay().trim(),
                r.city().trim(),
                r.province().trim(),
                r.postalCode().trim(),
                userId);
    }

    public void updatePasswordHash(long userId, String passwordHash) {
        jdbc.update("""
                update users
                   set password_hash = ?,
                       updated_at = now()
                 where id = ?
                """, passwordHash, userId);
    }

    private static String normalizeNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
