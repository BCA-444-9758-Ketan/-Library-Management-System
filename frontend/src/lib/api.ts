import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export type UiRole = "student" | "librarian" | "admin";

export const toUiRole = (role?: string): UiRole => {
  const normalized = (role || "").toUpperCase();

  if (normalized === "ADMIN") return "admin";
  if (normalized === "LIBRARIAN") return "librarian";
  return "student";
};

export const toApiRole = (role: UiRole): "ADMIN" | "LIBRARIAN" | "STUDENT" => {
  if (role === "admin") return "ADMIN";
  if (role === "librarian") return "LIBRARIAN";
  return "STUDENT";
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartlib_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("smartlib_token");
      localStorage.removeItem("smartlib_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Centralised endpoint paths — tweak here once your backend confirms routes.
export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  books: {
    list: "/books",
    create: "/books",
    detail: (id: string | number) => `/books/${id}`,
    availability: (id: string | number) => `/books/${id}/availability`,
    issue: "/transactions/issue",
    reserve: "/reservations",
  },
  loans: {
    mine: "/transactions/my",
    return: "/transactions/return",
  },
  reservations: {
    mine: "/reservations/my",
    create: "/reservations",
    cancel: (id: string | number) => `/reservations/${id}`,
  },
  recommendations: (userId: string | number) => `/recommendations/${userId}`,
  branches: "/branches",
  branchCreate: "/branches",
  transactions: {
    all: "/transactions",
  },
  users: "/users",
  usersProfile: (id: string | number) => `/users/${id}`,
  auditLog: "/audit-logs",
  inventory: {
    list: "/inventory",
    add: "/inventory",
    transfer: "/inventory/transfer",
  },
};
