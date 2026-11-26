package com.barangay.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PasswordResetTokenRepository {

    public record ResetTokenRecord(long id, long userId, Instant expiresAt, boolean used) {
    }

    private final JdbcTemplate jdbc;

    public PasswordResetTokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void invalidateUnusedTokensForUser(long userId) {
        jdbc.update("""
                update password_reset_tokens
                   set used = true, used_at = now()
                 where user_id = ? and used = false
                """, userId);
    }

    public void insertToken(long userId, String tokenHash, Instant expiresAt) {
        jdbc.update("""
                insert into password_reset_tokens (user_id, token_hash, expires_at, used)
                values (?, ?, ?, false)
                """, userId, tokenHash, Timestamp.from(expiresAt));
    }

    public Optional<ResetTokenRecord> findValidByTokenHash(String tokenHash) {
        return jdbc.query("""
                select id, user_id, expires_at, used
                  from password_reset_tokens
                 where token_hash = ?
                   and used = false
                   and expires_at > now()
                """,
                (rs, i) -> new ResetTokenRecord(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getTimestamp("expires_at").toInstant(),
                        rs.getBoolean("used")),
                tokenHash).stream().findFirst();
    }

    public int consumeValidToken(String tokenHash) {
        return jdbc.update("""
                update password_reset_tokens
                   set used = true, used_at = now()
                 where token_hash = ?
                   and used = false
                   and expires_at > now()
                """, tokenHash);
    }
}
