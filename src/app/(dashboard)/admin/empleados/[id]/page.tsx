import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Globe, Mail, Phone, UserRound } from "lucide-react";
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
        {/* Hero */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${!employee.imagenUrl ? "" : ""}`}
              style={{ background: employee.imagenUrl ? "transparent" : "color-mix(in srgb, var(--hover) 15%, var(--background))" }}
            >
              {employee.imagenUrl ? (
                <img src={employee.imagenUrl} alt={employee.name} className="h-full w-full object-cover" />
              ) : (
                <UserRound size={28} style={{ color: "var(--hover)" }} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  employee.role === "admin"
                    ? "bg-[var(--foreground)]/10 text-[var(--foreground)]"
                    : "bg-[var(--hover)]/15 text-[var(--hover)]"
                }`}>
                  {employee.role}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  employee.status === "Activo"
                    ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                    : "bg-[var(--warning)]/15 text-[var(--warning)]"
                }`}>
                  {employee.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} />
                  {employee.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} />
                  {employee.phone || "Sin telefono"}
                </span>
              </div>
              {(employee.instagram || employee.facebook || employee.tiktok) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--text-muted)]">
                  {employee.instagram && (
                    <a
                      href={employee.instagram.startsWith("http") ? employee.instagram : `https://instagram.com/${employee.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transition hover:text-[var(--hover)]"
                    >
                      <Globe size={14} />
                      Instagram
                    </a>
                  )}
                  {employee.facebook && (
                    <a
                      href={employee.facebook.startsWith("http") ? employee.facebook : `https://facebook.com/${employee.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transition hover:text-[var(--hover)]"
                    >
                      <Globe size={14} />
                      Facebook
                    </a>
                  )}
                  {employee.tiktok && (
                    <a
                      href={employee.tiktok.startsWith("http") ? employee.tiktok : `https://tiktok.com/@${employee.tiktok.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transition hover:text-[var(--hover)]"
                    >
                      <Globe size={14} />
                      TikTok
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--background)] p-2.5">
                <Mail size={18} className="text-[var(--foreground)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Correo</p>
                <p className="text-sm font-medium text-[var(--foreground)]">{employee.email}</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--background)] p-2.5">
                <Phone size={18} className="text-[var(--foreground)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Telefono</p>
                <p className="text-sm font-medium text-[var(--foreground)]">{employee.phone || "Sin registrar"}</p>
              </div>
            </div>
          </article>
        </div>

        {/* Clave y actividad */}
        <div className="grid gap-4 xl:grid-cols-2">
          <EmployeePasswordSection userId={id} />

          <div
            className="rounded-3xl border border-[var(--border)] p-6 shadow-sm"
            style={{ background: "color-mix(in srgb, var(--hover) 4%, var(--background-secondary))" }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-3" style={{ background: "color-mix(in srgb, var(--hover) 12%, var(--background-secondary))" }}>
                <Calendar size={20} style={{ color: "var(--hover)" }} />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">Registro de actividad</p>
                <p className="text-sm text-[var(--text-muted)]">Fechas clave de la cuenta.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Calendar size={15} />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Creado</p>
                </div>
                <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{creado}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Clock size={15} />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Ultimo cambio</p>
                </div>
                <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{actualizado}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
