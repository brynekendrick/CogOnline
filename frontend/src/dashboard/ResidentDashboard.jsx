import { useEffect, useState } from "react";
import Icon from "../components/UI/Icons";
import DashboardTopbar from "./DashboardTopbar";
import { profileAPI, getSession, clearSession, updateSessionUser, navigate } from "../lib/api";
import "./ResidentDashboard.css";

function initialsOf(first, last) {
  return `${(first || "?").charAt(0)}${(last || "").charAt(0)}`.toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatAddress(p) {
  if (!p) return "—";
  const line = [p.street, p.purok].filter(Boolean).join(", ");
  const tail = [p.barangay, p.city, p.province].filter(Boolean).join(", ");
  return [line, tail, p.postalCode].filter(Boolean).join(", ") || "—";
}

export default function ResidentDashboard() {
  const session = getSession() || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await profileAPI.getProfile();
        if (!active) return;
        setProfile(data);
        updateSessionUser(data);
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 401) {
          clearSession();
          navigate("/login");
          return;
        }
        setError("We couldn't load your profile right now. Please refresh the page.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const firstName = profile?.firstName || session.firstName || "";
  const fullName =
    [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(" ") ||
    `${session.firstName || ""} ${session.lastName || ""}`.trim() ||
    "Resident";
  const role = (profile?.role || session.role || "resident").toUpperCase();
  const active = profile?.active ?? true;

  const goHome = () => navigate("/dashboard");
  const goEdit = () => navigate("/edit-profile");
  const goLogout = () => {
    sessionStorage.setItem("pre_logout_path", "/dashboard");
    navigate("/logout");
  };

  return (
    <div className="dash-page">
      <DashboardTopbar
        name={fullName}
        role={role}
        initials={initialsOf(firstName, profile?.lastName || session.lastName)}
        onHome={goHome}
        onLogout={goLogout}
      />

      <main className="dash-main">
        {loading ? (
          <div className="dash-loading">
            <span className="dash-spinner" />
            <span>Loading your dashboard…</span>
          </div>
        ) : (
          <>
            <section className="dash-hero">
              <p className="dash-eyebrow">Resident Dashboard</p>
              <h1>Welcome back, {firstName || "Resident"}</h1>
              <p>
                Manage your profile and account details. Keep your information up to date so the
                Barangay can serve you faster.
              </p>
            </section>

            {error && (
              <div className="alert-error">
                <Icon name="warning" size={16} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="dash-grid">
              <section className="dash-card">
                <div className="dash-card-head">
                  <span className="dash-card-icon">
                    <Icon name="shield" size={18} />
                  </span>
                  <h2>Account Status</h2>
                  <span className={`dash-status-badge ${active ? "active" : "pending"}`}>
                    {active ? "Active" : "Pending"}
                  </span>
                </div>

                <div className="dash-info-list">
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="user" size={15} /> Username
                    </span>
                    <span className="dash-info-value">{profile?.username || session.username || "—"}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="calendar" size={15} /> Member since
                    </span>
                    <span className="dash-info-value">{formatDate(profile?.createdAt)}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="check" size={15} /> Last updated
                    </span>
                    <span className="dash-info-value">{formatDate(profile?.updatedAt)}</span>
                  </div>
                </div>
              </section>

              <section className="dash-card">
                <div className="dash-card-head">
                  <span className="dash-card-icon">
                    <Icon name="edit" size={18} />
                  </span>
                  <h2>Quick Actions</h2>
                </div>

                <div className="dash-actions">
                  <button type="button" className="dash-action" onClick={goEdit}>
                    <span className="dash-action-icon">
                      <Icon name="user" size={19} />
                    </span>
                    <span className="dash-action-text">
                      <strong>Edit Profile</strong>
                      <span>Update your personal and contact details</span>
                    </span>
                    <span className="dash-action-chevron">›</span>
                  </button>

                  <button type="button" className="dash-action danger" onClick={goLogout}>
                    <span className="dash-action-icon">
                      <Icon name="logout" size={19} />
                    </span>
                    <span className="dash-action-text">
                      <strong>Sign Out</strong>
                      <span>End your current session securely</span>
                    </span>
                    <span className="dash-action-chevron">›</span>
                  </button>
                </div>
              </section>

              <section className="dash-card" style={{ gridColumn: "1 / -1" }}>
                <div className="dash-card-head">
                  <span className="dash-card-icon">
                    <Icon name="user" size={18} />
                  </span>
                  <h2>Profile Details</h2>
                </div>

                <div className="dash-info-list">
                  <div className="dash-info-row">
                    <span className="dash-info-label">Full Name</span>
                    <span className="dash-info-value">{fullName}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="mail" size={15} /> Email
                    </span>
                    <span className="dash-info-value">{profile?.email || session.email || "—"}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="phone" size={15} /> Phone
                    </span>
                    <span className="dash-info-value">{profile?.phone || "—"}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="calendar" size={15} /> Date of Birth
                    </span>
                    <span className="dash-info-value">{formatDate(profile?.dob)}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">Civil Status</span>
                    <span className="dash-info-value">{profile?.civilStatus || "—"}</span>
                  </div>
                  <div className="dash-info-row">
                    <span className="dash-info-label">
                      <Icon name="map-pin" size={15} /> Address
                    </span>
                    <span className="dash-info-value">{formatAddress(profile)}</span>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
