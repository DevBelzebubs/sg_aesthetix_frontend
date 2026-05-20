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
      title="Acceso y seguridad"
      description="Revisa quien entra al sistema y cuida el acceso de tu equipo."
    >
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Personas con acceso</p>
                <p className="text-xs text-zinc-500">
                  {activos} activas de {usuarios?.length ?? 0} cuentas
                </p>
              </div>
              <div className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">
                {usuarios?.length ?? 0} cuentas
              </div>
            </div>

            {usuarios && usuarios.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead className="bg-white text-left text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.correo_electronico} className="border-t border-zinc-100">
                      <td className="px-4 py-3 font-semibold text-zinc-900">
                        {user.nombres} {user.apellidos}
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-700">{user.rol}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.esta_activo
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          {user.esta_activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{user.correo_electronico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-6 text-sm text-zinc-400">No hay usuarios registrados.</p>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3">
                <KeyRound size={18} className="text-zinc-700" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900">Resumen rapido</p>
                <p className="text-sm text-zinc-600">
                  Estado actual del acceso de tu equipo.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Cuentas activas
                </p>
                <p className="mt-2 text-xl font-bold text-zinc-900">{activos}</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Administradores
                </p>
                <p className="mt-2 text-xl font-bold text-zinc-900">{admins}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Empleados
                </p>
                <p className="mt-2 text-xl font-bold text-zinc-900">
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
                className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-fuchsia-100 to-sky-100 p-3">
                    <Icon size={18} className="text-zinc-700" />
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900">{control.title}</h2>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
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
