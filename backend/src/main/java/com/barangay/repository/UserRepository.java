package com.barangay.repository;

import com.barangay.dto.RegisterRequest;
import com.barangay.model.User;
import java.sql.Date;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final String COLS =
            "id, first_name, last_name, username, email, password_hash, role, active";

    private static final RowMapper<User> MAPPER = (rs, i) -> new User(
            rs.getLong("id"),
            rs.getString("first_name"),
            rs.getString("last_name"),
            rs.getString("username"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("role"),
            rs.getBoolean("active"));

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

    public boolean existsByEmail(String email) {
        return count("select count(*) from users where lower(email) = lower(?)", email);
    }

    public boolean existsByPhone(String phone) {
        return count("select count(*) from users where phone = ?", phone);
    }

    public boolean existsByUsername(String username) {
        return count("select count(*) from users where lower(username) = lower(?)", username);
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
                r.firstName().trim(), r.middleName() == null ? null : r.middleName().trim(),
                r.lastName().trim(), r.username().trim(), r.email().trim().toLowerCase(), phone,
                Date.valueOf(r.dob()),
                r.civilStatus() == null ? "Single" : r.civilStatus(),
                r.street().trim(), r.purok().trim(), r.barangay().trim(), r.city().trim(),
                r.province().trim(), r.postalCode().trim(), passwordHash);
    }
}
