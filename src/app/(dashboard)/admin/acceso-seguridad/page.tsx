import { KeyRound, LockKeyhole, ShieldCheck, Smartphone, UserCog } from "lucide-react";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

const securityControls = [
  {
    title: "Roles y permisos",
    description: "Decide que puede ver o cambiar cada persona.",
    icon: UserCog,
  },
  {
    title: "Claves",
    description: "Define reglas para que las claves sean mas seguras.",
    icon: LockKeyhole,
  },
  {
    title: "Equipos conectados",
    description: "Revisa desde donde entran y cierra accesos si hace falta.",
    icon: Smartphone,
  },
  {
    title: "Verificacion adicional",
    description: "Agrega un paso extra para cuidar las cuentas mas importantes.",
    icon: ShieldCheck,
  },
];

export default async function AccesoSeguridadPage() {
  const supabase = await createServerSupabase();

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("nombres, apellidos, rol, esta_activo, correo_electronico")
    .order("creado_en", { ascending: false });

  const activos = usuarios?.filter((u) => u.esta_activo).length ?? 0;
  const admins = usuarios?.filter((u) => u.rol === "admin").length ?? 0;

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Acceso y seguridad" }]}
      title="Acceso y seguridad"
      description="Revisa quien entra al sistema y cuida el acceso de tu equipo."
    >
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm">
            <div
              className="flex items-center justify-between border-b border-transparent/5 px-4 py-3"
              style={{
                background: "color-mix(in srgb, var(--hover) 8%, var(--background-secondary))",
              }}
            >
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Personas con acceso</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {activos} activas de {usuarios?.length ?? 0} cuentas
                </p>
              </div>
              <div className="rounded-full bg-[var(--hover)] px-3 py-1 text-xs font-semibold text-white">
                {usuarios?.length ?? 0} cuentas
              </div>
            </div>

            {usuarios && usuarios.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--background-secondary)] text-left text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.correo_electronico} className="border-t border-transparent/5">
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                        {user.nombres} {user.apellidos}
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--foreground)]">{user.rol}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.esta_activo
                              ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                              : "bg-[var(--warning)]/15 text-[var(--warning)]"
                          }`}
                        >
                          {user.esta_activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{user.correo_electronico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-6 text-sm text-[var(--text-muted)]">No hay usuarios registrados.</p>
            )}
          </div>

          <div
            className="rounded-3xl border border-[var(--border)] p-6 shadow-sm"
            style={{
              background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="rounded-2xl p-3"
                style={{
                  background: "color-mix(in srgb, var(--hover) 12%, var(--background-secondary))",
                }}
              >
                <KeyRound size={18} style={{ color: "var(--hover)" }} />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">Resumen rapido</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Estado actual del acceso de tu equipo.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Cuentas activas
                </p>
                <p className="mt-2 text-xl font-bold text-[var(--foreground)]">{activos}</p>
              </div>
              <div className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Administradores
                </p>
                <p className="mt-2 text-xl font-bold text-[var(--foreground)]">{admins}</p>
              </div>
              <div className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Empleados
                </p>
                <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
                  {(usuarios?.length ?? 0) - admins}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {securityControls.map((control) => {
            const Icon = control.icon;

            return (
              <article
                key={control.title}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-2xl p-3"
                    style={{
                      background: "color-mix(in srgb, var(--hover) 12%, var(--background-secondary))",
                    }}
                  >
                    <Icon size={18} style={{ color: "var(--hover)" }} />
                  </div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">{control.title}</h2>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {control.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </ModulePageShell>
  );
}
