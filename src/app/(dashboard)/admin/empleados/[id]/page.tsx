import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Globe, Mail, Phone, UserRound, Star, TrendingUp, Briefcase } from "lucide-react";
import { EmployeesService } from "@/services/employees.service";
import { EmployeePasswordSection } from "@/components/dashboard/employee-password-section";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

type EmpleadoDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EmpleadoDetailPage({ params }: EmpleadoDetailPageProps) {
  const { id } = await params;

  let employee;
  try {
    employee = await EmployeesService.getById(id);
  } catch {
    return (
      <ModulePageShell
        breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Empleados", href: "/admin/empleados" }, { label: "Ver perfil" }]}
        title="Ver perfil"
        description="No se pudo cargar la informacion."
      >
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-sm text-[var(--destructive)]">Error al cargar empleado</p>
          <Link
            href="/admin/empleados"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </Link>
        </div>
      </ModulePageShell>
    );
  }

  if (!employee) {
    return (
      <ModulePageShell title="Ver perfil" description="El empleado no existe o fue eliminado.">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-sm text-[var(--text-muted)]">No se encontro el empleado.</p>
          <Link
            href="/admin/empleados"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </Link>
        </div>
      </ModulePageShell>
    );
  }

  const creado = formatDate(employee.creadoEn);
  const actualizado = formatDate(employee.actualizadoEn);

  return (
    <ModulePageShell
      breadcrumb={[
        { label: "Administracion", href: "/admin" },
        { label: "Empleados", href: "/admin/empleados" },
        { label: employee.name },
      ]}
      title={employee.name}
      description={`${employee.role === "admin" ? "Administrador" : "Empleado"} · ${employee.email}`}
      actions={
        <Link
          href="/admin/empleados"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--hover)]/40 hover:bg-[var(--background)]"
        >
          <ArrowLeft size={15} />
          Volver al listado
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Header card */}
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm">
          <div className="grid gap-0 md:grid-cols-[280px_1fr]">
            {/* Left - Avatar & basic info */}
            <div className="flex flex-col items-center border-r border-[var(--border)] p-8">
              <div className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] ${!employee.imagenUrl ? "bg-[var(--background)]" : ""}`}>
                {employee.imagenUrl ? (
                  <img src={employee.imagenUrl} alt={employee.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={48} className="text-[var(--text-muted)]" />
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">{employee.name}</h2>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  employee.role === "admin"
                    ? "bg-purple-500/10 text-purple-500"
                    : "bg-[var(--hover)]/15 text-[var(--hover)]"
                }`}>
                  {employee.role === "admin" ? "Administrador" : "Empleado"}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  employee.status === "Activo"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                }`}>
                  {employee.status}
                </span>
              </div>

              {(employee.specialties.length > 0 || employee.weeklyLoad || employee.commission) && (
                <div className="mt-5 w-full space-y-2 border-t border-[var(--border)] pt-4">
                  {employee.specialties.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {employee.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-[var(--hover)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--hover)]">{s}</span>
                      ))}
                    </div>
                  )}
                  {employee.weeklyLoad && (
                    <p className="text-center text-xs text-[var(--text-muted)]">
                      <Briefcase size={12} className="inline mr-1" />
                      Carga semanal: {employee.weeklyLoad}
                    </p>
                  )}
                  {employee.commission && (
                    <p className="text-center text-xs text-[var(--text-muted)]">
                      <TrendingUp size={12} className="inline mr-1" />
                      Comisión: {employee.commission}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right - Details */}
            <div className="space-y-4 p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Correo electrónico</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)] truncate">{employee.email}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Teléfono</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{employee.phone || "Sin registrar"}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Creado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{creado}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Último cambio</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{actualizado}</p>
                </div>
              </div>

              {(employee.instagram || employee.facebook || employee.tiktok) && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Redes sociales</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {employee.instagram && (
                      <a
                        href={employee.instagram.startsWith("http") ? employee.instagram : `https://instagram.com/${employee.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-[var(--hover)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><line x1="18" y1="5.5" x2="18.01" y2="5.5"/></svg>
                        Instagram
                      </a>
                    )}
                    {employee.facebook && (
                      <a
                        href={employee.facebook.startsWith("http") ? employee.facebook : `https://facebook.com/${employee.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-[var(--hover)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        Facebook
                      </a>
                    )}
                    {employee.tiktok && (
                      <a
                        href={employee.tiktok.startsWith("http") ? employee.tiktok : `https://tiktok.com/@${employee.tiktok.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-[var(--hover)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                        TikTok
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password section */}
        <EmployeePasswordSection userId={id} />
      </div>
    </ModulePageShell>
  );
}
