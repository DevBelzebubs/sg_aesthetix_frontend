"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, Check, DollarSign, FileText, Loader2, Minus, Plus,
  ReceiptText, Search, ShoppingCart, TrendingUp, Trash2, UserPlus, X,
} from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { Toast } from "@/components/dashboard/toast";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { hashPin } from "@/lib/pin";
import { sendNewClientPinEmail } from "@/lib/email-client";
import { RewardsService } from "@/services/rewards.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Sale = {
  id: string;
  cliente_id: string | null;
  usuario_id: string;
  tipo_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: string | null;
  puntos_ganados: number;
  estado: string;
  observaciones: string | null;
  creado_en: string;
  clientes: { nombres: string; apellidos: string } | null;
};

type SaleLineItem = {
  id: string;
  type: "producto" | "servicio";
  nombre: string;
  precio: number;
  puntos_otorgados: number;
  cantidad: number;
  stockDisponible?: number;
};

type SaleDraft = {
  cliente_id: string;
  items: SaleLineItem[];
  metodo_pago: string;
  descuento: number;
  observaciones: string;
};

type ProductOption = {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
  puntos_otorgados: number;
};

type ServiceOption = {
  id: string;
  nombre: string;
  precio: number;
  puntos_otorgados: number;
};

type ClientOption = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

const emptyDraft: SaleDraft = {
  cliente_id: "",
  items: [],
  metodo_pago: "efectivo",
  descuento: 0,
  observaciones: "",
};

const pageSize = 10;

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

const dropdownItemClass =
  "flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition hover:bg-[var(--hover)]/10 first:rounded-t-2xl last:rounded-b-2xl";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusClass(estado: string) {
  if (estado === "pagada") return "bg-[var(--hover)]/15 text-[var(--hover)]";
  if (estado === "anulada") return "bg-[var(--destructive)]/15 text-[var(--destructive)]";
  return "bg-[var(--background-secondary)] text-[var(--text-muted)]";
}

function getStatusLabel(estado: string) {
  if (estado === "pagada") return "Pagada";
  if (estado === "anulada") return "Anulada";
  return "Pendiente";
}

function formatMetodoPago(metodo: string | null) {
  if (!metodo) return "—";
  return metodo.charAt(0).toUpperCase() + metodo.slice(1);
}

function formatTipoVenta(tipo: string) {
  if (tipo === "servicio") return "Servicio";
  if (tipo === "producto") return "Producto";
  if (tipo === "mixta") return "Mixta";
  return tipo;
}

function getTipoVentaClass(tipo: string) {
  if (tipo === "servicio") return "bg-blue-500/15 text-blue-600";
  if (tipo === "producto") return "bg-amber-500/15 text-amber-600";
  return "bg-violet-500/15 text-violet-600";
}

function formatCurrency(n: number) {
  return n.toFixed(2);
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-[var(--foreground)]">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  totalVentas: number;
  totalDia: number;
  ingresoTotal: number;
};

// ---------------------------------------------------------------------------
// Autocomplete component
// ---------------------------------------------------------------------------

function Autocomplete({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  open,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onBlur();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open, onBlur]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        />
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] pl-11 pr-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
        />
      </div>
      {open && children && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rightbar - Client selector / creator
// ---------------------------------------------------------------------------

function ClientRightbar({
  open,
  onClose,
  clientes,
  selectedId,
  onSelect,
  onCreate,
  onUseAppointment,
}: {
  open: boolean;
  onClose: () => void;
  clientes: ClientOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (cliente: { id: string; nombres: string; apellidos: string; dni: string | null }) => void;
  onUseAppointment: (servicioId: string) => void;
}) {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newClient, setNewClient] = useState({ nombres: "", apellidos: "", dni: "", telefono: "", email: "", fechaNacimiento: "", pin: "", confirmPin: "", esFrecuente: false });
  const [appointments, setAppointments] = useState<{ id: string; fecha_reserva: string; hora_inicio: string; servicio_nombre: string; empleado_nombre: string; estado: string; servicio_id: string }[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    if (open) { setSearch(""); setShowCreate(false); setSaving(false); setNewClient({ nombres: "", apellidos: "", dni: "", telefono: "", email: "", fechaNacimiento: "", pin: "", confirmPin: "", esFrecuente: false }); }
  }, [open]);

  useEffect(() => {
    if (!selectedId) { setAppointments([]); return; }
    setLoadingApps(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("reservas")
          .select(`
            id, fecha_reserva, hora_inicio, estado, servicio_id,
            servicios!servicio_id (nombre),
            usuarios!usuario_id (nombres, apellidos)
          `)
          .eq("cliente_id", selectedId)
          .order("fecha_reserva", { ascending: false })
          .limit(5);
        setAppointments((data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          fecha_reserva: r.fecha_reserva as string,
          hora_inicio: r.hora_inicio as string,
          servicio_id: r.servicio_id as string,
          servicio_nombre: (r.servicios as { nombre: string } | null)?.nombre ?? "—",
          empleado_nombre: (r.usuarios as { nombres: string; apellidos: string } | null)
            ? `${((r.usuarios as { nombres: string; apellidos: string }).nombres)} ${((r.usuarios as { nombres: string; apellidos: string }).apellidos)}`.trim()
            : "—",
          estado: r.estado as string,
        })));
      } catch {} finally { setLoadingApps(false); }
    })();
  }, [selectedId, supabase]);

  const filtered = useMemo(() => {
    if (!search) return clientes.slice(0, 15);
    const q = search.toLowerCase();
    return clientes.filter((c) =>
      c.nombres.toLowerCase().includes(q) ||
      c.apellidos.toLowerCase().includes(q) ||
      (c.dni && c.dni.includes(q))
    ).slice(0, 15);
  }, [search, clientes]);

  const selected = clientes.find((c) => c.id === selectedId);

  async function handleCreate() {
    if (!newClient.nombres) return;
    if (newClient.pin !== newClient.confirmPin) return;
    setSaving(true);
    const generatedPin = newClient.pin || String(Math.floor(100000 + Math.random() * 900000));
    const { hash, salt } = await hashPin(generatedPin);
    const payload: Record<string, unknown> = {
      nombres: newClient.nombres,
      apellidos: newClient.apellidos,
      dni: newClient.dni || null,
      telefono: newClient.telefono || null,
      correo_electronico: newClient.email || null,
      fecha_nacimiento: newClient.fechaNacimiento || null,
      esta_activo: true,
      pin_hash: hash,
      pin_salt: salt,
      es_frecuente: newClient.esFrecuente,
    };
    const { data, error } = await supabase.from("clientes").insert(payload).select().single();
    setSaving(false);
    if (error) return;
    const c = data as Record<string, unknown>;
    if (newClient.email) {
      await sendNewClientPinEmail(newClient.email, newClient.nombres, generatedPin);
    }
    onCreate({
      id: c.id as string,
      nombres: c.nombres as string,
      apellidos: (c.apellidos as string) || "",
      dni: (c.dni as string) || null,
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--background-secondary)] h-full overflow-y-auto shadow-2xl animate-[slideIn_0.2s_ease-out]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4">
          <p className="text-base font-semibold text-[var(--foreground)]">
            {showCreate ? "Nuevo cliente" : "Seleccionar cliente"}
          </p>
          <button onClick={onClose} className="rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {showCreate ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <Field label="Nombres" required>
                  <input className={inputClassName} value={newClient.nombres} onChange={(e) => setNewClient((c) => ({ ...c, nombres: e.target.value }))} placeholder="Ej. Juan" />
                </Field>
                <Field label="Apellidos" required>
                  <input className={inputClassName} value={newClient.apellidos} onChange={(e) => setNewClient((c) => ({ ...c, apellidos: e.target.value }))} placeholder="Ej. Pérez" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Field label="DNI" required>
                  <input className={inputClassName} value={newClient.dni} onChange={(e) => setNewClient((c) => ({ ...c, dni: e.target.value.replace(/\D/g, "").slice(0, 8) }))} placeholder="12345678" inputMode="numeric" />
                </Field>
                <Field label="Teléfono" required>
                  <input className={inputClassName} value={newClient.telefono} onChange={(e) => setNewClient((c) => ({ ...c, telefono: e.target.value.replace(/\D/g, "").slice(0, 9) }))} placeholder="987654321" inputMode="numeric" />
                </Field>
              </div>
              <Field label="Email" required>
                <input className={inputClassName} value={newClient.email} onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))} placeholder="correo@gmail.com" type="email" />
              </Field>
              <Field label="Fecha de nacimiento" required>
                <input type="date" className={inputClassName} value={newClient.fechaNacimiento} onChange={(e) => setNewClient((c) => ({ ...c, fechaNacimiento: e.target.value }))} />
              </Field>
              <div className="grid grid-cols-2 gap-6">
                <Field label="PIN (6 dígitos)">
                  <input className={inputClassName} value={newClient.pin} onChange={(e) => setNewClient((c) => ({ ...c, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Dejar vacío para auto-generar" inputMode="numeric" />
                </Field>
                <Field label="Confirmar PIN">
                  <input className={`${inputClassName} ${newClient.confirmPin && newClient.pin !== newClient.confirmPin ? "border-red-400" : ""}`} value={newClient.confirmPin} onChange={(e) => setNewClient((c) => ({ ...c, confirmPin: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Repetir PIN" inputMode="numeric" />
                </Field>
              </div>
              {newClient.confirmPin && newClient.pin !== newClient.confirmPin && (
                <p className="flex items-center gap-1 text-[11px] text-red-500"><AlertCircle size={11} /> Los PIN no coinciden</p>
              )}

              <div className="flex gap-4">
                <button onClick={() => setShowCreate(false)} className="flex-1 rounded-full border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-[var(--background-secondary)]">Cancelar</button>
                <button onClick={handleCreate} disabled={!newClient.nombres || !newClient.apellidos || !newClient.dni || !newClient.telefono || !newClient.email || !newClient.fechaNacimiento || (newClient.pin !== newClient.confirmPin) || saving} className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Crear cliente"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] pl-11 pr-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                />
              </div>

              <button
                onClick={() => setShowCreate(true)}
                className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--foreground)]"
              >
                <UserPlus size={18} className="text-[var(--hover)]" />
                Crear nuevo cliente
              </button>

              {/* Cliente frecuente toggle */}
              <button
                type="button"
                onClick={() => setNewClient((c) => ({ ...c, esFrecuente: !c.esFrecuente }))}
                className={`mb-3 flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${
                  newClient.esFrecuente
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--hover)]"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  newClient.esFrecuente ? "bg-emerald-500 text-white" : "bg-[var(--background)] text-[var(--text-muted)]"
                }`}>
                  <UserPlus size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${newClient.esFrecuente ? "text-emerald-700" : "text-[var(--foreground)]"}`}>
                    Cliente frecuente
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">El cliente podrá iniciar sesión con su PIN y acceder a promociones.</p>
                </div>
                {newClient.esFrecuente && <Check size={20} className="text-emerald-500 shrink-0" />}
              </button>

              {selected && (
                <div className="mb-3 rounded-2xl border border-[var(--hover)]/30 bg-[var(--hover)]/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">Seleccionado</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--hover)]/20">
                      <span className="text-sm font-bold text-[var(--hover)]">{selected.nombres.charAt(0)}{selected.apellidos.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{selected.nombres} {selected.apellidos}</p>
                      {selected.dni && <p className="text-xs text-[var(--text-muted)]">DNI: {selected.dni}</p>}
                    </div>
                  </div>
                  <button onClick={() => onSelect("")} className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--destructive)]">Quitar selección</button>

                  {loadingApps ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]"><Loader2 size={12} className="animate-spin" /> Cargando citas...</div>
                  ) : appointments.length > 0 ? (
                    <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Citas ({appointments.length})</p>
                      {appointments.map((app) => (
                        <div key={app.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--background)] px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[var(--foreground)] truncate">{app.servicio_nombre}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{app.fecha_reserva} · {app.hora_inicio.slice(0, 5)} · {app.empleado_nombre}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${app.estado.toLowerCase() === "completada" ? "bg-emerald-500/15 text-emerald-500" : app.estado.toLowerCase() === "pendiente" ? "bg-amber-500/15 text-amber-500" : "bg-[var(--hover)]/15 text-[var(--hover)]"}`}>{app.estado}</span>
                            {app.estado.toLowerCase() === "pendiente" && (
                              <button
                                type="button"
                                onClick={() => { onUseAppointment(app.servicio_id); onClose(); }}
                                className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-600"
                              >
                                Usar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {search && (
                <div className="space-y-1">
                  <button
                    onClick={() => { onClose(); }}
                    className={`${dropdownItemClass} w-full text-left`}
                  >
                    <X size={16} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-sm text-[var(--text-muted)]">Cliente ocasional</span>
                  </button>
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { onSelect(c.id); onClose(); }}
                      className={`${dropdownItemClass} w-full text-left ${c.id === selectedId ? "bg-[var(--hover)]/10" : ""}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--hover)]/10 shrink-0">
                        <span className="text-sm font-bold text-[var(--hover)]">{c.nombres.charAt(0)}{c.apellidos.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">{c.nombres} {c.apellidos}</p>
                        {c.dni && <p className="text-xs text-[var(--text-muted)]">DNI: {c.dni}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SalesManagement({ totalVentas, totalDia, ingresoTotal }: Props) {
  const supabase = createClient();

  // ---- list state ----
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // ---- create state ----
  const [mode, setMode] = useState<"list" | "create">("list");
  const [draft, setDraft] = useState<SaleDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    open: boolean;
  }>({ message: "", type: "success", open: false });

  // ---- select data ----
  const [productos, setProductos] = useState<ProductOption[]>([]);
  const [servicios, setServicios] = useState<ServiceOption[]>([]);
  const [clientes, setClientes] = useState<ClientOption[]>([]);

  // ---- autocomplete state ----
  const [productSearch, setProductSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [productQty, setProductQty] = useState(1);

  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);

  const [rightbarOpen, setRightbarOpen] = useState(false);

  // ---- discount string state (fixes "010" bug) ----
  const [descuentoText, setDescuentoText] = useState("");

  // ---- edit observations ----
  const [editingObs, setEditingObs] = useState<string | null>(null);
  const [editObsText, setEditObsText] = useState("");

  // ---- current user ----
  const { userId } = useAuth();

  // ------------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------------

  useEffect(() => {
    fetchSales();
    fetchProductos();
    fetchServicios();
    fetchClientes();
  }, []);

  async function fetchSales() {
    setLoading(true);
    const { data } = await supabase
      .from("ventas")
      .select("*, clientes(nombres, apellidos)")
      .order("creado_en", { ascending: false });
    setSales((data as Sale[]) ?? []);
    setLoading(false);
  }

  async function fetchProductos() {
    const { data } = await supabase
      .from("productos")
      .select("id, nombre, precio_venta, stock_actual, puntos_otorgados")
      .eq("esta_activo", true)
      .gt("stock_actual", 0)
      .order("nombre");
    setProductos((data as ProductOption[]) ?? []);
  }

  async function fetchServicios() {
    const { data } = await supabase
      .from("servicios")
      .select("id, nombre, precio, puntos_otorgados")
      .eq("esta_activo", true)
      .order("nombre");
    setServicios((data as ServiceOption[]) ?? []);
  }

  async function fetchClientes() {
    const { data } = await supabase
      .from("clientes")
      .select("id, nombres, apellidos, dni")
      .eq("esta_activo", true)
      .order("nombres");
    setClientes((data as ClientOption[]) ?? []);
  }

  // ------------------------------------------------------------------
  // List filtering / pagination
  // ------------------------------------------------------------------

  const filteredSales = useMemo(() => {
    const q = query.toLowerCase();
    return sales.filter((s) => {
      const nombreCliente = s.clientes?.nombres?.toLowerCase() ?? "";
      return (
        nombreCliente.includes(q) ||
        s.metodo_pago?.toLowerCase().includes(q)
      );
    });
  }, [query, sales]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const paginatedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize);

  // ------------------------------------------------------------------
  // Mode handlers
  // ------------------------------------------------------------------

  const handleCreate = () => {
    setDraft(emptyDraft);
    setProductSearch("");
    setProductQty(1);
    setServiceSearch("");
    setRightbarOpen(false);
    setDescuentoText("");
    setMode("create");
  };

  const handleBack = () => {
    setMode("list");
    setDraft(emptyDraft);
    setDescuentoText("");
  };

  // ------------------------------------------------------------------
  // Filtered suggestion lists
  // ------------------------------------------------------------------

  const filteredProducts = useMemo(() => {
    if (!productSearch) return productos;
    const q = productSearch.toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [productSearch, productos]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return servicios;
    const q = serviceSearch.toLowerCase();
    return servicios.filter((s) => s.nombre.toLowerCase().includes(q));
  }, [serviceSearch, servicios]);

  // ------------------------------------------------------------------
  // Add / remove line items
  // ------------------------------------------------------------------

  function addProductById(prodId: string, qty: number) {
    const prod = productos.find((p) => p.id === prodId);
    if (!prod || qty < 1 || qty > prod.stock_actual) return;

    setDraft((d) => {
      const existing = d.items.find((i) => i.id === prod.id && i.type === "producto");
      if (existing) {
        const nueva = existing.cantidad + qty;
        if (nueva > prod.stock_actual) return d;
        return {
          ...d,
          items: d.items.map((i) =>
            i.id === prod.id && i.type === "producto"
              ? { ...i, cantidad: nueva }
              : i,
          ),
        };
      }
      return {
        ...d,
        items: [
          ...d.items,
          {
            id: prod.id,
            type: "producto",
            nombre: prod.nombre,
            precio: prod.precio_venta,
            puntos_otorgados: prod.puntos_otorgados || Math.max(1, Math.floor(prod.precio_venta)),
            cantidad: qty,
            stockDisponible: prod.stock_actual,
          },
        ],
      };
    });

    setProductSearch("");
    setProductQty(1);
    setProductOpen(false);
  }

  function addServiceById(servId: string) {
    const serv = servicios.find((s) => s.id === servId);
    if (!serv) return;

    setDraft((d) => {
      const existing = d.items.find((i) => i.id === serv.id && i.type === "servicio");
      if (existing) {
        return {
          ...d,
          items: d.items.map((i) =>
            i.id === serv.id && i.type === "servicio"
              ? { ...i, cantidad: i.cantidad + 1 }
              : i,
          ),
        };
      }
      return {
        ...d,
        items: [
          ...d.items,
          {
            id: serv.id,
            type: "servicio",
            nombre: serv.nombre,
            precio: serv.precio,
            puntos_otorgados: serv.puntos_otorgados || Math.max(1, Math.floor(serv.precio)),
            cantidad: 1,
          },
        ],
      };
    });

    setServiceSearch("");
    setServiceOpen(false);
  }

  function removeItem(index: number) {
    setDraft((d) => ({
      ...d,
      items: d.items.filter((_, i) => i !== index),
    }));
  }

  function updateItemQuantity(index: number, delta: number) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((item, i) => {
        if (i !== index) return item;
        const nueva = item.cantidad + delta;
        if (nueva < 1) return item;
        if (item.type === "producto" && item.stockDisponible !== undefined && nueva > item.stockDisponible) return item;
        return { ...item, cantidad: nueva };
      }),
    }));
  }

  // ------------------------------------------------------------------
  // Draft calculations
  // ------------------------------------------------------------------

  const draftSubtotal = useMemo(
    () => draft.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [draft.items],
  );

  const draftTotal = useMemo(
    () => Math.max(0, draftSubtotal - draft.descuento),
    [draftSubtotal, draft.descuento],
  );

  const draftPuntos = useMemo(
    () => draft.items.reduce((sum, i) => sum + i.puntos_otorgados * i.cantidad, 0),
    [draft.items],
  );

  const hasProductos = draft.items.some((i) => i.type === "producto");
  const hasServicios = draft.items.some((i) => i.type === "servicio");

  // ------------------------------------------------------------------
  // Save
  // ------------------------------------------------------------------

  async function saveSale() {
    if (draft.items.length === 0 || !userId) return;
    setSaving(true);

    try {
      const subtotal = draftSubtotal;
      const descuento = draft.descuento;
      const total = draftTotal;
      const puntos = draft.cliente_id ? draftPuntos : 0;

      const tipo =
        hasProductos && hasServicios
          ? "mixta"
          : hasProductos
            ? "producto"
            : "servicio";

      const ventaPayload: Record<string, unknown> = {
        cliente_id: draft.cliente_id || null,
        usuario_id: userId!,
        tipo_venta: tipo,
        subtotal,
        descuento,
        total,
        metodo_pago: draft.metodo_pago,
        puntos_ganados: puntos,
        estado: "pagada",
        observaciones: draft.observaciones || null,
      };

      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert(ventaPayload)
        .select()
        .single();

      if (ventaError) {
        console.error("Error insertando venta:", ventaError);
        throw ventaError;
      }
      const ventaId = (venta as Record<string, unknown>).id as string;

      const detalles = draft.items.map((item) => ({
        venta_id: ventaId,
        tipo_item: item.type,
        servicio_id: item.type === "servicio" ? item.id : null,
        producto_id: item.type === "producto" ? item.id : null,
        descripcion: item.nombre,
        precio_unitario: item.precio,
        cantidad: item.cantidad,
        subtotal: item.precio * item.cantidad,
        puntos_otorgados: item.puntos_otorgados * item.cantidad,
      }));

      const { error: detError } = await supabase
        .from("venta_detalle")
        .insert(detalles);

      if (detError) throw detError;

      for (const item of draft.items) {
        if (item.type !== "producto") continue;

        const { data: product } = await supabase
          .from("productos")
          .select("stock_actual")
          .eq("id", item.id)
          .single();

        const stockAnterior =
          (product as { stock_actual: number } | null)?.stock_actual ?? 0;
        const stockNuevo = Math.max(0, stockAnterior - item.cantidad);

        const movimientoPayload: Record<string, unknown> = {
          producto_id: item.id,
          tipo: "salida",
          cantidad: item.cantidad,
          motivo: `Venta #${ventaId.slice(0, 8)}`,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          referencia_tipo: "venta",
          referencia_id: ventaId,
        };
        if (userId) movimientoPayload.usuario_id = userId;

        await supabase.from("movimientos_inventario").insert(movimientoPayload);

        await supabase
          .from("productos")
          .update({ stock_actual: stockNuevo })
          .eq("id", item.id);
      }

      if (draft.cliente_id && puntos > 0) {
        try {
          await RewardsService.addPoints(
            draft.cliente_id,
            puntos,
            "acumulacion",
            `Puntos por compra (S/${formatCurrency(total)})`,
          );
        } catch (ptsErr) {
          const msg = ptsErr instanceof Error ? ptsErr.message : JSON.stringify(ptsErr);
          console.error("Error al asignar puntos:", msg);
        }
      }

      // Vincular citas pendientes del cliente a los servicios vendidos
      if (draft.cliente_id) {
        for (const item of draft.items) {
          if (item.type !== "servicio") continue;
          try {
            const { data: reservaMatch } = await supabase
              .from("reservas")
              .select("id")
              .eq("cliente_id", draft.cliente_id)
              .eq("servicio_id", item.id)
              .in("estado", ["pendiente", "confirmada"])
              .order("fecha_reserva", { ascending: true })
              .limit(1)
              .maybeSingle();

            if (reservaMatch) {
              await supabase
                .from("reservas")
                .update({ estado: "completada" })
                .eq("id", (reservaMatch as Record<string, unknown>).id as string);
            }
          } catch {
            // no interrumpir la venta si falla la vinculación
          }
        }
      }

      await fetchSales();
      await fetchProductos();
      setMode("list");
      setDraft(emptyDraft);
      setDescuentoText("");
      setIsConfirmOpen(false);
      setToast({
        message: "Venta registrada correctamente.",
        type: "success",
        open: true,
      });
    } catch (err: unknown) {
      console.error("Error al registrar venta:", err);
      const msg = err instanceof Error ? err.message : "Error al registrar la venta.";
      setToast({ message: msg, type: "error", open: true });
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    draft.items.length > 0 &&
    !!userId &&
    !saving;

  const userNotFound = !userId;

  async function updateObservaciones(saleId: string) {
    const text = editObsText.trim();
    await supabase.from("ventas").update({ observaciones: text || null }).eq("id", saleId);
    setEditingObs(null);
    setEditObsText("");
    await fetchSales();
  }

  // ---- selected client label ----
  const selectedClient = clientes.find((c) => c.id === draft.cliente_id);

  // ------------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------------

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <>
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Total ventas
          </p>
          <div className="mt-2 flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalVentas}</p>
          </div>
        </article>
        <article className="rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Ventas hoy
          </p>
          <div className="mt-2 flex items-center gap-2">
            <TrendingUp size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalDia}</p>
          </div>
        </article>
        <article className="rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Ingreso total
          </p>
          <div className="mt-2 flex items-center gap-2">
            <DollarSign size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">
              S/{ingresoTotal.toFixed(2)}
            </p>
          </div>
        </article>
      </div>

      {/* Toolbar */}
      <div className="rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {mode === "create" ? "Nueva venta" : "Listado de ventas"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {mode === "create"
                ? "Busca productos y/o servicios para agregar a la venta."
                : `${sales.length} venta(s)`}
            </p>
          </div>
          {mode === "list" ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
            >
              <Plus size={16} />
              Nueva venta
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-secondary)]"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
          )}
        </div>

        {mode === "list" && (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Buscar por cliente o metodo de pago"
            />
          </label>
        )}
      </div>

      {/* List mode */}
      {mode === "list" && (
        <>
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
              {paginatedSales.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <FileText size={32} className="text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)]">
                    {query
                      ? "No se encontraron ventas con ese filtro."
                      : "No hay ventas registradas."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Cliente</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Tipo</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Fecha</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-right whitespace-nowrap">Subtotal</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-right whitespace-nowrap">Desc.</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-right whitespace-nowrap">Total</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Método</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Puntos</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Estado</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap w-[300px]">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedSales.map((sale, idx) => {
                      const nombreCliente = sale.clientes
                        ? `${sale.clientes.nombres} ${sale.clientes.apellidos}`
                        : "Cliente ocasional";

                      return (
                        <tr key={sale.id} className="transition hover:bg-[var(--background)]">
                          <td className="px-4 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">
                            {nombreCliente}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTipoVentaClass(sale.tipo_venta)}`}>
                              {formatTipoVenta(sale.tipo_venta)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[var(--text-muted)] whitespace-nowrap text-xs">
                            {sale.creado_en.slice(0, 10)}
                          </td>
                          <td className="px-4 py-4 text-right text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                            S/{sale.subtotal.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                            -S/{sale.descuento.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-[var(--foreground)] whitespace-nowrap tabular-nums">
                            S/{sale.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                              {formatMetodoPago(sale.metodo_pago)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {sale.puntos_ganados > 0 ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                +{sale.puntos_ganados}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(sale.estado)}`}>
                              {getStatusLabel(sale.estado)}
                            </span>
                          </td>
                          <td className="px-4 py-4 max-w-[300px] w-[300px] whitespace-normal break-words leading-relaxed">
                            {editingObs === sale.id ? (
                              <div className="space-y-1.5">
                                <textarea
                                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--foreground)] resize-none"
                                  rows={2}
                                  maxLength={250}
                                  value={editObsText}
                                  onChange={(e) => setEditObsText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Escape") setEditingObs(null); }}
                                  autoFocus
                                />
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => updateObservaciones(sale.id)} className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] text-white transition hover:bg-emerald-600">Guardar</button>
                                  <button onClick={() => setEditingObs(null)} className="rounded-lg border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition hover:bg-[var(--background-secondary)]">Cancelar</button>
                                  <span className="text-[10px] text-[var(--text-muted)] ml-auto">{editObsText.length}/250</span>
                                </div>
                              </div>
                            ) : (
                              <div className="group flex items-start gap-1">
                                 <span className="text-xs text-[var(--text-muted)] line-clamp-3 flex-1">
                                  {sale.observaciones || "—"}
                                </span>
                                 <button
                                   onClick={() => { setEditingObs(sale.id); setEditObsText(sale.observaciones || ""); }}
                                   className="shrink-0 rounded p-1 text-[var(--text-muted)] opacity-70 hover:opacity-100 transition hover:text-[var(--foreground)] hover:bg-[var(--background)]"
                                   title="Editar observación"
                                 >
                                   <FileText size={16} />
                                 </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Create mode */}
      {mode === "create" && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background-secondary)] p-3">
              <ReceiptText size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                Registrar nueva venta
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Busca y agrega productos y/o servicios al carrito.
              </p>
            </div>
          </div>

          {/* ---- Service + Product + Client ---- */}
          <div className="flex gap-3">
            {/* Service search */}
            <div className="flex-1 rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Servicio
              </p>
              <Autocomplete
                value={serviceSearch}
                onChange={setServiceSearch}
                onFocus={() => setServiceOpen(true)}
                onBlur={() => setTimeout(() => setServiceOpen(false), 150)}
                placeholder="Buscar servicio..."
                open={serviceOpen}
              >
                {filteredServices.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    Sin resultados
                  </div>
                ) : (
                  filteredServices.slice(0, 10).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`${dropdownItemClass} w-full text-left`}
                      onClick={() => addServiceById(s.id)}
                    >
                      <ReceiptText size={16} className="text-[var(--text-muted)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          {highlightMatch(s.nombre, serviceSearch)}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          S/{formatCurrency(s.precio)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </Autocomplete>
            </div>

            {/* Product search */}
            <div className="flex-1 rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Producto
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Autocomplete
                    value={productSearch}
                    onChange={setProductSearch}
                    onFocus={() => setProductOpen(true)}
                    onBlur={() => setTimeout(() => setProductOpen(false), 150)}
                    placeholder="Buscar producto..."
                    open={productOpen}
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                        Sin resultados
                      </div>
                    ) : (
                      filteredProducts.slice(0, 10).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`${dropdownItemClass} w-full text-left`}
                          onClick={() => addProductById(p.id, productQty)}
                        >
                          <ShoppingCart size={16} className="text-[var(--text-muted)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">
                              {highlightMatch(p.nombre, productSearch)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span>S/{formatCurrency(p.precio_venta)}</span>
                              <span className="opacity-50">|</span>
                              <span>Stock: {p.stock_actual}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </Autocomplete>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setProductQty((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] transition hover:bg-[var(--hover)]/15 hover:border-[var(--hover)]"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-[var(--foreground)]">
                    {productQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductQty((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] transition hover:bg-[var(--hover)]/15 hover:border-[var(--hover)]"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Client */}
            <button
              type="button"
              onClick={() => setRightbarOpen(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[var(--hover)]/30 bg-[var(--background-secondary)] px-6 py-5 shadow-md transition hover:border-[var(--hover)] hover:shadow-lg"
            >
              {selectedClient ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hover)]/15 ring-2 ring-[var(--hover)]/20">
                    <span className="text-xs font-bold text-[var(--hover)]">
                      {selectedClient.nombres.charAt(0)}{selectedClient.apellidos.charAt(0)}
                    </span>
                  </div>
                  <span className="truncate text-xs font-medium text-[var(--foreground)] max-w-[70px] text-center">
                    {selectedClient.nombres}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hover)]/5 ring-2 ring-[var(--hover)]/15">
                    <UserPlus size={18} className="text-[var(--hover)]" />
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)]">Cliente</span>
                </>
              )}
            </button>
          </div>

          {/* ---- Items list ---- */}
          {draft.items.length > 0 && (
            <div className="mt-4 rounded-3xl border-2 border-[var(--hover)]/15 bg-[var(--background-secondary)] p-5 shadow-md">
              <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Carrito ({draft.items.length})
              </p>
              <div className="space-y-2">
                {draft.items.map((item, idx) => (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.type === "producto"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-blue-500/15 text-blue-600"
                      }`}
                    >
                      {item.type === "producto" ? "Producto" : "Servicio"}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                      {item.nombre}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      S/{formatCurrency(item.precio)} c/u
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(idx, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] transition hover:bg-[var(--hover)]/15 hover:border-[var(--hover)]"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[var(--foreground)]">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(idx, 1)}
                        disabled={
                          item.type === "producto" &&
                          item.stockDisponible !== undefined &&
                          item.cantidad >= item.stockDisponible
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] transition hover:bg-[var(--hover)]/15 hover:border-[var(--hover)] disabled:opacity-30"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span className="w-20 text-right text-sm font-semibold text-[var(--foreground)]">
                      S/{formatCurrency(item.precio * item.cantidad)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="rounded-lg p-1 text-[var(--text-muted)] transition hover:text-[var(--destructive)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary with inline discount */}
              <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span className="font-medium text-[var(--foreground)]">
                    S/{formatCurrency(draftSubtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3.5">
                  <span className="text-sm font-medium text-red-500 shrink-0">Descuento</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-red-400">- S/</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-16 rounded-lg bg-[var(--background-secondary)] px-2 py-1 text-right text-sm font-semibold text-[var(--foreground)] outline-none ring-1 ring-red-500/20 placeholder:text-[var(--text-muted)]"
                      value={descuentoText}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDescuentoText(raw);
                        const n = parseFloat(raw);
                        if (raw === "" || isNaN(n)) {
                          setDraft((d) => ({ ...d, descuento: 0 }));
                        } else {
                          setDraft((d) => ({
                            ...d,
                            descuento: Math.min(Math.max(0, n), draftSubtotal),
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
                  <span className="text-lg font-bold text-[var(--foreground)]">
                    S/{formatCurrency(draftTotal)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="mt-2 text-sm font-medium text-[var(--text-muted)] shrink-0">Metodo de pago</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {METODOS_PAGO.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, metodo_pago: m.value }))}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          draft.metodo_pago === m.value
                            ? "bg-[var(--hover)] text-white"
                            : "bg-[var(--background-secondary)] text-[var(--text-muted)] hover:bg-[var(--hover)]/15"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {draft.cliente_id && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Puntos a ganar</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                      +{draftPuntos} pts
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state when no items */}
          {draft.items.length === 0 && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)] py-12">
              <ShoppingCart size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                Carrito vacio. Busca productos o servicios para agregar.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Observaciones</p>
            <textarea
              className={inputClassName}
              rows={3}
              value={draft.observaciones}
              onChange={(e) =>
                setDraft((d) => ({ ...d, observaciones: e.target.value }))
              }
              placeholder="Notas adicionales..."
            />
          </div>

          {userNotFound && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
              No se encontro tu usuario en la tabla <strong>usuarios</strong>. Contacta al administrador para vincular tu cuenta.
            </div>
          )}

          {/* ---- Actions ---- */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!canSave}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              <Check size={16} />
              Registrar venta
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-secondary)]"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Client rightbar */}
      <ClientRightbar
        open={rightbarOpen}
        onClose={() => setRightbarOpen(false)}
        clientes={clientes}
        selectedId={draft.cliente_id}
        onSelect={(id) => setDraft((d) => ({ ...d, cliente_id: id }))}
        onCreate={(cliente) => {
          setClientes((prev) => [...prev, cliente]);
          setDraft((d) => ({ ...d, cliente_id: cliente.id }));
        }}
        onUseAppointment={(servicioId) => {
          const serv = servicios.find((s) => s.id === servicioId);
          if (!serv) return;
          addServiceById(serv.id);
          setToast({ message: "Servicio agregado al carrito", type: "success", open: true });
        }}
      />

      {/* Confirmation modal */}
      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar venta"
        description={`Se registrará una venta por S/${formatCurrency(draftTotal)} con ${draft.items.length} item(s). Se descontará el inventario de los productos y se asignarán ${draft.cliente_id ? draftPuntos : 0} puntos.`}
        confirmLabel={saving ? "Registrando..." : "Si, registrar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveSale}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Field helper
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2.5">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-[var(--destructive)]">*</span>}
      </span>
      {children}
    </label>
  );
}
