"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Filter, Loader2, PencilLine, Plus, Search, ShieldCheck, UserCog, UserRound, Users, X, AlertCircle } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { EmployeesService } from "@/services/employees.service";
import type { Employee, EmployeeDraft, EmployeeFilter } from "@/types/employee";

const emptyDraft: EmployeeDraft = {
  nombres: "",
  apellidos: "",
  rol: "empleado",
  telefono: "",
  correo_electronico: "",
  esta_activo: true,
  specialties: "",
  weeklyLoad: "",
  commission: "",
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  kpiActivos: number;
  kpiAdmins: number;
  kpiEmpleados: number;
};

export function EmployeesManagement({ kpiActivos, kpiAdmins, kpiEmpleados }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeFilter>("Todos");
  const [roleFilter, setRoleFilter] = useState<"Todos" | "admin" | "empleado">("Todos");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EmployeeDraft>(emptyDraft);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await EmployeesService.getAll();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar empleados");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesQuery =
        employee.name.toLowerCase().includes(query.toLowerCase()) ||
        employee.role.toLowerCase().includes(query.toLowerCase()) ||
        employee.specialties.some((specialty) => specialty.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus =
        statusFilter === "Todos" || employee.status === statusFilter;
      const matchesRole =
        roleFilter === "Todos" || employee.role === roleFilter;
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [employees, query, statusFilter, roleFilter]);

  useEffect(() => { setPage(1); }, [query, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  const selectedEmployee = employees.find((employee) => employee.id === selectedId);

  const handleEdit = (employee: Employee) => {
    setSelectedId(employee.id);
    setDraft(toDraft(employee));
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setMode("edit");
  };

  const handleCreate = () => {
    setSelectedId(null);
    setDraft(emptyDraft);
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setMode("create");
  };

  const handleBack = () => {
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.nombres || !draft.apellidos) return;

    if (password && password !== confirmPassword) {
      setPasswordError("Las claves no coinciden.");
      return;
    }
    if (mode === "create" && (!password || password.length < 6)) {
      setPasswordError("La clave debe tener al menos 6 caracteres.");
      return;
    }
    setPasswordError("");

    setSaving(true);
    try {
      if (mode === "create") {
        const created = await EmployeesService.create({
          nombres: draft.nombres,
          apellidos: draft.apellidos,
          correo_electronico: draft.correo_electronico,
          telefono: draft.telefono,
          esta_activo: draft.esta_activo,
          clave_hash: password,
        });
        setEmployees((current) => [created, ...current]);
      } else if (mode === "edit" && selectedId) {
        const updated = await EmployeesService.update(selectedId, {
          nombres: draft.nombres,
          apellidos: draft.apellidos,
          correo_electronico: draft.correo_electronico,
          telefono: draft.telefono,
          esta_activo: draft.esta_activo,
          ...(password ? { clave_hash: password } : {}),
        });
        setEmployees((current) =>
          current.map((emp) => (emp.id === selectedId ? updated : emp)),
        );
      }
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
      setIsConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <AlertCircle className="text-[var(--destructive)]" size={32} />
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* KPIs — solo visibles en modo listado */}
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Cuentas activas</p>
            <div className="mt-2 flex items-center gap-2">
              <ShieldCheck size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{kpiActivos}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Administradores</p>
            <div className="mt-2 flex items-center gap-2">
              <UserCog size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{kpiAdmins}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Empleados</p>
            <div className="mt-2 flex items-center gap-2">
              <Users size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{kpiEmpleados}</p>
            </div>
          </article>
        </div>
      )}

      {/* Barra de busqueda y filtros — siempre visible */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Tu equipo</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {employees.length} empleado{employees.length !== 1 ? "s" : ""} registrado{employees.length !== 1 ? "s" : ""}
            </p>
          </div>
          {mode === "list" ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
            >
              <Plus size={16} />
              Nuevo empleado
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
          )}
        </div>

        {mode === "list" && (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
              <Search size={16} className="text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, puesto o especialidad"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
              <Filter size={16} className="text-[var(--text-muted)]" />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as "Todos" | "admin" | "empleado")}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="Todos">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="empleado">Empleado</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
              <Filter size={16} className="text-[var(--text-muted)]" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as EmployeeFilter)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
        </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
      </div>

      {/* Listado */}
      {mode === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedEmployees.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <UserRound size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query || statusFilter !== "Todos" || roleFilter !== "Todos"
                  ? "No se encontraron empleados con esos filtros."
                  : "No hay empleados registrados. Crea el primero."}
              </p>
            </div>
          ) : (
            paginatedEmployees.map((employee) => (
              <article
                key={employee.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                    <UserRound size={20} />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.status === "Activo"
                        ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                        : "bg-[var(--warning)]/15 text-[var(--warning)]"
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-[var(--foreground)]">{employee.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      employee.role === "admin"
                        ? "bg-[var(--foreground)]/10 text-[var(--foreground)]"
                        : "bg-[var(--hover)]/10 text-[var(--hover)]"
                    }`}>
                      {employee.role}
                    </span>
                  </div>
                </div>

                {employee.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {employee.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(employee)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
                  >
                    <PencilLine size={14} />
                    Editar
                  </button>
                  <Link
                    href={`/admin/empleados/${employee.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  >
                    <ArrowLeft size={14} className="rotate-180" />
                    Perfil
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Formulario crear / editar */}
      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3">
              <UserRound size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {mode === "create" ? "Nuevo empleado" : "Editar empleado"}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {mode === "create"
                  ? "Completa los datos para agregar una persona al equipo."
                  : `Editando a ${selectedEmployee?.name ?? ""}`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombres" required>
              <input
                value={draft.nombres}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, nombres: event.target.value }))
                }
                className={inputClassName}
                placeholder="Nombres"
              />
            </Field>
            <Field label="Apellidos" required>
              <input
                value={draft.apellidos}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, apellidos: event.target.value }))
                }
                className={inputClassName}
                placeholder="Apellidos"
              />
            </Field>
            <Field label="Telefono">
              <input
                value={draft.telefono}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, telefono: event.target.value }))
                }
                className={inputClassName}
                placeholder="999 999 999"
              />
            </Field>
            <Field label="Email">
              <input
                value={draft.correo_electronico}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, correo_electronico: event.target.value }))
                }
                className={inputClassName}
                placeholder="correo@negocio.com"
              />
            </Field>
            <Field label="Estado">
              <select
                value={draft.esta_activo ? "Activo" : "Inactivo"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    esta_activo: event.target.value === "Activo",
                  }))
                }
                className={inputClassName}
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={`Clave ${mode === "edit" ? "(dejar en blanco para no cambiar)" : ""}`}>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
                placeholder={mode === "create" ? "Clave de acceso" : "Nueva clave (opcional)"}
              />
            </Field>
            <Field label="Confirmar clave">
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClassName}
                placeholder={mode === "create" ? "Repetir clave de acceso" : "Repetir nueva clave"}
              />
            </Field>
          </div>

          {passwordError && (
            <p className="mt-3 text-sm text-[var(--destructive)]">{passwordError}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear empleado" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={isConfirmOpen}
        title={mode === "create" ? "Confirmar nuevo empleado" : "Confirmar cambios"}
        description={
          mode === "create"
            ? "Se creara un nuevo empleado con los datos que llenaste."
            : "Se guardaran los cambios hechos en este empleado."
        }
        confirmLabel={mode === "create" ? "Si, crear" : "Si, guardar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-[var(--destructive)]">*</span>}
      </span>
      {children}
    </label>
  );
}

function toDraft(employee?: Employee): EmployeeDraft {
  if (!employee) return emptyDraft;
  return {
    nombres: employee.nombres,
    apellidos: employee.apellidos,
    rol: employee.role,
    telefono: employee.phone,
    correo_electronico: employee.email,
    esta_activo: employee.status === "Activo",
    specialties: employee.specialties.join(", "),
    weeklyLoad: employee.weeklyLoad,
    commission: employee.commission,
  };
}
