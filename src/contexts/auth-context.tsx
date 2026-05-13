"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AuthSession, UserRole } from "@/types/auth";

type AuthContextValue = AuthSession & {
  isReady: boolean;
  isAuthenticated: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sesión al montar
  useEffect(() => {
    async function restoreSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        applySession(session);
      } catch {
        // sesión inválida, ignorar
      } finally {
        setIsReady(true);
      }
    }

    restoreSession();

    // Escuchar cambios de sesión (refresh de token, logout en otra pestaña)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        applySession(session);
      },
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

function applySession(session: Session | null) {
  if (session) {
    setToken(session.access_token);
    const metaRole = session.user.user_metadata?.role as UserRole | undefined;
    if (metaRole === "admin" || metaRole === "empleado") {
      setRole(metaRole);
    } else {
      supabase
        .from("usuarios")
        .select("rol")
        .eq("auth_user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.rol === "admin" || data?.rol === "empleado") {
            setRole(data.rol as UserRole);
          }
        });
    }
  } else {
    setToken(null);
    setRole(null);
  }
}

  const login = useCallback(
    async ({
      email,
      password,
      slug,
    }: {
      email: string;
      password: string;
      slug: string;
    }) => {
      setError(null);

      // 1. Autenticar con Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.session) {
        const msg = "Credenciales incorrectas. Intenta de nuevo.";
        setError(msg);
        throw new Error("auth_failed");
      }

      // 2. Obtener rol desde la tabla `usuarios` filtrando por tenant
      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("rol, esta_activo")
        .eq("auth_user_id", authData.user.id)
        .single();

      console.log("usuario:", usuario);
      console.log("userError:", userError);
      console.log("auth_user_id buscado:", authData.user.id);

      if (userError || !usuario) {
        await supabase.auth.signOut();
        setError("No tienes acceso a este negocio.");
        throw new Error("no_tenant_access");
      }

      if (!usuario.esta_activo) {
        await supabase.auth.signOut();
        setError("Tu cuenta está desactivada.");
        throw new Error("account_disabled");
      }

      const userRole = usuario.rol as UserRole;

      setToken(authData.session.access_token);
      setRole(userRole);
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setToken(null);
    setRole(null);
  }, [supabase]);

  const setSession = useCallback((session: AuthSession) => {
    setToken(session.token);
    setRole(session.role);
  }, []);

  const hasRole = useCallback(
    (expectedRole: UserRole) => role === expectedRole,
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
      error,
    }),
    [token, role, isReady, login, logout, setSession, hasRole, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
