"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, UserRole } from "@/types/auth";

type AuthContextValue = AuthSession & {
  isReady: boolean;
  isAuthenticated: boolean;
  login: (session: { token: string; role: UserRole }) => void;
  logout: () => void;
  setSession: (session: AuthSession) => void;
  hasRole: (role: UserRole) => boolean;
};

const AUTH_STORAGE_KEY = "sg-aesthetix-auth";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem(AUTH_STORAGE_KEY);

      if (!persisted) {
        setIsReady(true);
        return;
      }

      const parsed = JSON.parse(persisted) as Partial<AuthSession>;

      setToken(parsed.token ?? null);
      setRole(parsed.role === "admin" || parsed.role === "empleado" ? parsed.role : null);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token || !role) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token,
        role,
      } satisfies AuthSession),
    );
  }, [isReady, role, token]);

  const login = useCallback((session: { token: string; role: UserRole }) => {
    setToken(session.token);
    setRole(session.role);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
  }, []);

  const setSession = useCallback((session: AuthSession) => {
    setToken(session.token);
    setRole(session.role);
  }, []);

  const hasRole = useCallback(
    (expectedRole: UserRole) => {
      return role === expectedRole;
    },
    [role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      isReady,
      isAuthenticated: Boolean(token && role),
      login,
      logout,
      setSession,
      hasRole,
    }),
    [token, role, isReady, login, logout, setSession, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
