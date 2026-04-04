"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Shield,
  LayoutDashboard,
  Calendar,
  Users,
  User,
  Boxes,
  Image,
  KeyRound,
  Scissors,
  Star,
  Building2,
} from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/acceso-seguridad", label: "Acceso y seguridad", icon: KeyRound },
  { href: "/admin/agenda", label: "Agenda", icon: Calendar },
  { href: "/admin/empleados", label: "Empleados", icon: Users },
  { href: "/admin/clientes", label: "Clientes", icon: User },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/fidelizacion", label: "Fidelizacion", icon: Star },
  { href: "/admin/galeria", label: "Galeria", icon: Image },
  { href: "/admin/configuracion/empresa", label: "Negocio", icon: Building2 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Menu
            </p>
            <p className="pt-1 text-lg font-bold text-zinc-900">SG Aesthetix</p>
          </div>

          <div className="mt-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-600 p-2 text-white shadow-sm">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Cuenta principal</p>
                <p className="text-xs text-zinc-600">Solo para personas autorizadas</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {navigation.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition
                    ${
                      active
                        ? "bg-gradient-to-r from-zinc-900 to-zinc-700 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
