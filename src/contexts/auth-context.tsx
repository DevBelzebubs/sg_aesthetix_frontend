"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, UserRole } from "@/types/auth";

const STORAGE_KEY = "sg_aesthetix_session";

type AuthContextValue = AuthSession & {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  login: (credentials: {
    email: string;
    password: string;
    slug: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (session: AuthSession) => void;
  hasRole: (role: UserRole) => boolean;
  error: string | null;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

function loadSession(): { token: string | null; role: UserRole | null; userId: string | null } {
  if (typeof window === "undefined") return { token: null, role: null, userId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, role: null, userId: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token ?? null,
      role: parsed.role ?? null,
      userId: parsed.userId ?? null,
    };
  } catch {
    return { token: null, role: null, userId: null };
  }
}

function saveSession(token: string | null, role: UserRole | null, userId: string | null) {
  if (typeof window === "undefined") return;
  if (!token || !role) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, role, userId }));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSession();
    setToken(stored.token);
    setRole(stored.role);
    setUserId(stored.userId);
    setIsReady(true);
  }, []);

  const login = useCallback(
    async ({
      email,
      password,
    }: {
      email: string;
      password: string;
      slug: string;
    }) => {
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        let msg = "Credenciales incorrectas. Intenta de nuevo.";
        if (result.error === "Cuenta desactivada") {
          msg = "Tu cuenta está desactivada. Contacta al administrador.";
        }
        setError(msg);
        throw new Error(msg);
      }

      const userRole = result.role as UserRole;

      setToken(result.userId);
      setRole(userRole);
      setUserId(result.userId);
      saveSession(result.userId, userRole, result.userId);
    },
    [],
  );

  const logout = useCallback(async () => {
    setToken(null);
    setRole(null);
    setUserId(null);
    saveSession(null, null, null);
    router.push("/home");
  }, [router]);

  const setSession = useCallback((session: AuthSession) => {
    setToken(session.token);
    setRole(session.role);
    setUserId(session.token);
    saveSession(session.token, session.role, session.token);
  }, []);

  const hasRole = useCallback(
    (expectedRole: UserRole) => role === expectedRole,
    [role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      userId,
      isReady,
      isAuthenticated: Boolean(token && role),
      login,
      logout,
      setSession,
      hasRole,
      error,
    }),
    [token, role, userId, isReady, login, logout, setSession, hasRole, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
