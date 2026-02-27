import { create } from "zustand";
import * as api from "../lib/api";

export type Language = "en" | "hi" | "pa";
export type UserRole =
  | "citizen"
  | "admin"
  | "superadmin"
  | "head_admin"
  | "guest";

interface SessionUser {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  username?: string;
  role?: UserRole;
  district?: string;
  department?: unknown;
  preferredLanguage?: string;
}

interface SessionState {
  isAuthenticated: boolean;
  role: UserRole;
  user: SessionUser | null;
  language: Language;

  setCitizenSession: (user: SessionUser) => void;
  setAdminSession: (user: SessionUser) => void;
  setHeadAdminSession: (user: SessionUser) => void;

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
    set({
      isAuthenticated: true,
      role: user.role === "superadmin" ? "superadmin" : "admin",
      user,
    });
  },

  setHeadAdminSession: (user: SessionUser) => {
    set({ isAuthenticated: true, role: "head_admin", user });
  },

  loginGuest: () => {
    set({ isAuthenticated: true, role: "guest", user: null });
  },

  logout: async () => {
    try {
      const { role } = get();
      if (role === "admin" || role === "superadmin") {
        await api.adminLogout();
      } else if (role === "head_admin") {
        await api.headAdminLogout();
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
