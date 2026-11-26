import Icon from "../components/UI/Icons";

export default function DashboardTopbar({ name, role, initials, onHome, onLogout }) {
  return (
    <header className="dash-topbar">
      <div className="dash-brand" onClick={onHome} role="button" tabIndex={0}>
        <span className="dash-logo">
          <Icon name="home" size={18} />
        </span>
        <span className="dash-brand-text">
          Cog<strong>Online</strong>
        </span>
      </div>

      <div className="dash-user">
        <div className="dash-avatar">{initials}</div>
        <div className="dash-user-meta">
          <strong>{name}</strong>
          <span>{role?.toLowerCase() || "resident"}</span>
        </div>
        <button type="button" className="dash-logout-btn" onClick={onLogout}>
          <Icon name="logout" size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
