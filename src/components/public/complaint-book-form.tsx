"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Toast } from "@/components/dashboard/toast";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { validateRequired, validateEmail, validatePhoneOptional, validateMinLength, validatePositiveNumber, validateName } from "@/lib/validators";

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";
const selectClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

type Props = {
  slug: string;
};

export function ComplaintBookForm({ slug }: Props) {
  const [tipo, setTipo] = useState<"queja" | "reclamo">("reclamo");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [bienContratado, setBienContratado] = useState("");
  const [montoReclamado, setMontoReclamado] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pedidoConsumidor, setPedidoConsumidor] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const nombresErr = validateName(nombres, "El nombre");
    const apellidosErr = validateName(apellidos, "El apellido");
    const emailErr = validateEmail(email);
    const telErr = validatePhoneOptional(telefono);
    const domErr = domicilio ? validateMinLength(domicilio, 5, "El domicilio") : null;
    const montoErr = montoReclamado ? validatePositiveNumber(Number(montoReclamado), "El monto reclamado") : null;
    const descErr = validateMinLength(descripcion, 10, "La descripción");
    const bienErr = bienContratado ? validateRequired(bienContratado, "El bien contratado") : null;
    const pedidoErr = pedidoConsumidor ? validateRequired(pedidoConsumidor, "El pedido del consumidor") : null;
    if (nombresErr) errors.nombres = nombresErr;
    if (apellidosErr) errors.apellidos = apellidosErr;
    if (emailErr) errors.email = emailErr;
    if (telErr) errors.telefono = telErr;
    if (domErr) errors.domicilio = domErr;
    if (montoErr) errors.monto = montoErr;
    if (descErr) errors.descripcion = descErr;
    if (bienErr) errors.bienContratado = bienErr;
    if (pedidoErr) errors.pedidoConsumidor = pedidoErr;
    return errors;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/libro-reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: slug,
          tipo,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          domicilio: domicilio.trim() || undefined,
          telefono: telefono.trim() || undefined,
          email: email.trim(),
          bienContratado: bienContratado.trim() || undefined,
          montoReclamado: montoReclamado ? Number(montoReclamado) : undefined,
          descripcion: descripcion.trim(),
          pedidoConsumidor: pedidoConsumidor.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToastType("error");
        setToastMessage(data.error || "Error al enviar el reclamo.");
        setToastOpen(true);
        return;
      }

      setToastType("success");
      setToastMessage(`${tipo === "reclamo" ? "Reclamo" : "Queja"} registrado con éxito. N° ${data.numeroReclamo}`);
      setToastOpen(true);
      setSuccess(data.numeroReclamo);
    } catch {
      setToastType("error");
      setToastMessage("Error de conexión. Intente nuevamente.");
      setToastOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--hover)]/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36" className="text-[var(--hover)]">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {tipo === "reclamo" ? "Reclamo" : "Queja"} registrada
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Su número de reclamo es:
          </p>
          <p className="mt-1 text-2xl font-bold tracking-wider text-[var(--foreground)]">
            {success}
          </p>
          <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background)] px-5 py-4 text-left text-sm leading-relaxed text-[var(--text-muted)]">
            <p>
              Se ha enviado una copia a <strong className="text-[var(--foreground)]">{email}</strong>.
              Revisa tu bandeja de entrada.
            </p>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Recibirá respuesta en un plazo máximo de 15 días hábiles (Ley N° 29571).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hover)]/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" className="text-[var(--hover)]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Libro de Reclamaciones</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Ley N° 29571 — Código de Protección y Defensa del Consumidor
        </p>
      </div>

      <form
        onSubmit={handleSubmitClick}
        className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--hover)]/15 bg-[var(--hover)]/[0.04] px-5 py-3.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="shrink-0 text-[var(--hover)]">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Los campos marcados con <span className="text-[var(--destructive)]">*</span> son obligatorios. Recibirá una copia de este reclamo en su correo electrónico.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-5 py-3.5 text-sm text-[var(--destructive)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Tipo <span className="text-[var(--destructive)]">*</span>
              </span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "queja" | "reclamo")}
                className={selectClass}
              >
                <option value="reclamo">Reclamo</option>
                <option value="queja">Queja</option>
              </select>
            </label>
          </div>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Nombres <span className="text-[var(--destructive)]">*</span>
            </span>
            <input
              className={fieldClass}
              value={nombres}
              onChange={(e) => {
                setNombres(e.target.value);
                setFieldErrors((prev) => ({ ...prev, nombres: "" }));
              }}
              placeholder="Ej: Juan Carlos"
              maxLength={80}
            />
            {fieldErrors.nombres && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.nombres}
              </p>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Apellidos <span className="text-[var(--destructive)]">*</span>
            </span>
            <input
              className={fieldClass}
              value={apellidos}
              onChange={(e) => {
                setApellidos(e.target.value);
                setFieldErrors((prev) => ({ ...prev, apellidos: "" }));
              }}
              placeholder="Ej: Pérez García"
              maxLength={80}
            />
            {fieldErrors.apellidos && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.apellidos}
              </p>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Domicilio</span>
            <input
              className={fieldClass}
              value={domicilio}
              onChange={(e) => {
                setDomicilio(e.target.value);
                setFieldErrors((prev) => ({ ...prev, domicilio: "" }));
              }}
              placeholder="Av. Ejemplo 123, Urb. Los Olivos"
              maxLength={200}
            />
            {fieldErrors.domicilio && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.domicilio}
              </p>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Teléfono</span>
              <input
                className={fieldClass}
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value.replace(/\D/g, ""));
                  setFieldErrors((prev) => ({ ...prev, telefono: "" }));
                }}
                placeholder="999999999"
                maxLength={9}
              />
            {fieldErrors.telefono && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.telefono}
              </p>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Correo electrónico <span className="text-[var(--destructive)]">*</span>
            </span>
            <input
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="correo@ejemplo.com"
              maxLength={120}
            />
            {fieldErrors.email && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.email}
              </p>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Bien contratado / Servicio
            </span>
            <input
              className={fieldClass}
              value={bienContratado}
              onChange={(e) => {
                setBienContratado(e.target.value);
                setFieldErrors((prev) => ({ ...prev, bienContratado: "" }));
              }}
              placeholder="Ej: Corte de cabello"
              maxLength={150}
            />
            {fieldErrors.bienContratado && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.bienContratado}
              </p>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Monto reclamado (S/)
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                className={`${fieldClass} pl-9`}
                value={montoReclamado}
                onChange={(e) => {
                  setMontoReclamado(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, monto: "" }));
                }}
                placeholder="0.00"
              />
            </div>
            {fieldErrors.monto && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.monto}
              </p>
            )}
          </label>

          <div className="sm:col-span-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Descripción de la queja / reclamo <span className="text-[var(--destructive)]">*</span>
              </span>
              <textarea
                className={`${fieldClass} min-h-[140px] resize-y leading-relaxed`}
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, descripcion: "" }));
                }}
                placeholder="Describa de manera detallada y ordenada los hechos que motivan su queja o reclamo. Incluya fechas, nombres de ser el caso, y cualquier información relevante..."
                maxLength={2000}
              />
              {fieldErrors.descripcion && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.descripcion}
                </p>
              )}
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Pedido del consumidor
              </span>
              <textarea
                className={`${fieldClass} min-h-[110px] resize-y leading-relaxed`}
                value={pedidoConsumidor}
                onChange={(e) => {
                  setPedidoConsumidor(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, pedidoConsumidor: "" }));
                }}
                placeholder="Indique qué solución espera: devolución de su dinero, cambio del producto, rectificación del servicio, etc."
                maxLength={1000}
              />
              {fieldErrors.pedidoConsumidor && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.pedidoConsumidor}
                </p>
              )}
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:justify-between">
          <button
            type="submit"
            disabled={isSubmitting || Object.values(fieldErrors).some((v) => v !== "")}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[var(--hover)] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
                Presentar {tipo}
              </>
            )}
          </button>
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)] text-center sm:text-right">
            Copia enviada a su correo electrónico.
            <br />
            Respuesta en máximo 15 días hábiles.
          </p>
        </div>
      </form>

      <ConfirmationModal
        open={showConfirm}
        title="¿Desea confirmar?"
        description={`Confirme los datos ingresados para presentar ${tipo === "reclamo" ? "el reclamo" : "la queja"}. Una vez enviado, recibirá una copia por correo electrónico.`}
        confirmLabel={isSubmitting ? "Enviando..." : "Sí, confirmar"}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        position="top-right"
      />
    </div>
  );
}
