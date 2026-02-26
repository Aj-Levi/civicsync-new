import { create } from "zustand";
import { dummyUser, dummyAdmin } from "../data/dummyData";

export type Language = "en" | "hi" | "pa";
export type UserRole = "citizen" | "admin" | "guest";

interface SessionUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  department?: string;
}

interface SessionState {
  isAuthenticated: boolean;
  role: UserRole;
  user: SessionUser | null;
  language: Language;
  loginCitizen: (phone: string) => void;
  loginAdmin: (username: string, password: string) => boolean;
  loginGuest: () => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  role: "guest",
  user: null,
  language: "en",

  loginCitizen: (phone: string) => {
    // Simulate OTP verified — accept any number
    set({
      isAuthenticated: true,
      role: "citizen",
      user: { ...dummyUser, phone },
    });
  },

  loginAdmin: (username: string, password: string) => {
    if (username === dummyAdmin.username && password === dummyAdmin.password) {
      set({
        isAuthenticated: true,
        role: "admin",
        user: {
          id: dummyAdmin.id,
          name: dummyAdmin.name,
          email: dummyAdmin.email,
          department: dummyAdmin.department,
        },
      });
      return true;
    }
    return false;
  },

  loginGuest: () => {
    set({
      isAuthenticated: true,
      role: "guest",
      user: null,
    });
  },

  logout: () =>
    set({
      isAuthenticated: false,
      role: "guest",
      user: null,
    }),

  setLanguage: (lang: Language) => set({ language: lang }),
}));
