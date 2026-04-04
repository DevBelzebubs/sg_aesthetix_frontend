"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Home, Scissors, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/empleado", label: "Mi jornada", icon: Home },
  { href: "/empleado/servicios", label: "Mis servicios", icon: Scissors },
  { href: "/empleado/citas", label: "Mis citas", icon: CalendarClock },
];

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <div className="rounded-3xl bg-zinc-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
              Panel
            </p>
            <p className="mt-2 text-xl font-bold">Mi espacio</p>
            <p className="mt-2 text-sm text-zinc-300">Revisa tus servicios y tus citas del dia.</p>
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-zinc-800 shadow-sm">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Alejandro Ruiz</p>
                <p className="text-xs text-zinc-500">Barber Senior</p>
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
                      ? "bg-gradient-to-r from-zinc-900 to-zinc-700 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
