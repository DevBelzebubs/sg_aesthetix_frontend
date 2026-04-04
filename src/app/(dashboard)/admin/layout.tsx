import type { ReactNode } from "react";
import Link from "next/link";

const navigation = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/empleados", label: "Empleados" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/fidelizacion", label: "Fidelización" },
  { href: "/admin/galeria", label: "Galería" },
  { href: "/admin/configuracion/tema", label: "Tema" },
  { href: "/admin/configuracion/empresa", label: "Empresa" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Admin
          </p>
          <p className="px-2 pt-1 text-xl font-bold tracking-tight">SG Aesthetix</p>

          <nav className="mt-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
