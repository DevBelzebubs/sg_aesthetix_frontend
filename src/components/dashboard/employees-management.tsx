"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Filter, Mail, Phone, Plus, Search, Star, UserRound, Loader2, AlertCircle } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
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
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function EmployeesManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeFilter>("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EmployeeDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
      return matchesQuery && matchesStatus;
    });
  }, [employees, query, statusFilter]);

  const handleSelect = (employee: Employee) => {
    setSelectedId(employee.id);
    setDraft(toDraft(employee));
  };

  const handleSave = async () => {
    if (!draft.nombres || !draft.apellidos) return;

    setSaving(true);
    try {
      if (!selectedId) {
        const created = await EmployeesService.create({
          nombres: draft.nombres,
          apellidos: draft.apellidos,
          correo_electronico: draft.correo_electronico,
          telefono: draft.telefono,
          esta_activo: draft.esta_activo,
        });
        setEmployees((current) => [created, ...current]);
        setSelectedId(created.id);
        setDraft(toDraft(created));
      } else {
        const updated = await EmployeesService.update(selectedId, {
          nombres: draft.nombres,
          apellidos: draft.apellidos,
          correo_electronico: draft.correo_electronico,
          telefono: draft.telefono,
          esta_activo: draft.esta_activo,
        });
        setEmployees((current) =>
          current.map((emp) => (emp.id === selectedId ? updated : emp)),
        );
        setDraft(toDraft(updated));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const selectedEmployee = employees.find((employee) => employee.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <AlertCircle className="text-red-400" size={32} />
        <p className="text-sm text-zinc-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Tu equipo</p>
              <p className="mt-1 text-sm text-zinc-600">
                {employees.length} empleado{employees.length !== 1 ? "s" : ""} registrado{employees.length !== 1 ? "s" : ""}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setDraft(emptyDraft);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={16} />
              Nuevo empleado
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
              <Search size={16} className="text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, puesto o especialidad"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
              <Filter size={16} className="text-zinc-400" />
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
        </div>
        {filteredEmployees.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            No se encontraron empleados.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEmployees.map((employee) => (
              <article
                key={employee.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                  selectedId === employee.id
                    ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md"
                    : "border-zinc-200 hover:-translate-y-1 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">{employee.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{employee.role}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.status === "Activo"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-rose-100 text-rose-900"
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {employee.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <p className="flex items-center gap-2">
                    <CalendarClock size={15} />
                    {employee.weeklyLoad || "Por calcular"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Star size={15} />
                    Comision {employee.commission || "Por definir"}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelect(employee)}
                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                  >
                    Editar vista
                  </button>
                  <Link
                    href={`/admin/empleados/${employee.id}`}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Ver perfil
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            {selectedId ? "Editar empleado" : "Nuevo empleado"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Completa los datos basicos del equipo.
          </p>
          <div className="mt-4 grid gap-3">
            <Field label="Nombres">
              <input
                value={draft.nombres}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, nombres: event.target.value }))
                }
                className={inputClassName}
                placeholder="Nombres"
              />
            </Field>
            <Field label="Apellidos">
              <input
                value={draft.apellidos}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, apellidos: event.target.value }))
                }
                className={inputClassName}
                placeholder="Apellidos"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
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
            <Field label="Especialidades">
              <input
                value={draft.specialties}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, specialties: event.target.value }))
                }
                className={inputClassName}
                placeholder="Fade, Barba, Kids"
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {selectedId ? "Guardar cambios" : "Crear empleado"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedEmployee) {
                  setDraft(toDraft(selectedEmployee));
                  return;
                }
                setDraft(emptyDraft);
              }}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Restablecer
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Datos que se guardaran</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p className="flex items-center gap-2">
              <UserRound size={15} />
              Perfil base, rol y estado
            </p>
            <p className="flex items-center gap-2">
              <Mail size={15} />
              Correo para acceso y notificaciones
            </p>
            <p className="flex items-center gap-2">
              <Phone size={15} />
              Telefono para contacto interno
            </p>
          </div>
        </div>
      </aside>
      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo empleado"}
        description={
          selectedId
            ? "Se guardaran los cambios hechos en este empleado."
            : "Se creara un nuevo empleado con los datos que llenaste."
        }
        confirmLabel={selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
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
