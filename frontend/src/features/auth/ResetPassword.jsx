import { useEffect, useState } from "react";
import Layout from "../../shared/Layout";
import Icon from "../../components/UI/Icons";
import PasswordChecklist from "../../components/UI/PasswordChecklist";
import BorderGlow from "@/components/UI/border-glow";
import { authAPI, isStrongPassword, navigate } from "../../lib/api";
import "./Login.css";
import "./AuthRecovery.css";

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

export default function ResetPassword() {
  const [token, setToken] = useState(getTokenFromUrl);
  const [tokenStatus, setTokenStatus] = useState(() => (getTokenFromUrl() ? "checking" : "manual"));
  const [tokenError, setTokenError] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const initialToken = getTokenFromUrl();
    if (!initialToken) return;
    verifyToken(initialToken);
  }, []);

  async function verifyToken(candidate) {
    if (!candidate.trim()) {
      setTokenStatus("invalid");
      setTokenError("Please enter your password reset token.");
      return;
    }
    setTokenStatus("checking");
    setTokenError("");
    try {
      const { data } = await authAPI.validateResetToken(candidate.trim());
      setExpiresAt(data.expiresAt);
      setTokenStatus("valid");
    } catch {
      setTokenStatus("invalid");
      setTokenError(
        "This password reset token is invalid, expired, or has already been used."
      );
    }
  }

  function validate(pw, cpw) {
    const errs = {};
    if (!pw) {
      errs.newPassword = "New password is required.";
    } else if (!isStrongPassword(pw)) {
      errs.newPassword =
        "Password must be 8–72 chars with uppercase, lowercase, number, and special character.";
    }
    if (!cpw) {
      errs.confirmPassword = "Please confirm your new password.";
    } else if (pw !== cpw) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(newPassword, confirmPassword));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(newPassword, confirmPassword);
    setTouched({ newPassword: true, confirmPassword: true });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setSubmitError("");

    try {
      await authAPI.resetPassword({
        token: token.trim(),
        newPassword,
        confirmPassword,
      });
      setResetSuccess(true);
    } catch (err) {
      const code = err.response?.data?.message;
      if (code === "INVALID_OR_EXPIRED_TOKEN") {
        setTokenStatus("invalid");
        setTokenError("This reset token has expired or has already been used.");
      } else if (code === "WEAK_PASSWORD") {
        setSubmitError(
          "Password does not meet the strength requirements (8+ chars, uppercase, lowercase, number, special character)."
        );
      } else if (code === "PASSWORD_MISMATCH") {
        setSubmitError("New password and confirmation do not match.");
      } else if (code === "SAME_PASSWORD") {
        setSubmitError("Your new password must be different from your current password.");
      } else {
        setSubmitError("Unable to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="login-page">
        <BorderGlow className="login-card recovery-card" borderRadius={16}>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
            className="back-link"
          >
            <Icon name="arrow-left" size={15} />
            <span>Back to Sign In</span>
          </a>

          <div className="card-header">
            <div className="recovery-badge">
              <Icon name="key" size={20} />
            </div>
            <h1 className="card-title">Reset Password</h1>
            <p className="card-subtitle">
              {resetSuccess
                ? "Your password has been updated securely."
                : "Create a strong new password for your CogOnline account."}
            </p>
          </div>

          {resetSuccess ? (
            <div className="recovery-verified-box">
              <div className="alert-success">
                <Icon name="success" size={18} className="alert-icon" />
                <div>
                  <strong>Password reset complete!</strong>
                  <div className="alert-subtext">
                    Your old password and reset token are now permanently invalidated. Sign in with
                    your new password.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary btn-full"
                onClick={() => navigate("/login")}
              >
                Go to Sign In
              </button>
            </div>
          ) : tokenStatus === "checking" ? (
            <div className="token-checking">Verifying reset token...</div>
          ) : tokenStatus === "invalid" ? (
            <div className="recovery-verified-box">
              <div className="alert-error">
                <Icon name="warning" size={16} className="alert-icon" />
                <span>{tokenError}</span>
              </div>
              <button
                type="button"
                className="btn-primary btn-full"
                onClick={() => navigate("/forgot-password")}
              >
                Request a New Reset Token
              </button>
            </div>
          ) : tokenStatus === "manual" ? (
            <div className="recovery-verified-box">
              <div className="form-group">
                <label>
                  Reset Token <span className="req">*</span>
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your single-use reset token"
                />
              </div>
              <button
                type="button"
                className="btn-primary btn-full"
                onClick={() => verifyToken(token)}
              >
                Validate Reset Token
              </button>
            </div>
          ) : (
            <>
              {expiresAt && (
                <div className="token-expiry-pill">
                  Token active until{" "}
                  {new Date(expiresAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}

              {submitError && (
                <div className="alert-error">
                  <Icon name="warning" size={16} className="alert-icon" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label>
                    New Password <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setSubmitError("");
                        if (touched.newPassword) {
                          setErrors(validate(e.target.value, confirmPassword));
                        }
                      }}
                      onBlur={() => handleBlur("newPassword")}
                      placeholder="Create a strong password"
                      className={errors.newPassword && touched.newPassword ? "error" : ""}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowNew((v) => !v)}
                    >
                      <Icon name={showNew ? "eye-off" : "eye"} size={16} />
                    </button>
                  </div>
                  {errors.newPassword && touched.newPassword && (
                    <span className="err-msg">{errors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Confirm New Password <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setSubmitError("");
                        if (touched.confirmPassword) {
                          setErrors(validate(newPassword, e.target.value));
                        }
                      }}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="Re-enter your new password"
                      className={errors.confirmPassword && touched.confirmPassword ? "error" : ""}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      <Icon name={showConfirm ? "eye-off" : "eye"} size={16} />
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <span className="err-msg">{errors.confirmPassword}</span>
                  )}
                </div>

                <PasswordChecklist password={newPassword} confirmPassword={confirmPassword} />

                <button type="submit" className="btn-primary btn-full btn-login" disabled={loading}>
                  {loading ? (
                    <span className="btn-content-loading">
                      <span className="btn-loading-spinner"></span>
                      Resetting Password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </BorderGlow>
      </div>
    </Layout>
  );
}
