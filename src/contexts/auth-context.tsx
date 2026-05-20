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

      // 1. Try Supabase Auth sign in
      let { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      // 2. If sign in fails, try to sync the auth user from `usuarios` table
      if (authError || !authData.session) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await res.json();

        if (!res.ok) {
          let msg = "Credenciales incorrectas. Intenta de nuevo.";
          let errCode = "auth_failed";
          if (result.error === "Cuenta desactivada") {
            msg = "Tu cuenta está desactivada. Contacta al administrador.";
            errCode = "account_disabled";
          } else if (result.needsReset) {
            msg = "Error de autenticación. Ve a Supabase Dashboard > SQL Editor y pega el SQL que ves en la consola (F12).";
            errCode = "password_mismatch";
          }
          setError(msg);
          throw new Error(errCode);
        }

        if (result.created) {
          const second = await supabase.auth.signInWithPassword({ email, password });
          authData = second.data;
          authError = second.error;
        } else {
          const second = await supabase.auth.signInWithPassword({ email, password });
          authData = second.data;
          authError = second.error;
        }

        if (authError || !authData?.session) {
          setError("Credenciales incorrectas. Intenta de nuevo.");
          throw new Error("auth_failed");
        }
      }

      const session = authData.session!;

      // 3. Obtener rol desde la tabla `usuarios`
      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("rol, esta_activo")
        .eq("auth_user_id", session.user.id)
        .single();

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

      setToken(session.access_token);
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
