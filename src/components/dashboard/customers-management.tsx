"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PencilLine, Phone, Search, Trash2, UserRound, Users, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
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
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  totalClientes: number;
  nuevosEsteMes: number;
  conTelefono: number;
};

export function CustomersManagement({ totalClientes, nuevosEsteMes, conTelefono }: Props) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerRecord>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const pageSize = 10;
  const [page, setPage] = useState(1);

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
        customer.email.toLowerCase().includes(text) ||
        customer.dni.toLowerCase().includes(text)
      );
    });
  }, [customers, query]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  const selectedCustomer = customers.find((customer) => customer.id === selectedId);

  const handleEdit = (customer: CustomerRecord) => {
    setSelectedId(customer.id);
    setDraft(customer);
    setMode("edit");
  };

  const handleBack = () => {
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
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
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
    } catch {
      /* error silencioso */
    } finally {
      setSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await CustomersService.delete(selectedId);
      const next = customers.filter((c) => c.id !== selectedId);
      setCustomers(next);
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
    } catch {
      /* error silencioso */
    }
    setIsDeleteConfirmOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <>
      {/* KPI — solo en listado */}
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total clientes</p>
            <div className="mt-2 flex items-center gap-2">
              <Users size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalClientes}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nuevos este mes</p>
            <div className="mt-2 flex items-center gap-2">
              <UserRound size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{nuevosEsteMes}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Con telefono</p>
            <div className="mt-2 flex items-center gap-2">
              <Phone size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{conTelefono}</p>
            </div>
          </article>
        </div>
      )}

      {/* Barra de busqueda */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Clientes registrados</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {customers.length} cliente(s) en el sistema
            </p>
          </div>
          {mode === "edit" && (
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
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Buscar por nombre, telefono, DNI o email"
            />
          </label>
        )}
      </div>

      {/* Listado */}
      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedCustomers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <UserRound size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron clientes con esos filtros." : "No hay clientes registrados."}
              </p>
            </div>
          ) : (
            paginatedCustomers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                    <UserRound size={20} />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-base font-semibold text-[var(--foreground)]">{customer.name}</p>
                </div>

                <div className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                  {customer.phone && <p>{customer.phone}</p>}
                  {customer.email && <p className="truncate">{customer.email}</p>}
                  {customer.dni && <p className="text-xs">DNI: {customer.dni}</p>}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(customer)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
                  >
                    <PencilLine size={14} />
                    Editar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        {/* <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> */}
        </>
      )}

      {/* Formulario editar */}
      {mode === "edit" && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3">
              <UserRound size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">Editar cliente</p>
              <p className="text-sm text-[var(--text-muted)]">
                {selectedCustomer ? `Editando a ${selectedCustomer.name}` : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre completo" required>
              <input
                className={inputClassName}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombres y apellidos"
              />
            </Field>
            <Field label="Telefono">
              <input
                className={inputClassName}
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                placeholder="999 999 999"
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClassName}
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </Field>
            <Field label="DNI">
              <input
                className={inputClassName}
                value={draft.dni}
                onChange={(event) => setDraft((current) => ({ ...current, dni: event.target.value }))}
                placeholder="12345678"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!draft.name || saving}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              <PencilLine size={16} />
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
            >
              <Trash2 size={16} />
              Eliminar cliente
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
        title="Confirmar cambios"
        description="Se guardaran los cambios hechos en los datos del cliente."
        confirmLabel={saving ? "Guardando..." : "Si, guardar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />

      <ConfirmationModal
        open={isDeleteConfirmOpen}
        title="Confirmar eliminacion"
        description="Este cliente se eliminara del sistema."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
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
