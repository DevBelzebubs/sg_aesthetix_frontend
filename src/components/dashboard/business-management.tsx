"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, PencilLine, Plus, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";

type BusinessRecord = {
  id: string; name: string; link: string; category: string; status: "Activo" | "Inactivo";
};

const initialBusinesses: BusinessRecord[] = [
  { id: "barberia-central", name: "Barberia Central", link: "barberia-central", category: "Barberia", status: "Activo" },
  { id: "gentlemen-cut", name: "Gentlemen Cut", link: "gentlemen-cut", category: "Barberia", status: "Inactivo" },
];

const emptyDraft: BusinessRecord = { id: "", name: "", link: "", category: "Barberia", status: "Activo" };
const inputClassName = "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const pageSize = 10;
  const [page, setPage] = useState(1);

  const selectedBusiness = businesses.find((b) => b.id === selectedId);

  const totalPages = Math.ceil(businesses.length / pageSize);
  const paginatedBusinesses = businesses.slice((page - 1) * pageSize, page * pageSize);

  const handleCreate = () => { setSelectedId(null); setDraft(emptyDraft); setMode("create"); };
  const handleEdit = (business: BusinessRecord) => { setSelectedId(business.id); setDraft(business); setMode("edit"); };
  const handleBack = () => { setMode("list"); setSelectedId(null); setDraft(emptyDraft); };

  const handleSave = () => {
    if (!draft.name || !draft.link) return;
    if (mode === "create") {
      const next = { ...draft, id: slugify(draft.link) };
      setBusinesses((c) => [next, ...c]);
    } else if (mode === "edit" && selectedId) {
      setBusinesses((c) => c.map((b) => (b.id === selectedId ? { ...draft, id: selectedId } : b)));
    }
    setMode("list"); setSelectedId(null); setDraft(emptyDraft); setIsConfirmOpen(false);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    const next = businesses.filter((b) => b.id !== selectedId);
    setBusinesses(next);
    setMode("list"); setSelectedId(null); setDraft(emptyDraft);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-[var(--foreground)]">Negocios</p><p className="mt-1 text-sm text-[var(--text-muted)]">{businesses.length} negocio(s)</p></div>
          {mode === "list" ? (
            <button type="button" onClick={handleCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"><Plus size={16} /> Nuevo negocio</button>
          ) : (
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><ArrowLeft size={16} /> Volver al listado</button>
          )}
        </div>
      </div>

      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedBusinesses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16"><Building2 size={32} className="text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">No hay negocios registrados.</p></div>
          ) : (
            paginatedBusinesses.map((b) => (
              <article key={b.id} className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]"><Building2 size={20} /></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${b.status === "Activo" ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--warning)]/15 text-[var(--warning)]"}`}>{b.status}</span>
                </div>
                <div className="mt-3"><p className="text-base font-semibold text-[var(--foreground)]">{b.name}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{b.link}</p></div>
                <div className="mt-2"><span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">{b.category}</span></div>
                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button type="button" onClick={() => handleEdit(b)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"><PencilLine size={14} /> Editar</button>
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
          <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-[var(--background)] p-3"><Building2 size={20} className="text-[var(--foreground)]" /></div><div><p className="text-lg font-semibold text-[var(--foreground)]">{mode === "create" ? "Nuevo negocio" : "Editar negocio"}</p><p className="text-sm text-[var(--text-muted)]">{mode === "create" ? "Registra un nuevo negocio." : `Editando ${selectedBusiness?.name ?? ""}`}</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required><input className={inputClassName} value={draft.name} onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))} /></Field>
            <Field label="Enlace" required><input className={inputClassName} value={draft.link} onChange={(e) => setDraft((c) => ({ ...c, link: e.target.value }))} /></Field>
            <Field label="Rubro"><select className={inputClassName} value={draft.category} onChange={(e) => setDraft((c) => ({ ...c, category: e.target.value }))}><option>Barberia</option><option>Salon</option><option>Estetica</option></select></Field>
            <Field label="Estado"><select className={inputClassName} value={draft.status} onChange={(e) => setDraft((c) => ({ ...c, status: e.target.value as BusinessRecord["status"] }))}><option>Activo</option><option>Inactivo</option></select></Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!draft.name || !draft.link} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"><PencilLine size={16} />{mode === "create" ? "Crear negocio" : "Guardar cambios"}</button>
            {mode === "edit" && <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"><Trash2 size={16} /> Eliminar</button>}
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><X size={16} /> Cancelar</button>
          </div>
        </div>
      )}

      <ConfirmationModal open={isConfirmOpen} title={mode === "create" ? "Confirmar nuevo negocio" : "Confirmar cambios"} description={mode === "create" ? "Se creara un nuevo negocio." : "Se guardaran los cambios."} confirmLabel={mode === "create" ? "Si, crear" : "Si, guardar"} onClose={() => setIsConfirmOpen(false)} onConfirm={handleSave} />
      <ConfirmationModal open={isDeleteConfirmOpen} title="Confirmar eliminacion" description="Este negocio se eliminara de la lista." confirmLabel="Si, eliminar" onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleDelete} />
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}</label>;
}

function slugify(value: string) { return value.toLowerCase().trim().replace(/\s+/g, "-"); }
