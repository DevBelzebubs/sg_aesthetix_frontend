"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Calendar,
  Users,
  User,
  MapPin,
  Boxes,
  Image,
  Scissors,
  Star,
  ArrowLeft,
  Menu,
  X,
  Sun,
  Moon,
  Tag,
  Folder,
  Settings,
  ShoppingCart,
  ArrowDownToLine,
  PackagePlus,
  BookOpen,
  Globe,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/theme-context";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
};

const navGroups: NavGroup[] = [
  {
    label: "PANEL",
    items: [
      { href: "/admin", label: "Resumen", icon: LayoutDashboard },
      { href: "/admin/agenda", label: "Agenda", icon: Calendar },
    ],
  },
  {
    label: "OPERACIONES",
    items: [
      { href: "/admin/servicios", label: "Servicios", icon: Scissors },
      { href: "/admin/categoria-servicios", label: "Cat. Servicios", icon: Folder },
      { href: "/admin/empleados", label: "Empleados", icon: Users },
      { href: "/admin/locales", label: "Locales", icon: MapPin },
    ],
  },
  {
    label: "INVENTARIO Y LOGÍSTICA",
    items: [
      { href: "/admin/inventario", label: "Productos", icon: Boxes },
      { href: "/admin/categoria-productos", label: "Cat. Productos", icon: Tag },
      { href: "/admin/ingreso-mercaderia", label: "Ingreso Mercadería", icon: PackagePlus },
      { href: "/admin/movimientos-inventario", label: "Mov. Inventario", icon: ArrowDownToLine },
    ],
  },
  {
    label: "VENTAS Y CLIENTES",
    items: [
      { href: "/admin/ventas", label: "Ventas", icon: ShoppingCart },
      { href: "/admin/fidelizacion", label: "Fidelización", icon: Star },
      { href: "/admin/clientes", label: "Clientes", icon: User },
    ],
  },
  {
    label: "CONTROL EMPRESA",
    items: [
      { href: "/admin/galeria", label: "Galería", icon: Image },
      { href: "/admin/hero", label: "Hero", icon: Globe },
      { href: "/admin/libro-reclamaciones", label: "Libro Reclamaciones", icon: BookOpen },
    ],
  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Menu</p>
        <p className="pt-1 text-lg font-bold text-[var(--foreground)]">PANEL ADMIN</p>
      </div>

      <div
        className="mt-4 rounded-2xl border px-4 py-3"
        style={{
          borderColor: "color-mix(in srgb, var(--hover) 30%, transparent)",
          background: "color-mix(in srgb, var(--hover) 8%, var(--background-secondary))",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 text-white shadow-sm" style={{ background: "var(--hover)" }}>
            <Shield size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Cuenta principal</p>
            <p className="text-xs text-[var(--text-muted)]">Solo para personas autorizadas</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
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
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-transparent/10 pt-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
        </button>
        <Link
          href="/home"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={18} />
          <span>Página pública</span>
        </Link>
        <button
          onClick={() => { logout(); onClose?.(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--warning)] transition hover:bg-[var(--warning)]/10"
        >
          <X size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isReady, isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/home");
    } else if (role === "empleado") {
      router.replace("/empleado");
    }
  }, [isReady, isAuthenticated, role, router]);

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
        <p className="text-base font-bold text-[var(--foreground)]">PANEL ADMIN</p>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-transparent/10 p-2 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 flex-col bg-[var(--background-secondary)] p-4 shadow-xl overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest">Menú</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Layout desktop */}
      <div className="mx-auto grid w-full max-w-[1660px] gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 shadow-sm lg:block lg:sticky lg:top-6">
          <Sidebar />
        </aside>
        <main className="mx-auto w-full min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
