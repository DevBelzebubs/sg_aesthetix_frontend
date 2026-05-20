"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, PencilLine, Plus, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { ConfiguracionService } from "@/services/configuracion.service";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { RecompensasService } from "@/services/recompensas.service";
import type { Customer } from "@/types/customer";
import type { CanjePuntos, RecompensaPuntos } from "@/types/redemption";

type RewardDraft = {
  nombre: string;
  tipo_recompensa: string;
  puntos_requeridos: number;
  descripcion: string;
  esta_activo: boolean;
};

const emptyDraft: RewardDraft = {
  nombre: "",
  tipo_recompensa: "servicio",
  puntos_requeridos: 100,
  descripcion: "",
  esta_activo: true,
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function LoyaltyManagement() {
  const [recompensas, setRecompensas] = useState<RecompensaPuntos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<RewardDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const fetchRecompensas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await RecompensasService.getAll();
      setRecompensas(data);
      if (data.length > 0 && !data.some((r) => r.id === selectedId)) {
        setSelectedId(data[0].id);
        setDraft({
          nombre: data[0].nombre,
          tipo_recompensa: data[0].tipoRecompensa,
          puntos_requeridos: data[0].puntosRequeridos,
          descripcion: data[0].descripcion ?? "",
          esta_activo: data[0].estaActivo,
        });
      }
      if (data.length === 0) {
        setSelectedId("");
        setDraft(emptyDraft);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar beneficios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecompensas();
  }, [fetchRecompensas]);

  const selectedRecompensa = recompensas.find((r) => r.id === selectedId);

  const handleSelect = (r: RecompensaPuntos) => {
    setSelectedId(r.id);
    setDraft({
      nombre: r.nombre,
      tipo_recompensa: r.tipoRecompensa,
      puntos_requeridos: r.puntosRequeridos,
      descripcion: r.descripcion ?? "",
      esta_activo: r.estaActivo,
    });
  };

  const handleCreateMode = () => {
    setSelectedId("");
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.nombre || draft.puntos_requeridos < 1) return;
    try {
      if (selectedId) {
        await RecompensasService.update(selectedId, {
          nombre: draft.nombre,
          tipoRecompensa: draft.tipo_recompensa,
          puntosRequeridos: draft.puntos_requeridos,
          descripcion: draft.descripcion,
          estaActivo: draft.esta_activo,
        });
      } else {
        await RecompensasService.create({
          tipoRecompensa: draft.tipo_recompensa,
          nombre: draft.nombre,
          descripcion: draft.descripcion || undefined,
          puntosRequeridos: draft.puntos_requeridos,
          cantidadEntregada: 1,
        });
      }
      await fetchRecompensas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await RecompensasService.remove(selectedId);
      await fetchRecompensas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
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
    ConfiguracionService.get()
      .then((config) => {
        if (config) setPromocionActiva(config.promocionActiva);
      })
      .catch(() => setErrorPromo("Error al cargar configuración"))
      .finally(() => setLoadingConfig(false));

    CustomersService.getPendingPromociones()
      .then(setPendingRegistros)
      .catch(() => {})
      .finally(() => setLoadingRegistros(false));

    RecompensasService.getCanjesPendientes()
      .then((canjes) => {
        const enriched = canjes.map((c) => {
          const clienteNombre = c.cliente?.nombres ?? "—";
          return { ...c, clienteNombre };
        });
        setPendingCanjes(enriched);
      })
      .catch(() => {})
      .finally(() => setLoadingCanjes(false));
  }, []);

  const refreshRegistros = () => {
    CustomersService.getPendingPromociones()
      .then(setPendingRegistros)
      .catch(() => {});
  };

  const handleTogglePromocion = async () => {
    const nuevo = !promocionActiva;
    setToggling(true);
    setErrorPromo("");
    setPromocionActiva(nuevo);
    try {
      await ConfiguracionService.update({ promocionActiva: nuevo });
    } catch (err) {
      setPromocionActiva(!nuevo);
      setErrorPromo(
        err instanceof Error ? err.message : "Error al actualizar. ¿Agregaste la columna promocion_activa en Supabase?"
      );
    } finally {
      setToggling(false);
    }
  };

  const handleApprove = async (clienteId: string) => {
    try {
      await CustomersService.approvePromocion(clienteId);
      await RewardsService.claimWelcomeReward(clienteId);
      refreshRegistros();
    } catch (err) {
      console.error("Error al aprobar:", err);
    }
  };

  const handleReject = async (clienteId: string) => {
    try {
      await CustomersService.rejectPromocion(clienteId);
      refreshRegistros();
    } catch (err) {
      console.error("Error al rechazar:", err);
    }
  };

  return (
    <>
      <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-zinc-100 p-3">
              <QrCode size={18} className="text-zinc-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Promoción vía QR</p>
              <p className="text-sm text-zinc-600">
                {promocionActiva
                  ? "El QR está activo. Los clientes pueden registrar y recibir puntos."
                  : "El QR está desactivado. La página /promocion no mostrará el formulario."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePromocion}
            disabled={loadingConfig || toggling}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              promocionActiva ? "bg-emerald-500" : "bg-zinc-300"
            } ${loadingConfig || toggling ? "opacity-50" : ""}`}
            role="switch"
            aria-checked={promocionActiva}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                promocionActiva ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {errorPromo && (
          <p className="mt-3 text-xs font-medium text-red-600">{errorPromo}</p>
        )}
      </div>

      {/* Lista de registros pendientes */}
      {promocionActiva && (
        <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Registros pendientes</p>
              <p className="text-sm text-zinc-600">
                {loadingRegistros
                  ? "Cargando..."
                  : `${pendingRegistros.length} cliente(s) esperando aprobación`}
              </p>
            </div>
          </div>

          {loadingRegistros ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-pulse rounded-full bg-zinc-300" />
            </div>
          ) : pendingRegistros.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              No hay registros pendientes.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {pendingRegistros.map((cliente) => (
                <div key={cliente.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">{cliente.nombres}</p>
                    <p className="text-xs text-zinc-500">
                      DNI: {cliente.dni ?? "---"} · Tel: {cliente.telefono ?? "---"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(cliente.id)}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(cliente.id)}
                      className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Canjes pendientes */}
      <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Canjes pendientes</p>
            <p className="text-sm text-zinc-600">
              {loadingCanjes
                ? "Cargando..."
                : `${pendingCanjes.length} canje(s) esperando aprobación`}
            </p>
          </div>
        </div>

        {loadingCanjes ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-pulse rounded-full bg-zinc-300" />
          </div>
        ) : pendingCanjes.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No hay canjes pendientes.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {pendingCanjes.map((canje) => (
              <div key={canje.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    {canje.clienteNombre}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {canje.recompensa?.nombre ?? "—"} · {canje.puntosCanjeados} pts
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await RecompensasService.aprobarCanje(canje.id);
                        setPendingCanjes((prev) => prev.filter((c) => c.id !== canje.id));
                      } catch (err) {
                        console.error("Error al aprobar canje:", err);
                      }
                    }}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await RecompensasService.rechazarCanje(canje.id);
                        setPendingCanjes((prev) => prev.filter((c) => c.id !== canje.id));
                      } catch (err) {
                        console.error("Error al rechazar canje:", err);
                      }
                    }}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Beneficios / Recompensas */}
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.95fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Beneficios</p>
              <p className="text-sm text-zinc-600">
                {loading ? "Cargando..." : `${recompensas.length} beneficio(s) registrado(s)`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateMode}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={16} />
              Nuevo beneficio
            </button>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {loading && recompensas.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-zinc-500">Cargando beneficios...</div>
          ) : recompensas.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-zinc-500">No hay beneficios registrados.</div>
          ) : (
            <div className="grid gap-4">
              {recompensas.map((r) => (
                <article
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition ${
                    selectedId === r.id
                      ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50"
                      : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-zinc-900">{r.nombre}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {r.puntosRequeridos} pts · {r.tipoRecompensa}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.estaActivo ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"}`}>
                      {r.estaActivo ? "Activa" : "Pausada"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Puntos requeridos</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">{r.puntosRequeridos} pts</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Nota</p>
                      <p className="mt-2 text-sm text-zinc-700">{r.descripcion || "—"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-zinc-100 p-3">
                <Gift size={18} className="text-zinc-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {selectedId ? "Editar beneficio" : "Crear beneficio"}
                </p>
                <p className="text-sm text-zinc-600">Define que puede canjear el cliente con sus puntos.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="Nombre">
                <input
                  className={inputClassName}
                  value={draft.nombre}
                  onChange={(e) => setDraft((c) => ({ ...c, nombre: e.target.value }))}
                />
              </Field>
              <Field label="Tipo">
                <select
                  className={inputClassName}
                  value={draft.tipo_recompensa}
                  onChange={(e) => setDraft((c) => ({ ...c, tipo_recompensa: e.target.value }))}
                >
                  <option value="servicio">Servicio</option>
                  <option value="producto">Producto</option>
                  <option value="descuento">Descuento</option>
                  <option value="general">General</option>
                </select>
              </Field>
              <Field label="Puntos requeridos">
                <input
                  type="number"
                  min={1}
                  className={inputClassName}
                  value={draft.puntos_requeridos}
                  onChange={(e) => setDraft((c) => ({ ...c, puntos_requeridos: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Estado">
                <select
                  className={inputClassName}
                  value={draft.esta_activo ? "Activa" : "Pausada"}
                  onChange={(e) => setDraft((c) => ({ ...c, esta_activo: e.target.value === "Activa" }))}
                >
                  <option>Activa</option>
                  <option>Pausada</option>
                </select>
              </Field>
              <Field label="Descripción">
                <textarea
                  className={`${inputClassName} min-h-28 resize-none`}
                  value={draft.descripcion}
                  onChange={(e) => setDraft((c) => ({ ...c, descripcion: e.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={!draft.nombre || draft.puntos_requeridos < 1}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PencilLine size={16} />
                {selectedId ? "Guardar beneficio" : "Crear beneficio"}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={!selectedRecompensa}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        </aside>

        <ConfirmationModal
          open={isConfirmOpen}
          title={selectedId ? "Confirmar cambios" : "Confirmar nuevo beneficio"}
          description={
            selectedId
              ? "Se guardaran los cambios hechos en este beneficio."
              : "Se creara un nuevo beneficio con los datos que llenaste."
          }
          confirmLabel={selectedId ? "Si, guardar" : "Si, crear"}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            handleSave();
            setIsConfirmOpen(false);
          }}
        />

        <ConfirmationModal
          open={isDeleteConfirmOpen}
          title="Confirmar eliminacion"
          description="Este beneficio se eliminara permanentemente."
          confirmLabel="Si, eliminar"
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => {
            handleDelete();
            setIsDeleteConfirmOpen(false);
          }}
        />
      </div>
    </>
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
