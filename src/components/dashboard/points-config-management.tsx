"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Save, Settings } from "lucide-react";
import { ConfiguracionService, type ConfiguracionPuntos } from "@/services/configuracion.service";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

const inputClassName = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {error && <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]"><AlertCircle size={11} />{error}</p>}
    </label>
  );
}

export function PointsConfigManagement() {
  const [config, setConfig] = useState<ConfiguracionPuntos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [draft, setDraft] = useState({ minimoCanje: 0, estaActivo: false, promocionActiva: false });

  useEffect(() => {
    ConfiguracionService.get()
      .then((data) => {
        if (data) {
          setConfig(data);
          setDraft({
            minimoCanje: data.minimoCanje,
            estaActivo: data.estaActivo,
            promocionActiva: data.promocionActiva,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (draft.minimoCanje < 0) errors.minimoCanje = "El mínimo de canje no puede ser negativo";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setSaving(true);
    try {
      const updated = await ConfiguracionService.update(draft);
      setConfig(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setIsConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--background)] p-3">
            <Settings size={20} className="text-[var(--foreground)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">Configuración de puntos</p>
            <p className="text-sm text-[var(--text-muted)]">Define las reglas del sistema de puntos y fidelización.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Puntos mínimos para canje" error={fieldErrors.minimoCanje}>
            <input
              type="number"
              min={0}
              className={inputClassName}
              value={draft.minimoCanje}
              onChange={(e) => { setFieldErrors((prev) => ({ ...prev, minimoCanje: "" })); setDraft((prev) => ({ ...prev, minimoCanje: Number(e.target.value) })); }}
            />
          </Field>
          <Field label="Sistema de puntos activo">
            <select
              className={inputClassName}
              value={draft.estaActivo ? "Activo" : "Inactivo"}
              onChange={(e) => setDraft((prev) => ({ ...prev, estaActivo: e.target.value === "Activo" }))}
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </Field>
          <Field label="Promoción activa">
            <select
              className={inputClassName}
              value={draft.promocionActiva ? "Activa" : "Inactiva"}
              onChange={(e) => setDraft((prev) => ({ ...prev, promocionActiva: e.target.value === "Activa" }))}
            >
              <option>Activa</option>
              <option>Inactiva</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={Object.keys(fieldErrors).length > 0 || saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
          >
            <Save size={16} />
            Guardar configuración
          </button>
        </div>
      </div>

      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar cambios"
        description="Se actualizará la configuración de puntos."
        confirmLabel="Sí, guardar"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />
    </>
  );
}
