"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Images, Plus, Search, Tags, Loader2 } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { createClient } from "@/lib/supabase/client";

type GalleryItem = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  orden: number;
  esta_activo: boolean;
  destacado: boolean;
  servicio_id: string | null;
};

type GalleryDraft = {
  titulo: string;
  descripcion: string;
  imagen_url: string;
  orden: number;
  esta_activo: boolean;
  destacado: boolean;
};

const emptyDraft: GalleryDraft = {
  titulo: "",
  descripcion: "",
  imagen_url: "",
  orden: 1,
  esta_activo: false,
  destacado: false,
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function GalleryManagement() {
  const supabase = createClient();

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    setLoading(true);
    const { data } = await supabase
      .from("galeria_cortes")
      .select("*")
      .order("orden", { ascending: true });
    setGallery(data ?? []);
    if (data && data.length > 0) {
      setSelectedId(data[0].id);
      setDraft(toDraft(data[0]));
    }
    setLoading(false);
  }

  const filteredGallery = useMemo(() => {
    return gallery.filter((item) =>
      item.titulo?.toLowerCase().includes(query.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }, [gallery, query]);

  const selectedItem = gallery.find((item) => item.id === selectedId);

  async function saveItem() {
    setSaving(true);
    if (selectedId) {
      await supabase.from("galeria_cortes").update({
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        imagen_url: draft.imagen_url,
        orden: draft.orden,
        esta_activo: draft.esta_activo,
        destacado: draft.destacado,
        actualizado_en: new Date().toISOString(),
      }).eq("id", selectedId);
    } else {
      await supabase.from("galeria_cortes").insert({
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        imagen_url: draft.imagen_url,
        orden: draft.orden,
        esta_activo: draft.esta_activo,
        destacado: draft.destacado,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      });
    }
    await fetchGallery();
    setSaving(false);
  }

  async function deleteItem() {
    if (!selectedId) return;
    await supabase.from("galeria_cortes").delete().eq("id", selectedId);
    setSelectedId(null);
    setDraft(emptyDraft);
    await fetchGallery();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-zinc-400" />
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.18fr_0.92fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Catalogo visual</p>
              <p className="mt-1 text-sm text-zinc-600">
                Ordena las fotos y estilos que quieres mostrar a tus clientes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedId(null); setDraft(emptyDraft); }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={16} />
              Nuevo estilo
            </button>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por titulo o descripcion"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredGallery.map((item) => (
            <article
              key={item.id}
              className={`rounded-3xl border bg-white shadow-sm transition ${
                selectedId === item.id
                  ? "border-zinc-900 shadow-md"
                  : "border-zinc-200 hover:-translate-y-1 hover:shadow-md"
              }`}
            >
              {item.imagen_url ? (
                <img
                  src={item.imagen_url}
                  alt={item.titulo ?? ""}
                  className="h-48 w-full rounded-t-3xl object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-t-3xl bg-gradient-to-br from-zinc-900 to-zinc-700">
                  <span className="text-2xl font-black text-white">
                    {item.titulo?.slice(0, 2).toUpperCase() ?? "NA"}
                  </span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-900">{item.titulo}</p>
                  <span className="text-xs text-zinc-400">#{item.orden}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{item.descripcion}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.destacado && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Destacado
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.esta_activo
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {item.esta_activo ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(item.id); setDraft(toDraft(item)); }}
                    className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            {selectedId ? "Editar estilo" : "Crear estilo"}
          </p>
          <div className="mt-4 grid gap-3">
            <Field label="Titulo">
              <input
                className={inputClassName}
                value={draft.titulo}
                onChange={(e) => setDraft((d) => ({ ...d, titulo: e.target.value }))}
              />
            </Field>
            <Field label="Descripcion">
              <textarea
                className={`${inputClassName} min-h-24 resize-none`}
                value={draft.descripcion}
                onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
              />
            </Field>
            <Field label="Imagen">
              <div className="flex gap-2">
                <input className={inputClassName}
                  value={draft.imagen_url}
                  onChange={(e) => setDraft((d) => ({ ...d, imagen_url: e.target.value }))}
                  placeholder="https://..." />
                <CloudinaryUpload
                  cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                  onUpload={(url) => setDraft((d) => ({ ...d, imagen_url: url }))}
                />
              </div>
            </Field>
            {draft.imagen_url && (
              <img
                src={draft.imagen_url}
                alt="preview"
                className="h-40 w-full rounded-2xl object-cover"
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Orden">
                <input
                  type="number"
                  className={inputClassName}
                  value={draft.orden}
                  onChange={(e) => setDraft((d) => ({ ...d, orden: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Estado">
                <select
                  className={inputClassName}
                  value={draft.esta_activo ? "publicado" : "borrador"}
                  onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "publicado" }))}
                >
                  <option value="publicado">Publicado</option>
                  <option value="borrador">Borrador</option>
                </select>
              </Field>
              <Field label="Destacar en home">
                <select
                  className={inputClassName}
                  value={draft.destacado ? "si" : "no"}
                  onChange={(e) => setDraft((d) => ({ ...d, destacado: e.target.value === "si" }))}
                >
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!draft.titulo || !draft.imagen_url}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
            >
              {selectedId ? "Guardar cambios" : "Crear estilo"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(selectedItem ? toDraft(selectedItem) : emptyDraft)}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Restablecer
            </button>
            {selectedId && (
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Proximo paso</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p className="flex items-center gap-2"><Images size={15} />Cargar fotos reales en lugar de muestras</p>
            <p className="flex items-center gap-2"><Tags size={15} />Ordenar por numero de orden</p>
            <p className="flex items-center gap-2">
              {draft.esta_activo ? <Eye size={15} /> : <EyeOff size={15} />}
              Elegir si se muestra o se oculta
            </p>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo estilo"}
        description={selectedId ? "Se guardaran los cambios hechos en este estilo." : "Se creara un nuevo estilo."}
        confirmLabel={saving ? "Guardando..." : selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => { await saveItem(); setIsConfirmOpen(false); }}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        title="Eliminar estilo"
        description="Esta accion no se puede deshacer."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => { await deleteItem(); setIsDeleteOpen(false); }}
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

function toDraft(item: GalleryItem): GalleryDraft {
  return {
    titulo: item.titulo ?? "",
    descripcion: item.descripcion ?? "",
    imagen_url: item.imagen_url ?? "",
    orden: item.orden,
    esta_activo: item.esta_activo,
    destacado: item.destacado,
  };
}