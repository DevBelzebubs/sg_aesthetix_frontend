"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Globe, Image, Loader2, Save, Video } from "lucide-react";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { Toast } from "@/components/dashboard/toast";
import type { ToastType } from "@/components/dashboard/toast";
import { createClient } from "@/lib/supabase/client";

type HeroRow = {
  id: string;
  tipo: string;
  url_media: string;
  titulo: string;
  subtitulo: string;
  url_logo_dark: string;
  url_logo_light: string;
  activo: boolean;
};

const inputCn = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

export function HeroManagement() {
  const supabase = createClient();
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  useEffect(() => {
    supabase
      .from("hero_content")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[HERO] Error cargando:", error);
        setHero(data ?? null);
        setLoading(false);
      });
  }, [supabase]);

  const update = (key: keyof HeroRow, value: string | boolean) =>
    setHero((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!hero) return;
    setSaving(true);
    const { error } = await supabase
      .from("hero_content")
      .update({
        tipo: hero.tipo,
        url_media: hero.url_media,
        titulo: hero.titulo,
        subtitulo: hero.subtitulo,
        url_logo_dark: hero.url_logo_dark,
        url_logo_light: hero.url_logo_light,
        activo: hero.activo,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", hero.id);

    if (error) {
      setToastMessage(error.message);
      setToastType("error");
    } else {
      setToastMessage("Hero actualizado correctamente");
      setToastType("success");
    }
    setToastOpen(true);
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-2xl bg-[var(--background)] p-3"><Globe size={20} className="text-[var(--foreground)]" /></div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">Hero de la Landing Page</p>
            <p className="text-sm text-[var(--text-muted)]">Configura el video, título y logos del hero principal.</p>
          </div>
        </div>

        {!hero ? (
          <p className="text-sm text-[var(--text-muted)]">No hay registro de hero. Ejecutá la migración v3 para crearlo.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tipo */}
            <Field label="Tipo de medio">
              <div className="flex rounded-xl bg-[var(--background-secondary)] p-0.5 w-fit border border-[var(--border)]">
                <button type="button" onClick={() => update("tipo", "video")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${hero.tipo === "video" ? "bg-[var(--hover)] text-white" : "text-[var(--text-muted)]"}`}><Video size={16} /> Video</button>
                <button type="button" onClick={() => update("tipo", "imagen")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${hero.tipo === "imagen" ? "bg-[var(--hover)] text-white" : "text-[var(--text-muted)]"}`}><Image size={16} /> Imagen</button>
              </div>
            </Field>

            {/* Activo */}
            <Field label="Estado">
              <div className="flex rounded-xl bg-[var(--background-secondary)] p-0.5 w-fit border border-[var(--border)]">
                <button type="button" onClick={() => update("activo", true)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${hero.activo ? "bg-[var(--hover)] text-white" : "text-[var(--text-muted)]"}`}>Activo</button>
                <button type="button" onClick={() => update("activo", false)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${!hero.activo ? "bg-neutral-700 text-white" : "text-[var(--text-muted)]"}`}>Inactivo</button>
              </div>
            </Field>

            {/* Media URL */}
            <div className="md:col-span-2">
              <Field label={hero.tipo === "video" ? "URL del Video" : "URL de la Imagen"}>
                <div className="flex gap-3">
                  <input className={`${inputCn} flex-1`} value={hero.url_media} onChange={(e) => update("url_media", e.target.value)} placeholder="https://res.cloudinary.com/..." />
                  <CloudinaryUpload cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!} uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} onUpload={(url) => update("url_media", url)} />
                </div>
              </Field>
            </div>

            {/* Preview */}
            {hero.url_media && (
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Vista previa</p>
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black max-h-64">
                  {hero.tipo === "video" ? (
                    <video src={hero.url_media} autoPlay muted loop playsInline className="w-full h-64 object-cover" />
                  ) : (
                    <img src={hero.url_media} alt="preview" className="w-full h-64 object-cover" />
                  )}
                </div>
              </div>
            )}

            {/* Título */}
            <Field label="Título principal">
              <input className={inputCn} value={hero.titulo} onChange={(e) => update("titulo", e.target.value)} />
            </Field>

            {/* Subtítulo */}
            <Field label="Subtítulo (badge sobre el video)">
              <input className={inputCn} value={hero.subtitulo} onChange={(e) => update("subtitulo", e.target.value)} />
            </Field>

            {/* Logo Dark */}
            <Field label="Logo (modo oscuro)">
              <div className="flex gap-3">
                <input className={`${inputCn} flex-1`} value={hero.url_logo_dark} onChange={(e) => update("url_logo_dark", e.target.value)} placeholder="URL del logo para dark mode" />
                <CloudinaryUpload cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!} uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} onUpload={(url) => update("url_logo_dark", url)} />
              </div>
              {hero.url_logo_dark && <img src={hero.url_logo_dark} alt="logo dark" className="mt-2 h-12 object-contain rounded-xl bg-black/40 p-2" />}
            </Field>

            {/* Logo Light */}
            <Field label="Logo (modo claro)">
              <div className="flex gap-3">
                <input className={`${inputCn} flex-1`} value={hero.url_logo_light} onChange={(e) => update("url_logo_light", e.target.value)} placeholder="URL del logo para light mode" />
                <CloudinaryUpload cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!} uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} onUpload={(url) => update("url_logo_light", url)} />
              </div>
              {hero.url_logo_light && <img src={hero.url_logo_light} alt="logo light" className="mt-2 h-12 object-contain rounded-xl bg-white/80 p-2" />}
            </Field>
          </div>
        )}
      </div>

      {hero && (
        <div className="flex justify-end">
          <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-6 py-3 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} />
            Guardar cambios
          </button>
        </div>
      )}

      <Toast message={toastMessage} type={toastType} open={toastOpen} onClose={() => setToastOpen(false)} position="top-right" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}
