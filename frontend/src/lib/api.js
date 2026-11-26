import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const SESSION_KEY = "serviline_session";

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function setSession(sessionData) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

export function updateSessionUser(user) {
  const existing = getSession();
  if (!existing || !user) return;
  setSession({
    ...existing,
    userId: user.id ?? existing.userId,
    firstName: user.firstName ?? existing.firstName,
    lastName: user.lastName ?? existing.lastName,
    email: user.email ?? existing.email,
    role: user.role ?? existing.role,
  });
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function navigate(path) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("pushstate"));
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => apiClient.post("/api/auth/register", data),
  login: (data) => apiClient.post("/api/auth/login", data),
  me: () => apiClient.get("/api/auth/me"),
  logout: () => apiClient.post("/api/auth/logout"),
  changePassword: (data) => apiClient.post("/api/auth/change-password", data),
  forgotPassword: (data) => apiClient.post("/api/auth/forgot-password", data),
  validateResetToken: (token) =>
    apiClient.get("/api/auth/reset-password/validate", { params: { token } }),
  resetPassword: (data) => apiClient.post("/api/auth/reset-password", data),
};

export const profileAPI = {
  getProfile: () => apiClient.get("/api/profile"),
  updateProfile: (data) => apiClient.put("/api/profile", data),
  getProfileById: (id) => apiClient.get(`/api/profile/${id}`),
  updateProfileById: (id, data) => apiClient.put(`/api/profile/${id}`, data),
};

export function evaluatePasswordRules(password = "") {
  return {
    minLength: password.length >= 8 && password.length <= 72,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password = "") {
  const checks = evaluatePasswordRules(password);
  return Object.values(checks).every(Boolean);
}

export async function prefetchUserData() {}