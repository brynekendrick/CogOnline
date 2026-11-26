import { useEffect, useState } from "react";
import Icon from "../components/UI/Icons";
import DashboardTopbar from "./DashboardTopbar";
import { profileAPI, getSession, clearSession, updateSessionUser, navigate } from "../lib/api";
import "./ResidentDashboard.css";

export default function AdminDashboard() {
  const session = getSession() || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await profileAPI.getProfile();
        if (!active) return;
        setProfile(data);
        updateSessionUser(data);
      } catch (err) {
        if (err.response?.status === 401) {
          clearSession();
          navigate("/login");
        }
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
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    `${session.firstName || ""} ${session.lastName || ""}`.trim() ||
    "Administrator";

  const initials = `${(profile?.firstName || session.firstName || "?").charAt(0)}${(
    profile?.lastName || session.lastName || ""
  ).charAt(0)}`.toUpperCase();

  const goHome = () => navigate("/admin");
  const goLogout = () => {
    sessionStorage.setItem("pre_logout_path", "/admin");
    navigate("/logout");
  };

  return (
    <div className="dash-page">
      <DashboardTopbar
        name={fullName}
        role="ADMIN"
        initials={initials}
        onHome={goHome}
        onLogout={goLogout}
      />

      <main className="dash-main">
        {loading ? (
          <div className="dash-loading">
            <span className="dash-spinner" />
            <span>Loading…</span>
          </div>
        ) : (
          <>
            <section className="dash-hero">
              <p className="dash-eyebrow">Administrator Dashboard</p>
              <h1>Welcome, {firstName || "Admin"}</h1>
              <p>
                Resident verification and request management will appear here as the modules are
                enabled.
              </p>
            </section>

            <div className="dash-grid">
              <section className="dash-card" style={{ gridColumn: "1 / -1" }}>
                <div className="dash-card-head">
                  <span className="dash-card-icon">
                    <Icon name="user" size={18} />
                  </span>
                  <h2>My Account</h2>
                  <span className="dash-status-badge active">Admin</span>
                </div>

                <div className="dash-info-list">
                  <div className="dash-info-row">
                    <span className="dash-info-label">Name</span>
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
                      <Icon name="user" size={15} /> Username
                    </span>
                    <span className="dash-info-value">{profile?.username || "—"}</span>
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
