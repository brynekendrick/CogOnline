import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <span>© 2026 Barangay · ServiLine</span>
        <span>Built for the residents</span>
      </footer>
    </div>
  );
}