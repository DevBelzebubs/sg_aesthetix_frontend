"use client";

import { useMemo, useState } from "react";
import { Clock3, DollarSign, Plus, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

type ServiceStatus = "Activo" | "Borrador" | "Oculto";

type ServiceRecord = {
  id: string;
  name: string;
  type: string;
  duration: number;
  price: number;
  status: ServiceStatus;
  assignedTo: string[];
  description: string;
};

const initialServices: ServiceRecord[] = [
  {
    id: "corte-clasico",
    name: "Corte clasico",
    type: "CLASSIC",
    duration: 45,
    price: 18,
    status: "Activo",
    assignedTo: ["Alejandro Ruiz", "Matias Soto"],
    description: "Servicio base con lavado ligero y acabado.",
  },
  {
    id: "corte-barba",
    name: "Corte + barba",
    type: "COMBO",
    duration: 60,
    price: 25,
    status: "Activo",
    assignedTo: ["Alejandro Ruiz"],
    description: "Combo premium con perfilado completo y acabado.",
  },
  {
    id: "kids-cut",
    name: "Kids cut",
    type: "KIDS",
    duration: 30,
    price: 14,
    status: "Borrador",
    assignedTo: ["Matias Soto"],
    description: "Servicio agil para ninos con tiempo reducido.",
  },
];

type ServiceDraft = Omit<ServiceRecord, "id" | "assignedTo"> & {
  assignedTo: string;
};

const emptyDraft: ServiceDraft = {
  name: "",
  type: "STANDARD",
  duration: 45,
  price: 0,
  status: "Activo",
  assignedTo: "",
  description: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function ServicesManagement() {
  const [services, setServices] = useState(initialServices);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialServices[0]?.id ?? "");
  const [draft, setDraft] = useState<ServiceDraft>({
    ...emptyDraft,
    ...toDraft(initialServices[0]),
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        service.type.toLowerCase().includes(query.toLowerCase()) ||
        service.description.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [query, services]);

  const selectedService = services.find((service) => service.id === selectedId);

  const saveService = () => {
    if (!draft.name) {
      return;
    }

    const nextRecord: ServiceRecord = {
      id: selectedId || slugify(draft.name),
      ...draft,
      assignedTo: draft.assignedTo
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (selectedId) {
      setServices((current) =>
        current.map((service) => (service.id === selectedId ? nextRecord : service)),
      );
      return;
    }

    setServices((current) => [nextRecord, ...current]);
    setSelectedId(nextRecord.id);
    setDraft(toDraft(nextRecord));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Catalogo de servicios</p>
              <p className="mt-1 text-sm text-zinc-600">
                Ordena tus servicios, cambia precios y elige quien los atiende.
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
              Nuevo servicio
            </button>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por nombre o descripcion"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Duracion</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Asignados</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr
                  key={service.id}
                  className={`cursor-pointer border-t border-zinc-100 transition hover:bg-zinc-50 ${
                    selectedId === service.id ? "bg-zinc-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedId(service.id);
                    setDraft(toDraft(service));
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900">{service.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {service.type}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{service.duration} min</td>
                  <td className="px-4 py-3 text-zinc-700">${service.price}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {service.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{service.assignedTo.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            {selectedId ? "Editar servicio" : "Crear servicio"}
          </p>
          <div className="mt-4 grid gap-3">
            <Field label="Nombre">
              <input
                className={inputClassName}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombre comercial"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">
                <select
                  className={inputClassName}
                  value={draft.type}
                  onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                >
                  <option>STANDARD</option>
                  <option>PREMIUM</option>
                  <option>CLASSIC</option>
                  <option>COMBO</option>
                  <option>KIDS</option>
                </select>
              </Field>
              <Field label="Estado">
                <select
                  className={inputClassName}
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as ServiceStatus,
                    }))
                  }
                >
                  <option>Activo</option>
                  <option>Borrador</option>
                  <option>Oculto</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Duracion">
                <input
                  type="number"
                  className={inputClassName}
                  value={draft.duration}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      duration: Number(event.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Precio">
                <input
                  type="number"
                  className={inputClassName}
                  value={draft.price}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      price: Number(event.target.value),
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Asignado a">
              <input
                className={inputClassName}
                value={draft.assignedTo}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, assignedTo: event.target.value }))
                }
                placeholder="Alejandro Ruiz, Matias Soto"
              />
            </Field>
            <Field label="Descripcion">
              <textarea
                className={`${inputClassName} min-h-28 resize-none`}
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Describe el servicio y que incluye"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {selectedId ? "Guardar servicio" : "Crear servicio"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(selectedService ? toDraft(selectedService) : emptyDraft)}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Restablecer
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Datos del servicio</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p className="flex items-center gap-2">
              <Clock3 size={15} />
              Tiempo aproximado del servicio
            </p>
            <p className="flex items-center gap-2">
              <DollarSign size={15} />
              Precio base del servicio
            </p>
            <p className="flex items-center gap-2">
              <Sparkles size={15} />
              Descripcion para mostrar al cliente
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck size={15} />
              Si esta visible o no
            </p>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo servicio"}
        description={
          selectedId
            ? "Se guardaran los cambios hechos en este servicio."
            : "Se creara un nuevo servicio con los datos que llenaste."
        }
        confirmLabel={selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          saveService();
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

function toDraft(service?: ServiceRecord): ServiceDraft {
  if (!service) {
    return emptyDraft;
  }

  return {
    name: service.name,
    type: service.type,
    duration: service.duration,
    price: service.price,
    status: service.status,
    assignedTo: service.assignedTo.join(", "),
    description: service.description,
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}
