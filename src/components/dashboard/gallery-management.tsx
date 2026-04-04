"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Images, Plus, Search, Tags } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

type GalleryItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "Publicado" | "Borrador";
  order: number;
  cover: string;
};

const initialGallery: GalleryItem[] = [
  {
    id: "style-01",
    title: "Fade texturizado",
    description: "Corte moderno con laterales bajos y volumen superior.",
    tags: ["Fade", "Moderno", "Top seller"],
    status: "Publicado",
    order: 1,
    cover: "FT",
  },
  {
    id: "style-02",
    title: "Beard premium",
    description: "Perfilado de barba con toalla caliente y acabado premium.",
    tags: ["Barba", "Premium"],
    status: "Publicado",
    order: 2,
    cover: "BP",
  },
  {
    id: "style-03",
    title: "Corte kids",
    description: "Formato agil para ninos con duracion reducida.",
    tags: ["Kids", "Clasico"],
    status: "Borrador",
    order: 3,
    cover: "CK",
  },
];

type GalleryDraft = Omit<GalleryItem, "tags"> & {
  tags: string;
};

const emptyDraft: GalleryDraft = {
  id: "",
  title: "",
  description: "",
  tags: "",
  status: "Borrador",
  order: 1,
  cover: "NA",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function GalleryManagement() {
  const [gallery, setGallery] = useState(initialGallery);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialGallery[0]?.id ?? "");
  const [draft, setDraft] = useState<GalleryDraft>({
    ...emptyDraft,
    ...toDraft(initialGallery[0]),
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const filteredGallery = useMemo(() => {
    return gallery.filter((item) => {
      return (
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }, [gallery, query]);

  const selectedItem = gallery.find((item) => item.id === selectedId);

  const saveItem = () => {
    if (!draft.title) {
      return;
    }

    const nextItem: GalleryItem = {
      ...draft,
      id: selectedId || slugify(draft.title),
      tags: draft.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (selectedId) {
      setGallery((current) => current.map((item) => (item.id === selectedId ? nextItem : item)));
      return;
    }

    setGallery((current) => [nextItem, ...current]);
    setSelectedId(nextItem.id);
    setDraft(toDraft(nextItem));
  };

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
              onClick={() => {
                setSelectedId("");
                setDraft(emptyDraft);
              }}
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
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por titulo o descripcion"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredGallery.map((item) => (
            <article
              key={item.id}
              className={`rounded-3xl border bg-white p-4 shadow-sm transition ${
                selectedId === item.id
                  ? "border-zinc-900 shadow-md"
                  : "border-zinc-200 hover:-translate-y-1 hover:shadow-md"
              }`}
            >
              <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.cover}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    Orden {item.order}
                  </span>
                </div>
                <p className="mt-8 text-lg font-semibold">{item.title}</p>
              </div>

              <p className="mt-4 text-sm text-zinc-600">{item.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setDraft(toDraft(item));
                  }}
                  className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                >
                  Editar pieza
                </button>
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
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>
            <Field label="Descripcion">
              <textarea
                className={`${inputClassName} min-h-28 resize-none`}
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </Field>
            <Field label="Tags">
              <input
                className={inputClassName}
                value={draft.tags}
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                placeholder="Fade, moderno, top seller"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Estado">
                <select
                  className={inputClassName}
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as GalleryDraft["status"],
                    }))
                  }
                >
                  <option>Publicado</option>
                  <option>Borrador</option>
                </select>
              </Field>
              <Field label="Orden">
                <input
                  type="number"
                  className={inputClassName}
                  value={draft.order}
                  onChange={(event) => setDraft((current) => ({ ...current, order: Number(event.target.value) }))}
                />
              </Field>
            </div>
            <Field label="Iniciales">
              <input
                className={inputClassName}
                value={draft.cover}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, cover: event.target.value.slice(0, 2) }))
                }
                placeholder="FT"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {selectedId ? "Guardar estilo" : "Crear estilo"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(selectedItem ? toDraft(selectedItem) : emptyDraft)}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Restablecer
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Proximo paso</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p className="flex items-center gap-2">
              <Images size={15} />
              Cargar fotos reales en lugar de muestras
            </p>
            <p className="flex items-center gap-2">
              <Tags size={15} />
              Guardar etiquetas para ordenar mejor la galeria
            </p>
            <p className="flex items-center gap-2">
              {draft.status === "Publicado" ? <Eye size={15} /> : <EyeOff size={15} />}
              Elegir si se muestra o se oculta
            </p>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo estilo"}
        description={
          selectedId
            ? "Se guardaran los cambios hechos en este estilo."
            : "Se creara un nuevo estilo con los datos que llenaste."
        }
        confirmLabel={selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          saveItem();
          setIsConfirmOpen(false);
        }}
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

function toDraft(item?: GalleryItem): GalleryDraft {
  if (!item) {
    return emptyDraft;
  }

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    tags: item.tags.join(", "),
    status: item.status,
    order: item.order,
    cover: item.cover,
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}
