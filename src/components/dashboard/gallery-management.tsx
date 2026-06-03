"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Image, Images, Loader2, Plus, Search, Star, Trash2, X } from "lucide-react";
import { validateRequired, validatePositiveNumber } from "@/lib/validators";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { createClient } from "@/lib/supabase/client";

type GalleryItem = {
  id: string; titulo: string; descripcion: string; imagen_url: string;
  orden: number; esta_activo: boolean; destacado: boolean; servicio_id: string | null;
};

type GalleryDraft = {
  titulo: string; descripcion: string; imagen_url: string;
  orden: number; esta_activo: boolean; destacado: boolean;
};

const emptyDraft: GalleryDraft = { titulo: "", descripcion: "", imagen_url: "", orden: 1, esta_activo: false, destacado: false };
const inputClassName = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

type Props = { totalEstilos: number; totalPublicados: number; totalDestacados: number; };

export function GalleryManagement({ totalEstilos, totalPublicados, totalDestacados }: Props) {
  const supabase = createClient();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryDraft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchGallery(); }, []);

  async function fetchGallery() {
    setLoading(true);
    const { data } = await supabase.from("galeria_cortes").select("*").order("orden", { ascending: true });
    setGallery(data ?? []);
    setLoading(false);
  }

  const filteredGallery = useMemo(() => gallery.filter((i) => i.titulo?.toLowerCase().includes(query.toLowerCase()) || i.descripcion?.toLowerCase().includes(query.toLowerCase())), [gallery, query]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredGallery.length / pageSize);
  const paginatedGallery = filteredGallery.slice((page - 1) * pageSize, page * pageSize);

  const selectedItem = gallery.find((i) => i.id === selectedId);

  const handleCreate = () => { setSelectedId(null); setDraft(emptyDraft); setMode("create"); };
  const handleEdit = (item: GalleryItem) => { setSelectedId(item.id); setDraft(toDraft(item)); setMode("edit"); };
  const handleBack = () => { setMode("list"); setSelectedId(null); setDraft(emptyDraft); };

  async function saveItem() {
    const errors: Record<string, string> = {};
    const tituloErr = validateRequired(draft.titulo, "El título");
    if (tituloErr) errors.titulo = tituloErr;
    const ordenErr = validatePositiveNumber(draft.orden, "El orden");
    if (ordenErr) errors.orden = ordenErr;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setSaving(true);
    if (mode === "edit" && selectedId) {
      await supabase.from("galeria_cortes").update({ ...draft, actualizado_en: new Date().toISOString() }).eq("id", selectedId);
    } else {
      await supabase.from("galeria_cortes").insert({ ...draft, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() });
    }
    await fetchGallery();
    setSaving(false); setMode("list"); setSelectedId(null); setDraft(emptyDraft); setIsConfirmOpen(false);
  }

  async function deleteItem() {
    if (!selectedId) return;
    await supabase.from("galeria_cortes").delete().eq("id", selectedId);
    setSelectedId(null); setDraft(emptyDraft); setMode("list"); await fetchGallery(); setIsDeleteOpen(false);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>;

  return (
    <>
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total estilos</p>
            <div className="mt-2 flex items-center gap-2"><Images size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalEstilos}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Publicados</p>
            <div className="mt-2 flex items-center gap-2"><Image size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalPublicados}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Destacados</p>
            <div className="mt-2 flex items-center gap-2"><Star size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalDestacados}</p></div>
          </article>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-[var(--foreground)]">Catalogo visual</p><p className="mt-1 text-sm text-[var(--text-muted)]">{gallery.length} estilo(s)</p></div>
          {mode === "list" ? (
            <button type="button" onClick={handleCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"><Plus size={16} /> Nuevo estilo</button>
          ) : (
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><ArrowLeft size={16} /> Volver al listado</button>
          )}
        </div>
        {mode === "list" && (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]" placeholder="Buscar por titulo o descripcion" />
          </label>
        )}
      </div>

      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedGallery.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16"><Images size={32} className="text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">{query ? "No se encontraron estilos." : "No hay estilos. Crea el primero."}</p></div>
          ) : (
            paginatedGallery.map((item) => (
              <article key={item.id} className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md overflow-hidden">
                {item.imagen_url ? <img src={item.imagen_url} alt={item.titulo ?? ""} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-[var(--foreground)]"><span className="text-2xl font-black text-[var(--background)]">{item.titulo?.slice(0, 2).toUpperCase() ?? "NA"}</span></div>}
                <div className="p-4">
                  <div className="flex items-center justify-between"><p className="font-semibold text-[var(--foreground)]">{item.titulo}</p><span className="text-xs text-[var(--text-muted)]">#{item.orden}</span></div>
                  <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">{item.descripcion}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.destacado && <span className="rounded-full bg-[var(--hover)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--hover)]">Destacado</span>}
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.esta_activo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{item.esta_activo ? "Publicado" : "Borrador"}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
                    <button type="button" onClick={() => handleEdit(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"><Plus size={14} className="rotate-45" /> Editar</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-[var(--background)] p-3"><Images size={20} className="text-[var(--foreground)]" /></div><div><p className="text-lg font-semibold text-[var(--foreground)]">{mode === "create" ? "Nuevo estilo" : "Editar estilo"}</p><p className="text-sm text-[var(--text-muted)]">{mode === "create" ? "Agrega una foto a la galeria." : `Editando ${selectedItem?.titulo ?? ""}`}</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo" required error={fieldErrors.titulo}><input className={inputClassName} value={draft.titulo} onChange={(e) => { setFieldErrors((prev) => ({ ...prev, titulo: "" })); setDraft((d) => ({ ...d, titulo: e.target.value })); }} /></Field>
            <Field label="Orden" error={fieldErrors.orden}><input type="number" className={inputClassName} value={draft.orden} onChange={(e) => { setFieldErrors((prev) => ({ ...prev, orden: "" })); setDraft((d) => ({ ...d, orden: Number(e.target.value) })); }} /></Field>
            <div className="col-span-full"><Field label="Descripcion"><textarea className={`${inputClassName} min-h-24 resize-none`} value={draft.descripcion} onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} /></Field></div>
            <div className="col-span-full">
              <Field label="Imagen"><div className="flex gap-2"><input className={inputClassName} value={draft.imagen_url} onChange={(e) => setDraft((d) => ({ ...d, imagen_url: e.target.value }))} placeholder="https://..." /><CloudinaryUpload cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!} uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} onUpload={(url) => setDraft((d) => ({ ...d, imagen_url: url }))} /></div></Field>
              {draft.imagen_url && <img src={draft.imagen_url} alt="preview" className="mt-2 h-40 w-full rounded-2xl object-cover" />}
            </div>
            <Field label="Estado"><select className={inputClassName} value={draft.esta_activo ? "publicado" : "borrador"} onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "publicado" }))}><option value="publicado">Publicado</option><option value="borrador">Borrador</option></select></Field>
            <Field label="Destacar"><select className={inputClassName} value={draft.destacado ? "si" : "no"} onChange={(e) => setDraft((d) => ({ ...d, destacado: e.target.value === "si" }))}><option value="si">Si</option><option value="no">No</option></select></Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!draft.titulo || saving || Object.keys(fieldErrors).length > 0} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{mode === "create" ? "Crear estilo" : "Guardar cambios"}</button>
            {mode === "edit" && <button type="button" onClick={() => setIsDeleteOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"><Trash2 size={16} /> Eliminar</button>}
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><X size={16} /> Cancelar</button>
          </div>
        </div>
      )}

      <ConfirmationModal open={isConfirmOpen} title={mode === "create" ? "Confirmar nuevo estilo" : "Confirmar cambios"} description={mode === "create" ? "Se creara un nuevo estilo." : "Se guardaran los cambios."} confirmLabel={saving ? "Guardando..." : mode === "create" ? "Si, crear" : "Si, guardar"} onClose={() => setIsConfirmOpen(false)} onConfirm={saveItem} />
      <ConfirmationModal open={isDeleteOpen} title="Eliminar estilo" description="Esta accion no se puede deshacer." confirmLabel="Si, eliminar" onClose={() => setIsDeleteOpen(false)} onConfirm={deleteItem} />
    </>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}{error && <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]"><AlertCircle size={11} />{error}</p>}</label>;
}

function toDraft(item: GalleryItem): GalleryDraft {
  return { titulo: item.titulo ?? "", descripcion: item.descripcion ?? "", imagen_url: item.imagen_url ?? "", orden: item.orden, esta_activo: item.esta_activo, destacado: item.destacado };
}
