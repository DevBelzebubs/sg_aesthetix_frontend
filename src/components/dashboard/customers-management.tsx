"use client";

import { useMemo, useState } from "react";
import { PencilLine, Search, Trash2, UserRound } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  lastVisit: string;
  notes: string;
};

const initialCustomers: CustomerRecord[] = [
  {
    id: "carlos-mendez",
    name: "Carlos Mendez",
    phone: "999 888 111",
    email: "carlos@email.com",
    visits: 12,
    lastVisit: "2026-04-02",
    notes: "Prefiere corte clasico y horario de tarde.",
  },
  {
    id: "andres-torres",
    name: "Andres Torres",
    phone: "999 777 222",
    email: "andres@email.com",
    visits: 7,
    lastVisit: "2026-03-29",
    notes: "Cliente frecuente de barba premium.",
  },
  {
    id: "julian-rojas",
    name: "Julian Rojas",
    phone: "999 666 333",
    email: "julian@email.com",
    visits: 4,
    lastVisit: "2026-03-20",
    notes: "Suele reservar desde la web por la manana.",
  },
];

const emptyDraft: CustomerRecord = {
  id: "",
  name: "",
  phone: "",
  email: "",
  visits: 0,
  lastVisit: "",
  notes: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function CustomersManagement() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialCustomers[0]?.id ?? "");
  const [draft, setDraft] = useState(initialCustomers[0] ?? emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const text = query.toLowerCase();

      return (
        customer.name.toLowerCase().includes(text) ||
        customer.phone.toLowerCase().includes(text) ||
        customer.email.toLowerCase().includes(text)
      );
    });
  }, [customers, query]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedId);

  const handleSelect = (customer: CustomerRecord) => {
    setSelectedId(customer.id);
    setDraft(customer);
  };

  const handleSave = () => {
    if (!selectedId || !draft.name) {
      return;
    }

    setCustomers((current) =>
      current.map((customer) => (customer.id === selectedId ? { ...draft, id: selectedId } : customer)),
    );
  };

  const handleDelete = () => {
    if (!selectedId) {
      return;
    }

    const nextCustomers = customers.filter((customer) => customer.id !== selectedId);
    setCustomers(nextCustomers);

    if (nextCustomers.length === 0) {
      setSelectedId("");
      setDraft(emptyDraft);
      return;
    }

    setSelectedId(nextCustomers[0].id);
    setDraft(nextCustomers[0]);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.18fr_0.92fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Clientes registrados</p>
          <p className="mt-1 text-sm text-zinc-600">
            Tus clientes se registran solos. Aqui solo los buscas, editas o eliminas.
          </p>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por nombre, telefono o email"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Visitas</th>
                <th className="px-4 py-3">Ultima visita</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className={`cursor-pointer border-t border-zinc-100 transition hover:bg-zinc-50 ${
                    selectedId === customer.id ? "bg-sky-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900">{customer.name}</p>
                    <p className="text-xs text-zinc-500">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{customer.phone}</td>
                  <td className="px-4 py-3 text-zinc-700">{customer.visits}</td>
                  <td className="px-4 py-3 text-zinc-700">{customer.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-fuchsia-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-fuchsia-100 p-3">
              <UserRound size={18} className="text-zinc-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Editar cliente</p>
              <p className="text-sm text-zinc-600">Corrige datos cuando haga falta.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <Field label="Nombre">
              <input
                className={inputClassName}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                disabled={!selectedCustomer}
              />
            </Field>
            <Field label="Telefono">
              <input
                className={inputClassName}
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                disabled={!selectedCustomer}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClassName}
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                disabled={!selectedCustomer}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Visitas">
                <input
                  type="number"
                  className={inputClassName}
                  value={draft.visits}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, visits: Number(event.target.value) }))
                  }
                  disabled={!selectedCustomer}
                />
              </Field>
              <Field label="Ultima visita">
                <input
                  type="date"
                  className={inputClassName}
                  value={draft.lastVisit}
                  onChange={(event) => setDraft((current) => ({ ...current, lastVisit: event.target.value }))}
                  disabled={!selectedCustomer}
                />
              </Field>
            </div>
            <Field label="Notas internas">
              <textarea
                className={`${inputClassName} min-h-28 resize-none`}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                disabled={!selectedCustomer}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!selectedCustomer}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PencilLine size={16} />
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={!selectedCustomer}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Borrar cliente
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Proximo paso</p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600">
            <li>Traer la lista real de clientes</li>
            <li>Guardar cambios hechos desde esta vista</li>
            <li>Eliminar o desactivar clientes segun la regla del negocio</li>
          </ul>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar cambios"
        description="Se guardaran los cambios hechos en los datos del cliente."
        confirmLabel="Si, guardar"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          handleSave();
          setIsConfirmOpen(false);
        }}
      />

      <ConfirmationModal
        open={isDeleteConfirmOpen}
        title="Confirmar eliminacion"
        description="Este cliente se eliminara de la lista actual."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteConfirmOpen(false);
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
