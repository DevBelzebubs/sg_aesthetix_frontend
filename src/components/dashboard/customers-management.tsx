"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Calendar, KeyRound, PencilLine, Phone, Search, Trash2, Undo2, UserRound, Users, X } from "lucide-react";
import { validateRequired, validateEmailOptional, validatePhoneOptional, validateDniOptional } from "@/lib/validators";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { CustomersService } from "@/services/customers.service";
import { createClient } from "@/lib/supabase/client";
import { hashPin } from "@/lib/pin";
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
  pin: string;
  pinConfirm: string;
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
  pin: "",
  pinConfirm: "",
};

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [pinResetTarget, setPinResetTarget] = useState<CustomerRecord | null>(null);
  const [resettingPin, setResettingPin] = useState(false);
  const [resetPinValue, setResetPinValue] = useState("");
  const [resetPinConfirm, setResetPinConfirm] = useState("");
  const [resetPinError, setResetPinError] = useState("");

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
            pin: "",
            pinConfirm: "",
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
            pin: "",
            pinConfirm: "",
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
    const errors: Record<string, string> = {};
    const errNombres = validateRequired(draft.nombres, "Nombres");
    if (errNombres) errors.nombres = errNombres;
    const errApellidos = validateRequired(draft.apellidos, "Apellidos");
    if (errApellidos) errors.apellidos = errApellidos;
    const errPhone = validatePhoneOptional(draft.phone);
    if (errPhone) errors.phone = errPhone;
    const errEmail = validateEmailOptional(draft.email);
    if (errEmail) errors.email = errEmail;
    const errDni = validateDniOptional(draft.dni);
    if (errDni) errors.dni = errDni;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (!selectedId) return;
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

      if (draft.pin.length === 6 && draft.pin === draft.pinConfirm) {
        const { hash, salt } = await hashPin(draft.pin);
        await CustomersService.updatePin(selectedId, hash, salt);
      }

      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...draft, pin: "", pinConfirm: "", name: `${draft.nombres} ${draft.apellidos}`.trim() } : c)),
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

  useEffect(() => {
    if (pinResetTarget) {
      setResetPinValue("");
      setResetPinConfirm("");
      setResetPinError("");
    }
  }, [pinResetTarget]);

  const handleResetPin = async () => {
    if (!pinResetTarget) return;
    setResetPinError("");
    if (!resetPinValue || resetPinValue.length !== 6) {
      setResetPinError("El PIN debe tener exactamente 6 dígitos");
      return;
    }
    if (resetPinValue !== resetPinConfirm) {
      setResetPinError("Los PIN no coinciden");
      return;
    }
    setResettingPin(true);
    try {
      const { hash, salt } = await hashPin(resetPinValue);
      await CustomersService.updatePin(pinResetTarget.id, hash, salt);
    } catch { /* error silencioso */ }
    setResettingPin(false);
    setPinResetTarget(null);
    setResetPinValue("");
    setResetPinConfirm("");
    setResetPinError("");
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
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-4 py-2 text-sm font-semibold text-[var(--destructive)] transition ${
                showInactive
                  ? "bg-[var(--destructive-hover)]"
                  : "hover:bg-[var(--destructive-hover)]"
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
              autoComplete="off"
            />
          </label>
        )}
      </div>

      {/* Listado */}
      {mode === "list" && !showInactive && (
        <>
          {paginatedCustomers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <UserRound size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron clientes con esos filtros." : "No hay clientes registrados."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)]">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nombre</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Teléfono</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Correo</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">DNI</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nacimiento</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedCustomers.map((customer, i) => (
                      <tr key={customer.id} className="transition hover:bg-[var(--background)]">
                        <td className="px-6 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">{customer.nombres} {customer.apellidos}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] whitespace-nowrap">{customer.phone || "—"}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] truncate max-w-[180px]">{customer.email || "—"}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] tabular-nums whitespace-nowrap">{customer.dni || "—"}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] whitespace-nowrap">
                          {customer.fechaNacimiento ? new Date(customer.fechaNacimiento).toLocaleDateString("es-PE") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(customer)}
                              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                              title="Editar"
                            >
                              <PencilLine size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setPinResetTarget(customer); setResetPinValue(""); setResetPinConfirm(""); setResetPinError(""); }}
                              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-amber-500"
                              title="Resetear PIN"
                            >
                              <KeyRound size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelectedId(customer.id); setIsDeleteConfirmOpen(true); }}
                              className="rounded-lg p-2 text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
                              title="Desactivar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Papelera */}
      {mode === "list" && showInactive && (
        <>
          {paginatedInactive.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <Trash2 size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron clientes con esos filtros." : "No hay clientes en la papelera."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[var(--destructive-border)] bg-[var(--background-secondary)]">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nombre</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Teléfono</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Correo</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">DNI</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedInactive.map((customer, i) => (
                      <tr key={customer.id} className="transition hover:bg-[var(--destructive-hover)]">
                        <td className="px-6 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">{customer.nombres} {customer.apellidos}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] whitespace-nowrap">{customer.phone || "—"}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] truncate max-w-[180px]">{customer.email || "—"}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] tabular-nums whitespace-nowrap">{customer.dni || "—"}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleRestore(customer.id)}
                            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--hover)]/10 hover:text-[var(--hover)]"
                            title="Restaurar"
                          >
                            <Undo2 size={15} />
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
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
            <Field label="Nombres" required error={fieldErrors.nombres}>
              <input
                className={inputClassName}
                value={draft.nombres}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, nombres: event.target.value }));
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.nombres; return next; });
                }}
                placeholder="Nombres"
              />
            </Field>
            <Field label="Apellidos" error={fieldErrors.apellidos}>
              <input
                className={inputClassName}
                value={draft.apellidos}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, apellidos: event.target.value }));
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.apellidos; return next; });
                }}
                placeholder="Apellidos"
              />
            </Field>
            <Field label="Telefono" error={fieldErrors.phone}>
              <input
                className={inputClassName}
                value={draft.phone}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, phone: event.target.value }));
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.phone; return next; });
                }}
                placeholder="999 999 999"
              />
            </Field>
            <Field label="Email" error={fieldErrors.email}>
              <input
                className={inputClassName}
                value={draft.email}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, email: event.target.value }));
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; });
                }}
                placeholder="correo@ejemplo.com"
              />
            </Field>
            <Field label="DNI" error={fieldErrors.dni}>
              <input
                className={inputClassName}
                value={draft.dni}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, dni: event.target.value }));
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.dni; return next; });
                }}
                placeholder="12345678"
              />
            </Field>
            <Field label="Fecha de nacimiento" error={fieldErrors.fechaNacimiento}>
              <input
                type="date"
                className={inputClassName}
                value={draft.fechaNacimiento ? draft.fechaNacimiento.slice(0, 10) : ""}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, fechaNacimiento: event.target.value }));
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.fechaNacimiento; return next; });
                }}
              />
            </Field>
            <Field label="Nuevo PIN (dejar vacío para no cambiar)">
              <input
                type="password"
                className={inputClassName}
                value={draft.pin}
                onChange={(event) => setDraft((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder="6 dígitos"
                inputMode="numeric"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar PIN">
              <input
                type="password"
                className={inputClassName}
                value={draft.pinConfirm}
                onChange={(event) => setDraft((current) => ({ ...current, pinConfirm: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder="Repetir PIN"
                inputMode="numeric"
                autoComplete="new-password"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={Object.keys(fieldErrors).length > 0 || saving}
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

      {pinResetTarget !== null && (
        <div key={pinResetTarget.id} className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] px-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-xl">
            <div className="mb-4">
              <p className="text-lg font-semibold text-[var(--foreground)]">Resetear PIN</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Nuevo PIN para {pinResetTarget.nombres} {pinResetTarget.apellidos}
              </p>
            </div>
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Nuevo PIN</span>
                <input
                  type="password"
                  className={inputClassName}
                  value={resetPinValue}
                  onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 dígitos"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Confirmar PIN</span>
                <input
                  type="password"
                  className={inputClassName}
                  value={resetPinConfirm}
                  onChange={(e) => setResetPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Repetir PIN"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="new-password"
                />
              </label>
              {resetPinError && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
                  <AlertCircle size={12} />
                  {resetPinError}
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setPinResetTarget(null); setResetPinValue(""); setResetPinConfirm(""); setResetPinError(""); }}
                className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetPin}
                disabled={resettingPin}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
              >
                <KeyRound size={16} />
                {resettingPin ? "Reseteando..." : "Resetear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-[var(--destructive)]">*</span>}
      </span>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </label>
  );
}
