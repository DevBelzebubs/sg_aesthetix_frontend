"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, PencilLine, Phone, Search, Trash2, Undo2, UserRound, Users, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { CustomersService } from "@/services/customers.service";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types/customer";

type CustomerRecord = {
  id: string;
  name: string;
  nombres: string;
  apellidos: string;
  phone: string;
  email: string;
  dni: string;
  fechaNacimiento: string;
  estaActivo: boolean;
};

const emptyDraft: CustomerRecord = {
  id: "",
  name: "",
  nombres: "",
  apellidos: "",
  phone: "",
  email: "",
  dni: "",
  fechaNacimiento: "",
  estaActivo: true,
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  totalClientes: number;
  nuevosEsteMes: number;
  conTelefono: number;
};

export function CustomersManagement({ totalClientes, nuevosEsteMes, conTelefono }: Props) {
  const supabase = createClient();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
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
            nombres: c.nombres,
            apellidos: c.apellidos ?? "",
            phone: c.telefono ?? "",
            email: c.correoElectronico ?? "",
            dni: c.dni ?? "",
            fechaNacimiento: c.fechaNacimiento ?? "",
            estaActivo: c.estaActivo,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showInactive) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .eq("esta_activo", false)
        .order("creado_en", { ascending: false });
      if (data) {
        setInactiveCustomers(
          data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: `${c.nombres as string} ${(c.apellidos as string) ?? ""}`.trim(),
            nombres: c.nombres as string,
            apellidos: (c.apellidos as string) ?? "",
            phone: (c.telefono as string) ?? "",
            email: (c.correo_electronico as string) ?? "",
            dni: (c.dni as string) ?? "",
            fechaNacimiento: (c.fecha_nacimiento as string) ?? "",
            estaActivo: false,
          })),
        );
      }
      setLoading(false);
    })();
  }, [showInactive]);

  const handleRestore = async (id: string) => {
    await supabase.from("clientes").update({ esta_activo: true }).eq("id", id);
    setInactiveCustomers((prev) => prev.filter((c) => c.id !== id));
  };

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

  const filteredInactive = useMemo(() => {
    return inactiveCustomers.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase()) ||
      c.dni.toLowerCase().includes(query.toLowerCase())
    );
  }, [inactiveCustomers, query]);
  const totalPagesInactive = Math.ceil(filteredInactive.length / pageSize);
  const paginatedInactive = filteredInactive.slice((page - 1) * pageSize, page * pageSize);

  const selectedCustomer = showInactive
    ? inactiveCustomers.find((c) => c.id === selectedId)
    : customers.find((customer) => customer.id === selectedId);

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
    if (!selectedId || !draft.nombres) return;
    setSaving(true);
    try {
      await CustomersService.update(selectedId, {
        nombres: draft.nombres,
        apellidos: draft.apellidos || undefined,
        telefono: draft.phone || undefined,
        correoElectronico: draft.email || undefined,
        dni: draft.dni || undefined,
        fechaNacimiento: draft.fechaNacimiento || undefined,
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...draft, name: `${draft.nombres} ${draft.apellidos}`.trim() } : c)),
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
      await CustomersService.remove(selectedId);
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
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {showInactive ? "Clientes desactivados" : "Clientes registrados"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {showInactive
                ? `${inactiveCustomers.length} cliente(s) en papelera`
                : `${customers.length} cliente(s) en el sistema`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowInactive((v) => !v); setQuery(""); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                showInactive
                  ? "border-[var(--destructive-border)] bg-[var(--destructive-hover)] text-[var(--destructive)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              }`}
            >
              <Trash2 size={16} />
              Papelera
            </button>
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
      {mode === "list" && !showInactive && (
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
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--background)]">
                    <UserRound size={28} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-base font-semibold text-[var(--foreground)]">{customer.nombres} {customer.apellidos}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        customer.estaActivo
                          ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                          : "bg-[var(--warning)]/15 text-[var(--warning)]"
                      }`}>
                        {customer.estaActivo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {customer.email && (
                        <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          {customer.email}
                        </span>
                      )}
                      {customer.fechaNacimiento && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          <Calendar size={10} />
                          {new Date(customer.fechaNacimiento).toLocaleDateString("es-PE")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {customer.dni && (
                        <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          DNI: {customer.dni}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hover)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--hover)]">
                          <Phone size={10} />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Papelera */}
      {mode === "list" && showInactive && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedInactive.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <Trash2 size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron clientes con esos filtros." : "No hay clientes en la papelera."}
              </p>
            </div>
          ) : (
            paginatedInactive.map((customer) => (
              <article
                key={customer.id}
                className="rounded-3xl border border-[var(--warning)]/20 bg-[var(--background-secondary)] p-6 shadow-sm"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--warning)]/10">
                    <UserRound size={28} className="text-[var(--warning)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-base font-semibold text-[var(--foreground)]">{customer.nombres} {customer.apellidos}</p>
                      <span className="shrink-0 rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)]">
                        Inactivo
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {customer.email && (
                        <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          {customer.email}
                        </span>
                      )}
                      {customer.fechaNacimiento && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          <Calendar size={10} />
                          {new Date(customer.fechaNacimiento).toLocaleDateString("es-PE")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {customer.dni && (
                        <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          DNI: {customer.dni}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hover)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--hover)]">
                          <Phone size={10} />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleRestore(customer.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--hover)] py-2 text-sm font-semibold text-[var(--hover)] transition hover:bg-[var(--hover)]/10"
                  >
                    <Undo2 size={14} />
                    Restaurar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <Pagination page={page} totalPages={totalPagesInactive} onPageChange={setPage} />
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
            <Field label="Nombres" required>
              <input
                className={inputClassName}
                value={draft.nombres}
                onChange={(event) => setDraft((current) => ({ ...current, nombres: event.target.value }))}
                placeholder="Nombres"
              />
            </Field>
            <Field label="Apellidos">
              <input
                className={inputClassName}
                value={draft.apellidos}
                onChange={(event) => setDraft((current) => ({ ...current, apellidos: event.target.value }))}
                placeholder="Apellidos"
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
            <Field label="Fecha de nacimiento">
              <input
                type="date"
                className={inputClassName}
                value={draft.fechaNacimiento ? draft.fechaNacimiento.slice(0, 10) : ""}
                onChange={(event) => setDraft((current) => ({ ...current, fechaNacimiento: event.target.value }))}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!draft.nombres || saving}
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
              Desactivar cliente
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
        description="El cliente se desactivara. No perdera sus datos ni historial."
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
