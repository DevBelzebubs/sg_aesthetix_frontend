"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const { login, isAuthenticated, role, isReady } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [redirecting, setRedirecting] = useState(false);

  // Redirigir si ya tiene sesión
  useEffect(() => {
    if (isReady && isAuthenticated && role && !redirecting) {
      setRedirecting(true);
      const target = role === "admin" ? "/admin" : "/empleado";
      router.replace(target);
    }
  }, [isReady, isAuthenticated, role, router, redirecting]);

  // Esperar a que el contexto esté listo
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-4 w-4 animate-pulse rounded-full bg-white/20" />
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/30">
          Redirigiendo...
        </p>
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password, slug });
      console.log("login exitoso, esperando re-render...");
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "";
      setError(
        code === "no_tenant_access"
          ? "No tienes acceso a este negocio."
          : code === "account_disabled"
            ? "Tu cuenta está desactivada. Contacta al administrador."
            : code === "password_mismatch"
              ? "Error de autenticación. Ve a Supabase Dashboard > SQL Editor y pega el SQL de la consola."
              : "Credenciales incorrectas. Intenta de nuevo.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Fondo punteado */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Ícono + título */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-white/10 bg-white/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            className="text-2xl font-light tracking-[0.08em] text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            ACCESO INTERNO
          </h1>
          <p className="mt-1 text-[10px] font-medium tracking-[0.2em] uppercase text-white/30">
            {slug}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40">
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
            />
          </div>

          {error && (
            <div className="border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-white/20 bg-white px-6 py-3.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href={`/${slug}`}
            className="text-[10px] tracking-[0.14em] uppercase text-white/25 transition hover:text-white/50"
          >
            ← Volver a la página pública
          </Link>
        </div>
      </div>
    </div>
  );
}
