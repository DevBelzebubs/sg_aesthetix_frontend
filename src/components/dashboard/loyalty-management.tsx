"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Gift, PencilLine, Plus, QrCode, Star, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { ConfiguracionService } from "@/services/configuracion.service";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { RecompensasService } from "@/services/recompensas.service";
import type { Customer } from "@/types/customer";
import type { CanjePuntos, RecompensaPuntos } from "@/types/redemption";

type RewardDraft = {
  nombre: string; tipo_recompensa: string; puntos_requeridos: number;
  descripcion: string; esta_activo: boolean;
};

const emptyDraft: RewardDraft = { nombre: "", tipo_recompensa: "servicio", puntos_requeridos: 100, descripcion: "", esta_activo: true };
const inputClassName = "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = { totalBeneficios: number; totalActivas: number; canjesPendientes: number; };

export function LoyaltyManagement({ totalBeneficios, totalActivas, canjesPendientes }: Props) {
  const [recompensas, setRecompensas] = useState<RecompensaPuntos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RewardDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const pageSize = 10;
  const [page, setPage] = useState(1);

  const fetchRecompensas = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await RecompensasService.getAll();
      setRecompensas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar beneficios");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecompensas(); }, [fetchRecompensas]);

  const selectedRecompensa = recompensas.find((r) => r.id === selectedId);

  const totalPages = Math.ceil(recompensas.length / pageSize);
  const paginatedRecompensas = recompensas.slice((page - 1) * pageSize, page * pageSize);

  const handleCreate = () => { setSelectedId(null); setDraft(emptyDraft); setMode("create"); };
  const handleEdit = (r: RecompensaPuntos) => {
    setSelectedId(r.id);
    setDraft({ nombre: r.nombre, tipo_recompensa: r.tipoRecompensa, puntos_requeridos: r.puntosRequeridos, descripcion: r.descripcion ?? "", esta_activo: r.estaActivo });
    setMode("edit");
  };
  const handleBack = () => { setMode("list"); setSelectedId(null); setDraft(emptyDraft); };

  const handleSave = async () => {
    if (!draft.nombre || draft.puntos_requeridos < 1) return;
    try {
      if (mode === "edit" && selectedId) {
        await RecompensasService.update(selectedId, { nombre: draft.nombre, tipoRecompensa: draft.tipo_recompensa, puntosRequeridos: draft.puntos_requeridos, descripcion: draft.descripcion, estaActivo: draft.esta_activo });
      } else {
        await RecompensasService.create({ tipoRecompensa: draft.tipo_recompensa, nombre: draft.nombre, descripcion: draft.descripcion || undefined, puntosRequeridos: draft.puntos_requeridos, cantidadEntregada: 1 });
      }
      await fetchRecompensas();
      setMode("list"); setSelectedId(null); setDraft(emptyDraft);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al guardar"); }
    setIsConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try { await RecompensasService.remove(selectedId); await fetchRecompensas(); setMode("list"); setSelectedId(null); setDraft(emptyDraft); } catch (err) { setError(err instanceof Error ? err.message : "Error al eliminar"); }
    setIsDeleteConfirmOpen(false);
  };

  const [promocionActiva, setPromocionActiva] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [errorPromo, setErrorPromo] = useState("");
  const [pendingRegistros, setPendingRegistros] = useState<Customer[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [pendingCanjes, setPendingCanjes] = useState<(CanjePuntos & { clienteNombre?: string })[]>([]);
  const [loadingCanjes, setLoadingCanjes] = useState(true);

  useEffect(() => {
    ConfiguracionService.get().then((config) => { if (config) setPromocionActiva(config.promocionActiva); }).catch(() => setErrorPromo("Error al cargar configuracion")).finally(() => setLoadingConfig(false));
    CustomersService.getPendingPromociones().then(setPendingRegistros).catch(() => {}).finally(() => setLoadingRegistros(false));
    RecompensasService.getCanjesPendientes().then((canjes) => {
      setPendingCanjes(canjes.map((c) => ({ ...c, clienteNombre: c.cliente?.nombres ?? "—" })));
    }).catch(() => {}).finally(() => setLoadingCanjes(false));
  }, []);

  const refreshRegistros = () => { CustomersService.getPendingPromociones().then(setPendingRegistros).catch(() => {}); };

  const handleTogglePromocion = async () => {
    const nuevo = !promocionActiva; setToggling(true); setErrorPromo(""); setPromocionActiva(nuevo);
    try { await ConfiguracionService.update({ promocionActiva: nuevo }); } catch (err) {
      setPromocionActiva(!nuevo); setErrorPromo(err instanceof Error ? err.message : "Error al actualizar.");
    } finally { setToggling(false); }
  };

  const handleApprove = async (clienteId: string) => { try { await CustomersService.approvePromocion(clienteId); await RewardsService.claimWelcomeReward(clienteId); refreshRegistros(); } catch (err) { console.error(err); } };
  const handleReject = async (clienteId: string) => { try { await CustomersService.rejectPromocion(clienteId); refreshRegistros(); } catch (err) { console.error(err); } };

  return (
    <>
      {/* KPIs */}
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total beneficios</p>
            <div className="mt-2 flex items-center gap-2"><Gift size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalBeneficios}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Activas</p>
            <div className="mt-2 flex items-center gap-2"><Star size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalActivas}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Canjes pendientes</p>
            <div className="mt-2 flex items-center gap-2"><QrCode size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{canjesPendientes}</p></div>
          </article>
        </div>
      )}

      {/* Promocion QR */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3"><QrCode size={18} className="text-[var(--foreground)]" /></div>
            <div><p className="text-sm font-semibold text-[var(--foreground)]">Promocion via QR</p><p className="text-sm text-[var(--text-muted)]">{promocionActiva ? "El QR esta activo." : "El QR esta desactivado."}</p></div>
          </div>
          <button type="button" onClick={handleTogglePromocion} disabled={loadingConfig || toggling} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${promocionActiva ? "bg-[var(--hover)]" : "bg-[var(--text-muted)]"} ${loadingConfig || toggling ? "opacity-50" : ""}`} role="switch">
            <span className={`inline-block h-5 w-5 transform rounded-full bg-[var(--background-secondary)] shadow-sm transition-transform ${promocionActiva ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {errorPromo && <p className="mt-3 text-xs font-medium text-[var(--destructive)]">{errorPromo}</p>}
      </div>

      {/* Registros pendientes */}
      {promocionActiva && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[var(--foreground)]">Registros pendientes</p><p className="text-sm text-[var(--text-muted)]">{loadingRegistros ? "Cargando..." : `${pendingRegistros.length} cliente(s)`}</p></div></div>
          {loadingRegistros ? <div className="flex justify-center py-8"><div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" /></div> :
           pendingRegistros.length === 0 ? <p className="py-6 text-center text-sm text-[var(--text-muted)]">No hay registros pendientes.</p> :
           <div className="divide-y divide-transparent/5">{pendingRegistros.map((c) => (
             <div key={c.id} className="flex items-center justify-between gap-4 py-3">
               <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--foreground)]">{c.nombres}</p><p className="text-xs text-[var(--text-muted)]">DNI: {c.dni ?? "---"} · Tel: {c.telefono ?? "---"}</p></div>
               <div className="flex shrink-0 gap-2">
                 <button onClick={() => handleApprove(c.id)} className="rounded-full bg-[var(--hover)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">Aprobar</button>
                 <button onClick={() => handleReject(c.id)} className="rounded-full border border-[var(--destructive-border)] px-4 py-1.5 text-xs font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]">Rechazar</button>
               </div>
             </div>
           ))}</div>}
        </div>
      )}

      {/* Canjes pendientes */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[var(--foreground)]">Canjes pendientes</p><p className="text-sm text-[var(--text-muted)]">{loadingCanjes ? "Cargando..." : `${pendingCanjes.length} canje(s)`}</p></div></div>
        {loadingCanjes ? <div className="flex justify-center py-8"><div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" /></div> :
         pendingCanjes.length === 0 ? <p className="py-6 text-center text-sm text-[var(--text-muted)]">No hay canjes pendientes.</p> :
         <div className="divide-y divide-transparent/5">{pendingCanjes.map((c) => (
           <div key={c.id} className="flex items-center justify-between gap-4 py-3">
             <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--foreground)]">{c.clienteNombre}</p><p className="text-xs text-[var(--text-muted)]">{c.recompensa?.nombre ?? "—"} · {c.puntosCanjeados} pts</p></div>
             <div className="flex shrink-0 gap-2">
               <button onClick={async () => { try { await RecompensasService.aprobarCanje(c.id); setPendingCanjes((p) => p.filter((x) => x.id !== c.id)); } catch (err) { console.error(err); } }} className="rounded-full bg-[var(--hover)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">Aprobar</button>
               <button onClick={async () => { try { await RecompensasService.rechazarCanje(c.id); setPendingCanjes((p) => p.filter((x) => x.id !== c.id)); } catch (err) { console.error(err); } }} className="rounded-full border border-[var(--destructive-border)] px-4 py-1.5 text-xs font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]">Rechazar</button>
             </div>
           </div>
         ))}</div>}
      </div>

      {/* Beneficios */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-[var(--foreground)]">Beneficios</p><p className="mt-1 text-sm text-[var(--text-muted)]">{loading ? "Cargando..." : `${recompensas.length} beneficio(s)`}</p></div>
          {mode === "list" ? (
            <button type="button" onClick={handleCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"><Plus size={16} /> Nuevo beneficio</button>
          ) : (
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><ArrowLeft size={16} /> Volver al listado</button>
          )}
        </div>
      </div>

      {error && <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-4 text-sm text-[var(--destructive)]">{error}</div>}

      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading && recompensas.length === 0 ? <div className="col-span-full py-16 text-center text-sm text-[var(--text-muted)]">Cargando beneficios...</div> :
           paginatedRecompensas.length === 0 ? <div className="col-span-full flex flex-col items-center gap-3 py-16"><Gift size={32} className="text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">No hay beneficios. Crea el primero.</p></div> :
           paginatedRecompensas.map((r) => (
            <article key={r.id} className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]"><Gift size={20} /></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.estaActivo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{r.estaActivo ? "Activa" : "Pausada"}</span>
              </div>
              <div className="mt-3"><p className="text-base font-semibold text-[var(--foreground)]">{r.nombre}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{r.puntosRequeridos} pts · {r.tipoRecompensa}</p></div>
              {r.descripcion && <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2">{r.descripcion}</p>}
              <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => handleEdit(r)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"><PencilLine size={14} /> Editar</button>
              </div>
            </article>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-[var(--background)] p-3"><Gift size={20} className="text-[var(--foreground)]" /></div><div><p className="text-lg font-semibold text-[var(--foreground)]">{mode === "create" ? "Nuevo beneficio" : "Editar beneficio"}</p><p className="text-sm text-[var(--text-muted)]">Define que puede canjear el cliente con sus puntos.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="col-span-full"><Field label="Nombre" required><input className={inputClassName} value={draft.nombre} onChange={(e) => setDraft((c) => ({ ...c, nombre: e.target.value }))} /></Field></div>
            <Field label="Tipo"><select className={inputClassName} value={draft.tipo_recompensa} onChange={(e) => setDraft((c) => ({ ...c, tipo_recompensa: e.target.value }))}><option value="servicio">Servicio</option><option value="producto">Producto</option><option value="descuento">Descuento</option><option value="general">General</option></select></Field>
            <Field label="Puntos requeridos"><input type="number" min={1} className={inputClassName} value={draft.puntos_requeridos} onChange={(e) => setDraft((c) => ({ ...c, puntos_requeridos: Number(e.target.value) }))} /></Field>
            <Field label="Estado"><select className={inputClassName} value={draft.esta_activo ? "Activa" : "Pausada"} onChange={(e) => setDraft((c) => ({ ...c, esta_activo: e.target.value === "Activa" }))}><option>Activa</option><option>Pausada</option></select></Field>
            <div className="col-span-full"><Field label="Descripcion"><textarea className={`${inputClassName} min-h-28 resize-none`} value={draft.descripcion} onChange={(e) => setDraft((c) => ({ ...c, descripcion: e.target.value }))} /></Field></div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!draft.nombre || draft.puntos_requeridos < 1} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"><PencilLine size={16} />{mode === "create" ? "Crear beneficio" : "Guardar beneficio"}</button>
            {mode === "edit" && <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} disabled={!selectedRecompensa} className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)] disabled:opacity-50"><Trash2 size={16} /> Eliminar</button>}
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><X size={16} /> Cancelar</button>
          </div>
        </div>
      )}

      <ConfirmationModal open={isConfirmOpen} title={mode === "create" ? "Confirmar nuevo beneficio" : "Confirmar cambios"} description={mode === "create" ? "Se creara un nuevo beneficio." : "Se guardaran los cambios."} confirmLabel={mode === "create" ? "Si, crear" : "Si, guardar"} onClose={() => setIsConfirmOpen(false)} onConfirm={handleSave} />
      <ConfirmationModal open={isDeleteConfirmOpen} title="Confirmar eliminacion" description="Este beneficio se eliminara permanentemente." confirmLabel="Si, eliminar" onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleDelete} />
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}</label>;
}
