"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Globe, Loader2, MapPin, PencilLine } from "lucide-react";
import { validateRequired, validatePhoneOptional, validateUrl } from "@/lib/validators";
import { LocalesService, type Locale } from "@/services/locales.service";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Toast } from "@/components/dashboard/toast";

function extractCoordsFromMapsUrl(url: string): { lat: string; lng: string } | null {
  const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) return { lat: match[1], lng: match[2] };
  const placeMatch = url.match(/\/place\/[^/]+\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) return { lat: placeMatch[1], lng: placeMatch[2] };
  return null;
}

type LocaleDraft = {
  nombre: string;
  direccion: string;
  horario: string;
  telefono: string;
  maps_url: string;
  lat: string;
  lng: string;
};

const emptyDraft: LocaleDraft = {
  nombre: "",
  direccion: "",
  horario: "",
  telefono: "",
  maps_url: "",
  lat: "",
  lng: "",
};

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

export default function LocalesManagement() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<LocaleDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => { fetchLocale(); }, []);

  async function fetchLocale() {
    setLoading(true);
    try {
      const data = await LocalesService.getFirst();
      if (data) {
        setLocale(data);
        setDraft({
          nombre: data.nombre,
          direccion: data.direccion,
          horario: data.horario,
          telefono: data.telefono,
          maps_url: data.maps_url,
          lat: String(data.lat),
          lng: String(data.lng),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false);
    const errors: Record<string, string> = {};
    const nombreErr = validateRequired(draft.nombre, "El nombre");
    const direccionErr = validateRequired(draft.direccion, "La dirección");
    const latErr = validateRequired(draft.lat, "La latitud");
    const lngErr = validateRequired(draft.lng, "La longitud");
    const horarioErr = draft.horario ? validateRequired(draft.horario, "El horario") : null;
    const telErr = validatePhoneOptional(draft.telefono);
    const mapsErr = draft.maps_url ? validateUrl(draft.maps_url, "La URL de Google Maps") : null;
    if (nombreErr) errors.nombre = nombreErr;
    if (direccionErr) errors.direccion = direccionErr;
    if (latErr) errors.lat = latErr;
    if (lngErr) errors.lng = lngErr;
    if (horarioErr) errors.horario = horarioErr;
    if (telErr) errors.telefono = telErr;
    if (mapsErr) errors.maps_url = mapsErr;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    const lat = parseFloat(draft.lat);
    const lng = parseFloat(draft.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Latitud y longitud deben ser numeros validos.");
      return;
    }
    if (!locale?.id) {
      setError("No hay un local configurado.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await LocalesService.update(locale.id, {
        nombre: draft.nombre,
        direccion: draft.direccion,
        horario: draft.horario,
        telefono: draft.telefono,
        maps_url: draft.maps_url,
        lat,
        lng,
      });
      setLocale(updated);
      setToastMessage("Cambios guardados correctamente.");
      setToastType("success");
      setToastOpen(true);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Error al guardar");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--background)] p-3">
            <MapPin size={20} className="text-[var(--foreground)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              Configuracion del local
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {locale ? `Editando ${locale.nombre}` : "No hay un local configurado aun."}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4">
            <div className="col-span-full">
              <Field label="Direccion" required error={fieldErrors.direccion}>
                <input className={inputClassName} value={draft.direccion} onChange={(e) => { setDraft((c) => ({ ...c, direccion: e.target.value })); setFieldErrors((prev) => ({ ...prev, direccion: "" })); }} placeholder="Av. Aviacion 3464 · San Borja" />
              </Field>
            </div>
            <Field label="Horario" error={fieldErrors.horario}>
              <input className={inputClassName} value={draft.horario} onChange={(e) => { setDraft((c) => ({ ...c, horario: e.target.value })); setFieldErrors((prev) => ({ ...prev, horario: "" })); }} placeholder="Lun – Sab · 8:00 AM – 8:00 PM" />
            </Field>
            <Field label="Telefono" error={fieldErrors.telefono}>
              <input className={inputClassName} value={draft.telefono} onChange={(e) => { setDraft((c) => ({ ...c, telefono: e.target.value })); setFieldErrors((prev) => ({ ...prev, telefono: "" })); }} placeholder="+51 999 999 999" />
            </Field>
            <Field label="URL Google Maps" error={fieldErrors.maps_url}>
              <input className={inputClassName} value={draft.maps_url} onChange={(e) => { setDraft((c) => ({ ...c, maps_url: e.target.value })); setFieldErrors((prev) => ({ ...prev, maps_url: "" })); }} placeholder="https://maps.google.com/?q=..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2 col-span-full">
              <Field label="Latitud" required error={fieldErrors.lat}>
                <input className={inputClassName} value={draft.lat} onChange={(e) => { setDraft((c) => ({ ...c, lat: e.target.value })); setFieldErrors((prev) => ({ ...prev, lat: "" })); }} placeholder="-12.0943" type="number" step="any" />
              </Field>
              <Field label="Longitud" required error={fieldErrors.lng}>
                <input className={inputClassName} value={draft.lng} onChange={(e) => { setDraft((c) => ({ ...c, lng: e.target.value })); setFieldErrors((prev) => ({ ...prev, lng: "" })); }} placeholder="-77.0073" type="number" step="any" />
              </Field>
            </div>
            {draft.lat && draft.lng && !isNaN(Number(draft.lat)) && !isNaN(Number(draft.lng)) && (
              <div className="col-span-full overflow-hidden rounded-2xl border border-[var(--border)]">
                <iframe
                  title="Vista previa Google Maps"
                  width="100%"
                  height="300"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${draft.lat},${draft.lng}&z=15&output=embed`}
                />
              </div>
            )}
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={!locale || Object.values(fieldErrors).some((v) => v !== "") || saving}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          <PencilLine size={16} />
          Guardar cambios
        </button>
        {locale?.maps_url && (
          <a
            href={locale.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
          >
            <Globe size={16} />
            Ver en Google Maps
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-4 text-sm text-[var(--destructive)]">{error}</div>
      )}

      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar cambios"
        description="¿Estas seguro de guardar los cambios del local?"
        confirmLabel="Si, guardar"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        position="top-right"
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{title}</p>
      {children}
    </div>
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
        <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </label>
  );
}