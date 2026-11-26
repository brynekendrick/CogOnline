import { useState, useEffect } from "react";
import Icon from "../components/UI/Icons";
import DashboardTopbar from "./DashboardTopbar";
import { profileAPI, getSession, clearSession, updateSessionUser, navigate } from "../lib/api";
import "./ResidentDashboard.css";
import "./EditProfile.css";

const CIVIL_STATUSES = ["Single", "Married", "Widowed", "Separated"];

const EMPTY = {
  firstName: "",
  middleName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "+63",
  dob: "",
  civilStatus: "Single",
  street: "",
  purok: "",
  barangay: "",
  city: "",
  province: "",
  postalCode: "",
};

const SERVER_ERRORS = {
  EMAIL_EXISTS: "That email address is already in use by another account.",
  PHONE_EXISTS: "That phone number is already in use by another account.",
  USERNAME_EXISTS: "That username is already taken.",
  INVALID_PHONE: "Phone number must follow the +63XXXXXXXXXX format.",
  INVALID_DOB: "Date of birth cannot be in the future.",
  INVALID_CIVIL_STATUS: "Please choose a valid civil status.",
  UNAUTHORIZED_PROFILE_ACCESS: "You are not allowed to edit this profile.",
};

function validate(form) {
  const errs = {};
  if (!form.firstName.trim()) errs.firstName = "First name is required.";
  if (!form.lastName.trim()) errs.lastName = "Last name is required.";
  if (!form.username.trim()) errs.username = "Username is required.";
  else if (form.username.trim().length < 3) errs.username = "Username must be at least 3 characters.";
  if (!form.email.trim()) errs.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address.";
  const phone = form.phone.replace(/\s/g, "");
  if (!phone || phone === "+63") errs.phone = "Phone number is required.";
  else if (!/^\+63[0-9]{10}$/.test(phone)) errs.phone = "Use the format +63XXXXXXXXXX.";
  if (!form.dob) errs.dob = "Date of birth is required.";
  else if (new Date(form.dob) > new Date()) errs.dob = "Date of birth cannot be in the future.";
  if (!form.street.trim()) errs.street = "Street is required.";
  if (!form.purok.trim()) errs.purok = "Purok is required.";
  if (!form.barangay.trim()) errs.barangay = "Barangay is required.";
  if (!form.city.trim()) errs.city = "City is required.";
  if (!form.province.trim()) errs.province = "Province is required.";
  if (!form.postalCode.trim()) errs.postalCode = "Postal code is required.";
  return errs;
}

export default function EditProfile() {
  const session = getSession() || {};
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await profileAPI.getProfile();
        if (!active) return;
        setForm({
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "+63",
          dob: data.dob || "",
          civilStatus: data.civilStatus || "Single",
          street: data.street || "",
          purok: data.purok || "",
          barangay: data.barangay || "",
          city: data.city || "",
          province: data.province || "",
          postalCode: data.postalCode || "",
        });
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 401) {
          clearSession();
          navigate("/login");
          return;
        }
        setBanner({ type: "error", text: "We couldn't load your profile. Please try again." });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setBanner((b) => (b.type === "error" ? { type: "", text: "" } : b));
    if (touched[name]) {
      const errs = validate(next);
      setErrors((prev) => ({ ...prev, [name]: errs[name] }));
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [name]: errs[name] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    if (Object.keys(errs).length > 0) {
      setBanner({ type: "error", text: "Please fix the highlighted fields before saving." });
      return;
    }

    setSaving(true);
    setBanner({ type: "", text: "" });

    try {
      const payload = {
        ...form,
        middleName: form.middleName.trim(),
        phone: form.phone.replace(/\s/g, ""),
      };
      const { data } = await profileAPI.updateProfile(payload);
      updateSessionUser(data);
      setBanner({ type: "success", text: "Profile updated successfully. Redirecting…" });
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      const code = err.response?.data?.message;
      setBanner({
        type: "error",
        text: SERVER_ERRORS[code] || "Unable to update your profile. Please try again.",
      });
      setSaving(false);
    }
  }

  const fullName =
    [form.firstName, form.lastName].filter(Boolean).join(" ") ||
    `${session.firstName || ""} ${session.lastName || ""}`.trim() ||
    "Resident";

  const initials = `${(form.firstName || session.firstName || "?").charAt(0)}${(
    form.lastName || session.lastName || ""
  ).charAt(0)}`.toUpperCase();

  const fieldProps = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    className: errors[name] && touched[name] ? "error" : "",
  });

  return (
    <div className="dash-page">
      <DashboardTopbar
        name={fullName}
        role={(session.role || "resident").toUpperCase()}
        initials={initials}
        onHome={() => navigate("/dashboard")}
        onLogout={() => {
          sessionStorage.setItem("pre_logout_path", "/dashboard");
          navigate("/logout");
        }}
      />

      <main className="dash-main">
        <button type="button" className="profile-back" onClick={() => navigate("/dashboard")}>
          <Icon name="arrow-left" size={15} />
          <span>Back to Dashboard</span>
        </button>

        <div className="profile-head">
          <h1>Edit Profile</h1>
          <p>Keep your personal information accurate and up to date.</p>
        </div>

        {banner.text && (
          <div className={banner.type === "success" ? "alert-success" : "alert-error"}>
            <Icon name={banner.type === "success" ? "success" : "warning"} size={16} className="alert-icon" />
            <span>{banner.text}</span>
          </div>
        )}

        {loading ? (
          <div className="dash-loading">
            <span className="dash-spinner" />
            <span>Loading your profile…</span>
          </div>
        ) : (
          <form className="profile-card" onSubmit={handleSubmit} noValidate>
            <section className="profile-section">
              <h2 className="profile-section-title">Personal Information</h2>
              <div className="field-grid">
                <div className="field">
                  <label>First Name <span className="req">*</span></label>
                  <input type="text" placeholder="Juan" {...fieldProps("firstName")} />
                  {errors.firstName && touched.firstName && <span className="err-msg">{errors.firstName}</span>}
                </div>
                <div className="field">
                  <label>Middle Name</label>
                  <input type="text" placeholder="Optional" {...fieldProps("middleName")} />
                </div>
                <div className="field">
                  <label>Last Name <span className="req">*</span></label>
                  <input type="text" placeholder="Dela Cruz" {...fieldProps("lastName")} />
                  {errors.lastName && touched.lastName && <span className="err-msg">{errors.lastName}</span>}
                </div>
                <div className="field">
                  <label>Username <span className="req">*</span></label>
                  <input type="text" placeholder="juandelacruz" {...fieldProps("username")} />
                  {errors.username && touched.username && <span className="err-msg">{errors.username}</span>}
                </div>
                <div className="field">
                  <label>Date of Birth <span className="req">*</span></label>
                  <input type="date" {...fieldProps("dob")} />
                  {errors.dob && touched.dob && <span className="err-msg">{errors.dob}</span>}
                </div>
                <div className="field">
                  <label>Civil Status <span className="req">*</span></label>
                  <select {...fieldProps("civilStatus")}>
                    {CIVIL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">Contact Information</h2>
              <div className="field-grid">
                <div className="field">
                  <label>Email Address <span className="req">*</span></label>
                  <input type="email" placeholder="juan.delacruz@email.com" {...fieldProps("email")} />
                  {errors.email && touched.email && <span className="err-msg">{errors.email}</span>}
                </div>
                <div className="field">
                  <label>Phone Number <span className="req">*</span></label>
                  <input type="tel" placeholder="+639171234567" {...fieldProps("phone")} />
                  {errors.phone && touched.phone && <span className="err-msg">{errors.phone}</span>}
                </div>
              </div>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">Address</h2>
              <div className="field-grid">
                <div className="field span-2">
                  <label>Street / House No. <span className="req">*</span></label>
                  <input type="text" placeholder="123 Mabini Street" {...fieldProps("street")} />
                  {errors.street && touched.street && <span className="err-msg">{errors.street}</span>}
                </div>
                <div className="field">
                  <label>Purok <span className="req">*</span></label>
                  <input type="text" placeholder="Purok 1" {...fieldProps("purok")} />
                  {errors.purok && touched.purok && <span className="err-msg">{errors.purok}</span>}
                </div>
                <div className="field">
                  <label>Barangay <span className="req">*</span></label>
                  <input type="text" placeholder="Labangon" {...fieldProps("barangay")} />
                  {errors.barangay && touched.barangay && <span className="err-msg">{errors.barangay}</span>}
                </div>
                <div className="field">
                  <label>City / Municipality <span className="req">*</span></label>
                  <input type="text" placeholder="Cebu City" {...fieldProps("city")} />
                  {errors.city && touched.city && <span className="err-msg">{errors.city}</span>}
                </div>
                <div className="field">
                  <label>Province <span className="req">*</span></label>
                  <input type="text" placeholder="Cebu" {...fieldProps("province")} />
                  {errors.province && touched.province && <span className="err-msg">{errors.province}</span>}
                </div>
                <div className="field">
                  <label>Postal Code <span className="req">*</span></label>
                  <input type="text" placeholder="6000" {...fieldProps("postalCode")} />
                  {errors.postalCode && touched.postalCode && <span className="err-msg">{errors.postalCode}</span>}
                </div>
              </div>
            </section>

            <div className="profile-actions">
              <button type="button" className="btn-ghost" onClick={() => navigate("/dashboard")} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <span className="btn-content-loading">
                    <span className="btn-loading-spinner" />
                    Saving Changes…
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
