import { useState } from "react";
import Layout from "../../shared/Layout";
import Icon from "../../components/UI/Icons";
import BorderGlow from "@/components/UI/border-glow";
import { authAPI, navigate } from "../../lib/api";
import "./Login.css";
import "./AuthRecovery.css";

export default function ForgotPassword() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "+63",
    dob: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [copied, setCopied] = useState(false);

  function validateField(name, value) {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username is required.";
        return "";
      case "email":
        if (!value.trim()) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Enter a valid email address.";
        }
        return "";
      case "phone": {
        const clean = value.replace(/\s/g, "");
        if (!clean || clean === "+63") return "Phone number is required.";
        if (!/^\+63[0-9]{10}$/.test(clean)) {
          return "Use Philippine mobile format (+63XXXXXXXXXX).";
        }
        return "";
      }
      case "dob":
        return !value ? "Date of birth is required." : "";
      default:
        return "";
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setServerError("");
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fields = ["username", "email", "phone", "dob"];
    const nextTouched = {};
    const nextErrors = {};
    fields.forEach((f) => {
      nextTouched[f] = true;
      nextErrors[f] = validateField(f, form[f]);
    });
    setTouched(nextTouched);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    setServerError("");

    try {
      const { data } = await authAPI.forgotPassword({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\s/g, ""),
        dob: form.dob,
      });
      setRecoveryResult(data);
    } catch (err) {
      const code = err.response?.data?.message;
      if (code === "IDENTITY_VERIFICATION_FAILED") {
        setServerError(
          "The details you entered do not match an existing account. Please double-check your username, email, phone, and date of birth."
        );
      } else if (code === "ACCOUNT_PENDING") {
        setServerError(
          "Your account is still pending verification by the Barangay and cannot reset its password yet."
        );
      } else if (code === "INVALID_PHONE") {
        setServerError("Phone number must follow the +63XXXXXXXXXX format.");
      } else {
        setServerError("Unable to verify your identity right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!recoveryResult?.resetToken) return;
    try {
      await navigator.clipboard.writeText(recoveryResult.resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  }

  function goToReset() {
    const token = encodeURIComponent(recoveryResult.resetToken);
    navigate(`/reset-password?token=${token}`);
  }

  function goLogin(e) {
    e.preventDefault();
    navigate("/login");
  }

  return (
    <Layout>
      <div className="login-page">
        <BorderGlow className="login-card recovery-card" borderRadius={16}>
          <a href="/login" onClick={goLogin} className="back-link">
            <Icon name="arrow-left" size={15} />
            <span>Back to Sign In</span>
          </a>

          <div className="card-header">
            <div className="recovery-badge">
              <Icon name="shield" size={20} />
            </div>
            <h1 className="card-title">Forgot Password</h1>
            <p className="card-subtitle">
              {recoveryResult
                ? "Your identity has been verified. Use your single-use token to set a new password."
                : "Verify your registered account details to generate an expiring password reset token."}
            </p>
          </div>

          {serverError && (
            <div className="alert-error">
              <Icon name="warning" size={16} className="alert-icon" />
              <span>{serverError}</span>
            </div>
          )}

          {recoveryResult ? (
            <div className="recovery-verified-box">
              <div className="alert-success">
                <Icon name="success" size={18} className="alert-icon" />
                <div>
                  <strong>Identity verified!</strong>
                  <div className="alert-subtext">
                    This single-use reset token expires in{" "}
                    <strong>{recoveryResult.expiresInMinutes} minutes</strong> (at{" "}
                    {new Date(recoveryResult.expiresAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    ).
                  </div>
                </div>
              </div>

              <div className="token-display-group">
                <label>Single-Use Reset Token</label>
                <div className="token-copy-row">
                  <code className="token-code">{recoveryResult.resetToken}</code>
                  <button
                    type="button"
                    className="btn-copy-token"
                    onClick={copyToken}
                    title="Copy token"
                  >
                    <Icon name={copied ? "check" : "copy"} size={15} />
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <button type="button" className="btn-primary btn-full" onClick={goToReset}>
                Continue to Reset Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>
                  Username <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your registered username"
                  className={errors.username && touched.username ? "error" : ""}
                  autoComplete="username"
                />
                {errors.username && touched.username && (
                  <span className="err-msg">{errors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="juan.delacruz@email.com"
                  className={errors.email && touched.email ? "error" : ""}
                  autoComplete="email"
                />
                {errors.email && touched.email && (
                  <span className="err-msg">{errors.email}</span>
                )}
              </div>

              <div className="recovery-row">
                <div className="form-group">
                  <label>
                    Phone Number <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="+639171234567"
                    className={errors.phone && touched.phone ? "error" : ""}
                  />
                  {errors.phone && touched.phone && (
                    <span className="err-msg">{errors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Date of Birth <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.dob && touched.dob ? "error" : ""}
                  />
                  {errors.dob && touched.dob && (
                    <span className="err-msg">{errors.dob}</span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-primary btn-full btn-login" disabled={loading}>
                {loading ? (
                  <span className="btn-content-loading">
                    <span className="btn-loading-spinner"></span>
                    Verifying Identity...
                  </span>
                ) : (
                  "Verify Identity & Get Reset Token"
                )}
              </button>
            </form>
          )}
        </BorderGlow>
      </div>
    </Layout>
  );
}
