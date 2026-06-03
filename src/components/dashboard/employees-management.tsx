"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Filter, Globe, Loader2, PencilLine, Plus, Search, ShieldCheck, Trash2, Undo2, UserCog, UserRound, Users, X, AlertCircle } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { Toast } from "@/components/dashboard/toast";
import type { ToastType } from "@/components/dashboard/toast";
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
  imagen_url: "",
  instagram: "",
  facebook: "",
  tiktok: "",
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
  const [inactiveEmployees, setInactiveEmployees] = useState<Employee[]>([]);
  const [showInactive, setShowInactive] = useState(false);
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
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
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

  useEffect(() => {
    if (!showInactive) return;
    setLoading(true);
    EmployeesService.getInactivos()
      .then(setInactiveEmployees)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [showInactive]);

  const handleRestoreEmployee = async (id: string) => {
    await EmployeesService.restore(id);
    setInactiveEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const employeesForList = showInactive ? inactiveEmployees : employees;

  const filteredEmployees = useMemo(() => {
    return employeesForList.filter((employee) => {
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
  }, [employeesForList, query, statusFilter, roleFilter]);

  useEffect(() => { setPage(1); }, [query, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  const selectedEmployee = (showInactive ? inactiveEmployees : employees).find((e) => e.id === selectedId);

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
    setShowInactive(false);
  };

  const handleDesactivate = async () => {
    if (!selectedId) return;
    try {
      await EmployeesService.remove(selectedId);
      setEmployees((prev) => prev.filter((e) => e.id !== selectedId));
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar");
    } finally {
      setIsDeleteOpen(false);
    }
  };

  const handleDeactivateFromCard = async () => {
    if (!deactivateTarget) return;
    try {
      await EmployeesService.remove(deactivateTarget.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deactivateTarget.id));
      setToastMessage(`${deactivateTarget.name} ha sido desactivado.`);
      setToastType("success");
      setToastOpen(true);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Error al desactivar");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setDeactivateTarget(null);
    }
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
          imagen_url: draft.imagen_url,
          instagram: draft.instagram || undefined,
          facebook: draft.facebook || undefined,
          tiktok: draft.tiktok || undefined,
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
          imagen_url: draft.imagen_url,
          instagram: draft.instagram || undefined,
          facebook: draft.facebook || undefined,
          tiktok: draft.tiktok || undefined,
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
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {showInactive ? "Empleados desactivados" : "Tu equipo"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {showInactive
                ? `${inactiveEmployees.length} empleado(s) en papelera`
                : `${employees.length} empleado${employees.length !== 1 ? "s" : ""} registrado${employees.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowInactive((v) => !v); setQuery(""); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-4 py-2 text-sm font-semibold text-[var(--destructive)] transition ${
                showInactive
                  ? "bg-[var(--destructive-hover)]"
                  : "hover:bg-[var(--destructive-hover)]"
              }`}
            >
              <Trash2 size={16} />
              Papelera
            </button>
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
        </div>

        {mode === "list" && !showInactive && (
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
                {showInactive
                  ? "No hay empleados en la papelera."
                  : query || statusFilter !== "Todos" || roleFilter !== "Todos"
                    ? "No se encontraron empleados con esos filtros."
                    : "No hay empleados registrados. Crea el primero."}
              </p>
            </div>
          ) : (
            paginatedEmployees.map((employee) => (
              <article
                key={employee.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-5">
                  <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] ${!employee.imagenUrl ? "bg-[var(--background)]" : ""}`}>
                    {employee.imagenUrl ? (
                      <img src={employee.imagenUrl} alt={employee.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={32} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[var(--foreground)]">{employee.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            employee.role === "admin"
                              ? "bg-purple-500/10 text-purple-500"
                              : "bg-[var(--hover)]/10 text-[var(--hover)]"
                          }`}>
                            {employee.role}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            employee.status === "Activo"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                          }`}>
                            {employee.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {employee.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {employee.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-full bg-[var(--hover)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--hover)]"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                    {(employee.instagram || employee.facebook || employee.tiktok) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {employee.instagram && (
                          <a
                            href={employee.instagram.startsWith("http") ? employee.instagram : `https://instagram.com/${employee.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
                            title="Instagram"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><line x1="18" y1="5.5" x2="18.01" y2="5.5"/></svg>
                          </a>
                        )}
                        {employee.facebook && (
                          <a
                            href={employee.facebook.startsWith("http") ? employee.facebook : `https://facebook.com/${employee.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
                            title="Facebook"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                          </a>
                        )}
                        {employee.tiktok && (
                          <a
                            href={employee.tiktok.startsWith("http") ? employee.tiktok : `https://tiktok.com/@${employee.tiktok.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
                            title="TikTok"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  {showInactive ? (
                    <button
                      type="button"
                      onClick={() => handleRestoreEmployee(employee.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--hover)] py-2 text-sm font-semibold text-[var(--hover)] transition hover:bg-[var(--hover)]/10"
                    >
                      <Undo2 size={14} />
                      Restaurar
                    </button>
                  ) : (
                    <>
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
                      <button
                        type="button"
                        onClick={() => setDeactivateTarget(employee)}
                        className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--destructive-border)] p-2 text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
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

          <div className="grid gap-6 lg:grid-cols-[200px_1fr] items-start">
            <div className="flex flex-col items-center">
              <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Foto de perfil</p>
              <div className="flex flex-col items-center gap-3">
                  <div className={`flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] ${!draft.imagen_url ? "bg-[var(--background)]" : ""}`}>
                    {draft.imagen_url ? (
                      <img src={draft.imagen_url} alt="Vista previa" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={40} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <CloudinaryUpload
                    cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                    onUpload={(url) => setDraft((c) => ({ ...c, imagen_url: url }))}
                  />
                  {draft.imagen_url && (
                    <button
                      type="button"
                      onClick={() => setDraft((c) => ({ ...c, imagen_url: "" }))}
                      className="text-xs text-[var(--destructive)] underline transition hover:opacity-80"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
                {mode === "edit" && selectedEmployee && (
                  <div className="mt-4 w-full space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Creado</p>
                    <p className="text-xs text-[var(--foreground)]">{formatDate(selectedEmployee.creadoEn)}</p>
                    <div className="my-2 h-px bg-[var(--border)]" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actualizado</p>
                    <p className="text-xs text-[var(--foreground)]">{formatDate(selectedEmployee.actualizadoEn)}</p>
                  </div>
                )}
            </div>

            <div className="space-y-4">
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
                <Field label="Instagram">
                  <input
                    value={draft.instagram}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, instagram: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="@usuario o url"
                  />
                </Field>
                <Field label="Facebook">
                  <input
                    value={draft.facebook}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, facebook: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="url o usuario"
                  />
                </Field>
                <Field label="TikTok">
                  <input
                    value={draft.tiktok}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, tiktok: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="@usuario o url"
                  />
                </Field>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <ShieldCheck size={18} className="text-[var(--text-muted)] shrink-0" />
                  <div className="grid gap-2 flex-1 sm:grid-cols-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputClassName}
                      placeholder={mode === "create" ? "Clave de acceso" : "Nueva clave (opcional)"}
                      autoComplete="new-password"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={inputClassName}
                      placeholder={mode === "create" ? "Repetir clave" : "Repetir nueva clave"}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] shrink-0">Estado</span>
                  <div className="flex rounded-xl bg-[var(--background-secondary)] p-0.5">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, esta_activo: true }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${draft.esta_activo ? "bg-[var(--hover)] text-white" : "text-[var(--text-muted)]"}`}
                    >
                      Activo
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, esta_activo: false }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!draft.esta_activo ? "bg-neutral-700 text-white" : "text-[var(--text-muted)]"}`}
                    >
                      Inactivo
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && (
                <p className="text-sm text-[var(--destructive)]">{passwordError}</p>
              )}
            </div>
          </div>

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
            {mode === "edit" && (
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
              >
                <Trash2 size={16} />
                Desactivar
              </button>
            )}
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

      <ConfirmationModal
        open={isDeleteOpen}
        title="Desactivar empleado"
        description="El empleado pasara a estado inactivo. Podras restaurarlo desde la papelera."
        confirmLabel="Si, desactivar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDesactivate}
      />

      <ConfirmationModal
        open={deactivateTarget !== null}
        title="Desactivar empleado"
        description={`${deactivateTarget?.name ?? ""} pasara a estado inactivo. Podras restaurarlo desde la papelera.`}
        confirmLabel="Si, desactivar"
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateFromCard}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
    imagen_url: employee.imagenUrl ?? "",
    instagram: employee.instagram ?? "",
    facebook: employee.facebook ?? "",
    tiktok: employee.tiktok ?? "",
  };
}
