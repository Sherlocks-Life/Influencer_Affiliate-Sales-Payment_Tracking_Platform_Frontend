import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://influencer-affiliate-sales-payment-o2l2.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("session");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);
