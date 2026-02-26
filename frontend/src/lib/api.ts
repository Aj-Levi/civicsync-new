/**
 * Lightweight fetch wrapper for the CivicSync backend.
 * - Base URL comes from VITE_API_URL env var
 * - credentials: 'include' ensures httpOnly JWT cookies are sent automatically
 * - Returns parsed JSON; throws an Error with the server's message on non-2xx
 */

const BASE = import.meta.env.VITE_API_URL as string;

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  [key: string]: T | boolean | string | undefined;
}

async function request<T = ApiResponse>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include", // send httpOnly cookie with every request
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await res.json()) as T & { message?: string };

  if (!res.ok) {
    throw new Error(data.message ?? `Request failed with status ${res.status}`);
  }

  return data;
}

// ── Auth — Citizen ─────────────────────────────────────────────────────────────

export const sendOTP = (mobile: string) =>
  request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });

export const verifyOTP = (mobile: string, otp: string) =>
  request<{
    success: boolean;
    message: string;
    user: {
      id: string;
      name: string;
      mobile: string;
      district: string;
      preferredLanguage: string;
    };
  }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ mobile, otp }),
  });

export const getMe = () => request("/auth/me");

export const logout = () => request("/auth/logout", { method: "POST" });

// ── Auth — Admin ───────────────────────────────────────────────────────────────

export const adminLogin = (username: string, password: string) =>
  request<{
    success: boolean;
    message: string;
    admin: {
      id: string;
      name: string;
      username: string;
      email: string;
      role: string;
      district: unknown;
      department: unknown;
    };
  }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const adminLogout = () => request("/admin/logout", { method: "POST" });

export const adminGetMe = () => request("/admin/me");
