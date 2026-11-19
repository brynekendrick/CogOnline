import { useState, useEffect } from "react";
import Register from "./features/auth/Register";
import RegisterSuccess from "./features/auth/RegisterSuccess";
import Login from "./features/auth/Login";
import Logout from "./features/auth/Logout";

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("serviline_session"));
  } catch {
    return null;
  }
}

function go(path) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("pushstate"));
}

function RoleDashboard({ admin }) {
  const s = getSession() || {};

  const goLogout = () => {
    sessionStorage.setItem("pre_logout_path", admin ? "/admin" : "/dashboard");
    go("/logout");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>{admin ? "Admin" : "Resident"} dashboard</h2>
      <p>Hello, {s.firstName} {s.lastName}</p>
      <ul>
        {admin ? (
          <>
            <li>Verify residents</li>
            <li>Manage requests</li>
          </>
        ) : (
          <>
            <li>My requests</li>
            <li>My profile</li>
          </>
        )}
      </ul>
      <button onClick={goLogout}>Logout</button>
    </div>
  );
}

function resolve(path, role) {
  const home = role === "ADMIN" ? "/admin" : "/dashboard";

  if (path === "/register") return role ? { redirect: home } : { element: <Register /> };
  if (path === "/register-success") return role ? { redirect: home } : { element: <RegisterSuccess /> };
  if (path === "/login") return role ? { redirect: home } : { element: <Login /> };

  if (path === "/dashboard") {
    if (!role) return { redirect: "/login" };
    if (role === "ADMIN") return { redirect: "/admin" };
    return { element: <RoleDashboard /> };
  }

  if (path === "/admin") {
    if (!role) return { redirect: "/login" };
    if (role !== "ADMIN") return { redirect: "/dashboard" };
    return { element: <RoleDashboard admin /> };
  }

  if (path === "/logout") return role ? { element: <Logout /> } : { redirect: "/login" };

  return { redirect: role ? home : "/login" };
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    window.addEventListener("pushstate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("pushstate", update);
    };
  }, []);

  const session = getSession();
  const role = session?.role ? session.role.toUpperCase() : null;
  const target = resolve(path, role);

  useEffect(() => {
    if (target.redirect) {
      window.history.replaceState(null, "", target.redirect);
      setPath(target.redirect);
    }
  }, [path]);

  if (target.redirect) return null;
  return target.element;
}