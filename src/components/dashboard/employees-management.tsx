"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Filter, Mail, Phone, Plus, Search, Star, UserRound } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

type EmployeeRecord = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: "Activo" | "Vacaciones" | "Invitado";
  specialties: string[];
  weeklyLoad: string;
  commission: string;
};

const initialEmployees: EmployeeRecord[] = [
  {
    id: "alejandro-ruiz",
    name: "Alejandro Ruiz",
    role: "Barber Senior",
    phone: "999 111 222",
    email: "alejandro@sg.local",
    status: "Activo",
    specialties: ["Fade", "Barba", "Asesoria"],
    weeklyLoad: "32 citas",
    commission: "18%",
  },
  {
    id: "matias-soto",
    name: "Matias Soto",
    role: "Barber",
    phone: "999 222 333",
    email: "matias@sg.local",
    status: "Activo",
    specialties: ["Corte clasico", "Kids"],
    weeklyLoad: "24 citas",
    commission: "15%",
  },
  {
    id: "sergio-lara",
    name: "Sergio Lara",
    role: "Recepcion",
    phone: "999 333 444",
    email: "sergio@sg.local",
    status: "Invitado",
    specialties: ["Caja", "Atencion"],
    weeklyLoad: "Cobertura completa",
    commission: "N/A",
  },
];

type EmployeeDraft = Omit<EmployeeRecord, "id" | "specialties"> & {
  specialties: string;
};

const emptyDraft: EmployeeDraft = {
  name: "",
  role: "",
  phone: "",
  email: "",
  status: "Activo",
  specialties: "",
  weeklyLoad: "",
  commission: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function EmployeesManagement() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedId, setSelectedId] = useState(initialEmployees[0]?.id ?? "");
  const [draft, setDraft] = useState<EmployeeDraft>({
    ...emptyDraft,
    ...toDraft(initialEmployees[0]),
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesQuery =
        employee.name.toLowerCase().includes(query.toLowerCase()) ||
        employee.role.toLowerCase().includes(query.toLowerCase()) ||
        employee.specialties.some((specialty) => specialty.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = statusFilter === "Todos" || employee.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [employees, query, statusFilter]);

  const handleSelect = (employee: EmployeeRecord) => {
    setSelectedId(employee.id);
    setDraft(toDraft(employee));
  };

  const handleSave = () => {
    const specialties = draft.specialties
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!draft.name || !draft.role) {
      return;
    }

    if (!selectedId) {
      const nextEmployee: EmployeeRecord = {
        id: slugify(draft.name),
        ...draft,
        specialties,
      };

      setEmployees((current) => [nextEmployee, ...current]);
      setSelectedId(nextEmployee.id);
      setDraft(toDraft(nextEmployee));
      return;
    }

    setEmployees((current) =>
      current.map((employee) =>
        employee.id === selectedId
          ? {
              ...employee,
              ...draft,
              specialties,
            }
          : employee,
      ),
    );
  };

  const selectedEmployee = employees.find((employee) => employee.id === selectedId);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Tu equipo</p>
              <p className="mt-1 text-sm text-zinc-600">
                Busca personas del equipo y actualiza sus datos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedId("");
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
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option>Todos</option>
                <option>Activo</option>
                <option>Vacaciones</option>
                <option>Invitado</option>
              </select>
            </label>
          </div>
        </div>

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
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  employee.status === "Activo"
                    ? "bg-emerald-100 text-emerald-900"
                    : employee.status === "Vacaciones"
                      ? "bg-sky-100 text-sky-900"
                      : "bg-amber-100 text-amber-900"
                }`}>
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
                  {employee.weeklyLoad}
                </p>
                <p className="flex items-center gap-2">
                  <Star size={15} />
                  Comision {employee.commission}
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
            <Field label="Nombre completo">
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
                placeholder="Nombre del empleado"
              />
            </Field>
            <Field label="Rol">
              <input
                value={draft.role}
                onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
                className={inputClassName}
                placeholder="Barber, recepcion, manager..."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Telefono">
                <input
                  value={draft.phone}
                  onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  className={inputClassName}
                  placeholder="999 999 999"
                />
              </Field>
              <Field label="Estado">
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as EmployeeDraft["status"],
                    }))
                  }
                  className={inputClassName}
                >
                  <option>Activo</option>
                  <option>Vacaciones</option>
                  <option>Invitado</option>
                </select>
              </Field>
            </div>
            <Field label="Email">
              <input
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Carga semanal">
                <input
                  value={draft.weeklyLoad}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, weeklyLoad: event.target.value }))
                  }
                  className={inputClassName}
                  placeholder="28 citas"
                />
              </Field>
              <Field label="Comision">
                <input
                  value={draft.commission}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, commission: event.target.value }))
                  }
                  className={inputClassName}
                  placeholder="15%"
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
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
        onConfirm={() => {
          handleSave();
          setIsConfirmOpen(false);
        }}
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

function toDraft(employee?: EmployeeRecord): EmployeeDraft {
  if (!employee) {
    return emptyDraft;
  }

  return {
    name: employee.name,
    role: employee.role,
    phone: employee.phone,
    email: employee.email,
    status: employee.status,
    specialties: employee.specialties.join(", "),
    weeklyLoad: employee.weeklyLoad,
    commission: employee.commission,
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}
