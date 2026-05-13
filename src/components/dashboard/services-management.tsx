"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, DollarSign, Loader2, Plus, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { createClient } from "@/lib/supabase/client";

type Service = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_minutos: number;
  puntos_otorgados: number;
  esta_activo: boolean;
  categoria_servicio_id: number;
};

type ServiceDraft = Omit<Service, "id">;

const emptyDraft: ServiceDraft = {
  nombre: "",
  descripcion: "",
  precio: 0,
  duracion_minutos: 45,
  puntos_otorgados: 0,
  esta_activo: true,
  categoria_servicio_id: 1,
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function ServicesManagement() {
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase
      .from("servicios")
      .select("*")
      .order("nombre", { ascending: true });
    setServices(data ?? []);
    if (data && data.length > 0) {
      setSelectedId(data[0].id);
      setDraft(toDraft(data[0]));
    }
    setLoading(false);
  }

  const filteredServices = useMemo(() => {
    return services.filter((s) =>
      s.nombre.toLowerCase().includes(query.toLowerCase()) ||
      s.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, services]);

  const selectedService = services.find((s) => s.id === selectedId);

  async function saveService() {
    if (!draft.nombre) return;
    setSaving(true);
    if (selectedId) {
      await supabase.from("servicios").update({
        ...draft,
        actualizado_en: new Date().toISOString(),
      }).eq("id", selectedId);
    } else {
      await supabase.from("servicios").insert({
        ...draft,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      });
    }
    await fetchServices();
    setSaving(false);
  }

  async function deleteService() {
    if (!selectedId) return;
    await supabase.from("servicios").delete().eq("id", selectedId);
    setSelectedId(null);
    setDraft(emptyDraft);
    await fetchServices();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-zinc-400" />
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Catalogo de servicios</p>
              <p className="mt-1 text-sm text-zinc-600">
                Ordena tus servicios, cambia precios y elige quien los atiende.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedId(null); setDraft(emptyDraft); }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={16} />
              Nuevo servicio
            </button>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por nombre o descripcion"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Duracion</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr
                  key={service.id}
                  className={`cursor-pointer border-t border-zinc-100 transition hover:bg-zinc-50 ${
                    selectedId === service.id ? "bg-zinc-50" : ""
                  }`}
                  onClick={() => { setSelectedId(service.id); setDraft(toDraft(service)); }}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900">{service.nombre}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{service.descripcion}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{service.duracion_minutos} min</td>
                  <td className="px-4 py-3 text-zinc-700">S/{service.precio}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      service.esta_activo ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {service.esta_activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{service.puntos_otorgados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            {selectedId ? "Editar servicio" : "Crear servicio"}
          </p>
          <div className="mt-4 grid gap-3">
            <Field label="Nombre">
              <input className={inputClassName} value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                placeholder="Nombre del servicio" />
            </Field>
            <Field label="Descripcion">
              <textarea className={`${inputClassName} min-h-24 resize-none`} value={draft.descripcion ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Precio (S/)">
                <input type="number" className={inputClassName} value={draft.precio}
                  onChange={(e) => setDraft((d) => ({ ...d, precio: Number(e.target.value) }))} />
              </Field>
              <Field label="Duracion (min)">
                <input type="number" className={inputClassName} value={draft.duracion_minutos}
                  onChange={(e) => setDraft((d) => ({ ...d, duracion_minutos: Number(e.target.value) }))} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Puntos otorgados">
                <input type="number" className={inputClassName} value={draft.puntos_otorgados}
                  onChange={(e) => setDraft((d) => ({ ...d, puntos_otorgados: Number(e.target.value) }))} />
              </Field>
              <Field label="Estado">
                <select className={inputClassName} value={draft.esta_activo ? "activo" : "inactivo"}
                  onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "activo" }))}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsConfirmOpen(true)}
              disabled={!draft.nombre}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40">
              {saving ? "Guardando..." : selectedId ? "Guardar cambios" : "Crear servicio"}
            </button>
            <button type="button" onClick={() => setDraft(selectedService ? toDraft(selectedService) : emptyDraft)}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100">
              Restablecer
            </button>
            {selectedId && (
              <button type="button" onClick={() => setIsDeleteOpen(true)}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50">
                Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Datos del servicio</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p className="flex items-center gap-2"><Clock3 size={15} />Tiempo aproximado del servicio</p>
            <p className="flex items-center gap-2"><DollarSign size={15} />Precio base del servicio</p>
            <p className="flex items-center gap-2"><Sparkles size={15} />Descripcion para mostrar al cliente</p>
            <p className="flex items-center gap-2"><ShieldCheck size={15} />Si esta visible o no</p>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo servicio"}
        description={selectedId ? "Se guardaran los cambios." : "Se creara un nuevo servicio."}
        confirmLabel={saving ? "Guardando..." : selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => { await saveService(); setIsConfirmOpen(false); }}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        title="Eliminar servicio"
        description="Esta accion no se puede deshacer."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => { await deleteService(); setIsDeleteOpen(false); }}
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

function toDraft(item: Service): ServiceDraft {
  return {
    nombre: item.nombre,
    descripcion: item.descripcion,
    precio: item.precio,
    duracion_minutos: item.duracion_minutos,
    puntos_otorgados: item.puntos_otorgados,
    esta_activo: item.esta_activo,
    categoria_servicio_id: item.categoria_servicio_id,
  };
}