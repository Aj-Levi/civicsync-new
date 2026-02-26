import { create } from "zustand";
import * as api from "../lib/api";

export type Language = "en" | "hi" | "pa";
export type UserRole = "citizen" | "admin" | "superadmin" | "guest";

interface SessionUser {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  username?: string;
  role?: string;
  district?: string;
  department?: unknown;
  preferredLanguage?: string;
}

interface SessionState {
  isAuthenticated: boolean;
  role: UserRole;
  user: SessionUser | null;
  language: Language;

  // Called after OTP verified — sets citizen session from API response
  setCitizenSession: (user: SessionUser) => void;
  // Called after admin login — sets admin session from API response
  setAdminSession: (user: SessionUser) => void;

  loginGuest: () => void;
  logout: () => Promise<void>;
  setLanguage: (lang: Language) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isAuthenticated: false,
  role: "guest",
  user: null,
  language: "en",

  setCitizenSession: (user: SessionUser) => {
    set({ isAuthenticated: true, role: "citizen", user });
  },

  setAdminSession: (user: SessionUser) => {
    set({ isAuthenticated: true, role: "admin", user });
  },

  loginGuest: () => {
    set({ isAuthenticated: true, role: "guest", user: null });
  },

  logout: async () => {
    try {
      const { role } = get();
      if (role === "admin" || role === "superadmin") {
        await api.adminLogout();
      } else {
        await api.logout();
      }
    } catch {
      // Always clear local state even if API call fails
    }
    set({ isAuthenticated: false, role: "guest", user: null });
  },

  setLanguage: (lang: Language) => set({ language: lang }),
}));
