import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const authAPI = {
  register: (data) => axios.post(`${API_URL}/api/auth/register`, data),
};

export async function prefetchUserData() {}