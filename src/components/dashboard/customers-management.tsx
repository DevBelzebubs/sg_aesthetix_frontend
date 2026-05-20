"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilLine, Search, Trash2, UserRound } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { CustomersService } from "@/services/customers.service";
import type { Customer } from "@/types/customer";

type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  dni: string;
};

const emptyDraft: CustomerRecord = {
  id: "",
  name: "",
  phone: "",
  email: "",
  dni: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function CustomersManagement() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<CustomerRecord>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CustomersService.getAll()
      .then((data) => {
        setCustomers(
          data.map((c) => ({
            id: c.id,
            name: `${c.nombres} ${c.apellidos ?? ""}`.trim(),
            phone: c.telefono ?? "",
            email: c.correoElectronico ?? "",
            dni: c.dni ?? "",
          })),
        );
        if (data.length > 0) {
          const first = data[0];
          setSelectedId(first.id);
          setDraft({
            id: first.id,
            name: `${first.nombres} ${first.apellidos ?? ""}`.trim(),
            phone: first.telefono ?? "",
            email: first.correoElectronico ?? "",
            dni: first.dni ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const handleSave = async () => {
    if (!selectedId || !draft.name) return;
    setSaving(true);
    try {
      const nameParts = draft.name.trim().split(/\s+/);
      const nombres = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
      const apellidos = nameParts.slice(-1).join("") || "";
      await CustomersService.update(selectedId, {
        nombres,
        apellidos: apellidos || undefined,
        telefono: draft.phone || undefined,
        correoElectronico: draft.email || undefined,
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...draft } : c)),
      );
      setIsConfirmOpen(false);
    } catch {
      /* error silencioso */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await CustomersService.delete(selectedId);
      const next = customers.filter((c) => c.id !== selectedId);
      setCustomers(next);
      if (next.length > 0) {
        setSelectedId(next[0].id);
        setDraft(next[0]);
      } else {
        setSelectedId("");
        setDraft(emptyDraft);
      }
      setIsDeleteConfirmOpen(false);
    } catch {
      /* error silencioso */
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-zinc-300" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.18fr_0.92fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Clientes registrados</p>
          <p className="mt-1 text-sm text-zinc-600">
            {customers.length} cliente(s) registrados en el sistema.
          </p>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por nombre, teléfono o email"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    className={`cursor-pointer border-t border-zinc-100 transition hover:bg-zinc-50 ${
                      selectedId === customer.id ? "bg-sky-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900">{customer.name}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{customer.phone || "—"}</td>
                    <td className="px-4 py-3 text-zinc-700">{customer.dni || "—"}</td>
                    <td className="px-4 py-3 text-zinc-700">{customer.email || "—"}</td>
                  </tr>
                ))
              )}
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
            <Field label="Nombre completo">
              <input
                className={inputClassName}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                disabled={!selectedCustomer}
              />
            </Field>
            <Field label="Teléfono">
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
            <Field label="DNI">
              <input
                className={inputClassName}
                value={draft.dni}
                onChange={(event) => setDraft((current) => ({ ...current, dni: event.target.value }))}
                disabled={!selectedCustomer}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!selectedCustomer || saving}
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
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar cambios"
        description="Se guardarán los cambios hechos en los datos del cliente."
        confirmLabel={saving ? "Guardando..." : "Sí, guardar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />

      <ConfirmationModal
        open={isDeleteConfirmOpen}
        title="Confirmar eliminación"
        description="Este cliente se eliminará del sistema."
        confirmLabel="Sí, eliminar"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
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
