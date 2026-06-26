"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Home, Scissors, UserRound, Sun, Moon, X, ArrowLeftFromLine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/empleado", label: "Mi jornada", icon: Home },
  { href: "/empleado/servicios", label: "Mis servicios", icon: Scissors },
  { href: "/empleado/citas", label: "Mis citas", icon: CalendarClock },
];

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isReady, isAuthenticated, role, logout, userId } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/home");
    }
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    async function loadName() {
      if (!userId) return;
      const { data } = await supabase
        .from("usuarios")
        .select("nombres, apellidos")
        .eq("id", userId)
        .single();
      if (data) {
        setUserName(`${data.nombres} ${data.apellidos ?? ""}`.trim());
      }
    }
    if (isReady && isAuthenticated) loadName();
  }, [isReady, isAuthenticated, userId, supabase]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      {/* Header mobile */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 lg:hidden">
        <p className="text-base font-bold text-[var(--foreground)]">MI ESPACIO</p>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border border-transparent/10 p-2 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      <div className="mx-auto grid w-full max-w-[1660px] gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-[var(--border)] bg-[var(--background-secondary)] p-4 shadow-sm lg:sticky lg:top-6">
          <div
            className="rounded-3xl p-5"
            style={{
              background: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
              Panel
            </p>
            <p className="mt-2 text-xl font-bold">Mi espacio</p>
            <p className="mt-2 text-sm opacity-60">Revisa tus servicios y tus citas del dia.</p>
          </div>

          <div className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--background-secondary)] p-3 text-[var(--foreground)] shadow-sm">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{userName || "Empleado"}</p>
                <p className="text-xs text-[var(--text-muted)]">{role === "admin" ? "Administrador" : "Empleado"}</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--hover)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-transparent/10 pt-4 space-y-1">
            <Link
              href="/home"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            >
              <ArrowLeftFromLine size={18} />
              <span>Volver a página pública</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--warning)] transition hover:bg-[var(--warning)]/10"
            >
              <X size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
