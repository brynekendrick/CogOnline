import { useState, useEffect } from "react";
import Register from "./features/auth/Register";
import RegisterSuccess from "./features/auth/RegisterSuccess";
import Login from "./features/auth/Login";
import Logout from "./features/auth/Logout";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";
import ResidentDashboard from "./dashboard/ResidentDashboard";
import EditProfile from "./dashboard/EditProfile";
import AdminDashboard from "./dashboard/AdminDashboard";

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("serviline_session"));
  } catch {
    return null;
  }
}

function resolve(path, role) {
  const home = role === "ADMIN" ? "/admin" : "/dashboard";

  if (path === "/register") return role ? { redirect: home } : { element: <Register /> };
  if (path === "/register-success") return role ? { redirect: home } : { element: <RegisterSuccess /> };
  if (path === "/login") return role ? { redirect: home } : { element: <Login /> };
  if (path === "/forgot-password") return role ? { redirect: home } : { element: <ForgotPassword /> };
  if (path === "/reset-password") return role ? { redirect: home } : { element: <ResetPassword /> };

  if (path === "/dashboard") {
    if (!role) return { redirect: "/login" };
    if (role === "ADMIN") return { redirect: "/admin" };
    return { element: <ResidentDashboard /> };
  }

  if (path === "/admin") {
    if (!role) return { redirect: "/login" };
    if (role !== "ADMIN") return { redirect: "/dashboard" };
    return { element: <AdminDashboard /> };
  }

  if (path === "/edit-profile") {
    if (!role) return { redirect: "/login" };
    return { element: <EditProfile /> };
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
