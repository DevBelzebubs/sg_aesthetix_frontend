"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { X } from "lucide-react";

type Tab = "cliente" | "registro" | "admin";

export function CustomerAuthModal() {
  const { session, modalOpen, closeModal, login, logout, refreshPoints } = useCustomerAuth();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("cliente");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [regNombres, setRegNombres] = useState("");
  const [regApellidos, setRegApellidos] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regFechaNacimiento, setRegFechaNacimiento] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  if (!modalOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombres || !regDni) return;
    setLoading(true);
    setError("");
    try {
      const existente = await CustomersService.findByDni(regDni);
      if (existente) {
        setError("Ya existe un cliente con ese DNI. Usa la pestaña Cliente para ingresar.");
        setLoading(false);
        return;
      }
      const nuevo = await CustomersService.create({
        nombres: regNombres,
        apellidos: regApellidos || undefined,
        dni: regDni,
        telefono: regTelefono || undefined,
        correoElectronico: regEmail || undefined,
        fechaNacimiento: regFechaNacimiento || undefined,
      });
      await login(nuevo.id, nuevo.nombres);
      try {
        await RewardsService.claimWelcomeReward(nuevo.id);
      } catch {}
      setRegSuccess(true);
      setTimeout(() => {
        closeModal();
        setRegSuccess(false);
        setRegNombres("");
        setRegApellidos("");
        setRegEmail("");
        setRegDni("");
        setRegTelefono("");
        setRegFechaNacimiento("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !dni) return;
    setLoading(true);
    setError("");
    try {
      const customer = await CustomersService.findByDni(dni);
      if (!customer || customer.correoElectronico !== email) {
        setError("Email o DNI incorrectos");
        return;
      }
      await login(customer.id, customer.nombres);

      try {
        const cuenta = await RewardsService.getCuentaPuntosByClienteId(customer.id);
        const yaTieneBienvenida = cuenta
          ? (await RewardsService.getTransacciones(cuenta.id)).some((t) => t.tipo === "bienvenida")
          : false;

        if (!yaTieneBienvenida) {
          await RewardsService.claimWelcomeReward(customer.id);
        }
      } catch {}

      closeModal();
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      // 1. Intentar signIn directo
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      // 2. Si falla, sincronizar via API y reintentar
      if (authError || !authData.session) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Credenciales incorrectas");

        const second = await supabase.auth.signInWithPassword({ email, password });
        authData = second.data;
        authError = second.error;
      }

      if (authError || !authData?.session) {
        setError("Credenciales incorrectas");
        return;
      }

      // Determinar rol y redirigir
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("auth_user_id", authData.session.user.id)
        .single();

      closeModal();
      router.push(usuario?.rol === "empleado" ? "/empleado" : "/admin");
    } catch {
      setError("Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full border border-transparent/10/10 bg-[var(--background-secondary)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-transparent/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative w-full max-w-sm border border-transparent/10/10 bg-[var(--background-secondary)] shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 flex items-center justify-center border border-transparent/10/10 p-1.5 text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
        >
          <X size="14" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-transparent/10/10">
          <button
            type="button"
            onClick={() => { setTab("cliente"); setError(""); }}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              tab === "cliente" ? "bg-black text-white" : "bg-[var(--background)] text-neutral-500 hover:text-[var(--foreground)]"
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => { setTab("admin"); setError(""); }}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              tab === "admin" ? "bg-black text-white" : "bg-[var(--background)] text-neutral-500 hover:text-[var(--foreground)]"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Customer points summary when already logged in */}
        {session && tab === "cliente" ? (
          <div className="px-6 py-8 text-center space-y-4">
            <p className="text-sm text-neutral-500">Bienvenido, <strong>{session.nombres}</strong></p>
            <p className="text-4xl font-black tracking-tight">{session.puntosDisponibles}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Puntos disponibles
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { refreshPoints(); }}
                className="flex-1 border border-transparent/10/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-[var(--background)]"
              >
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => { logout(); closeModal(); }}
                className="flex-1 border border-red-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 transition hover:bg-red-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : tab === "cliente" ? (
          <form onSubmit={handleCustomerLogin} className="px-6 py-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-4">
              Ingresa con tu DNI y email
            </p>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                className={inputClassName}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">DNI</span>
              <input
                required
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678"
                className={inputClassName}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-80 disabled:opacity-40"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
            {error && <p className="text-[10px] font-semibold text-red-600 text-center">{error}</p>}
          </form>
        ) : tab === "registro" ? (
          <form onSubmit={handleRegister} className="px-6 py-8 space-y-3">
            {regSuccess ? (
              <div className="text-center space-y-3">
                <p className="text-lg font-bold">¡Registro exitoso!</p>
                <p className="text-sm text-[var(--text-muted)]">+50 puntos de bienvenida</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-2">
                  Crea tu cuenta de cliente
                </p>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Nombres</span>
                  <input required type="text" value={regNombres} onChange={(e) => setRegNombres(e.target.value)} placeholder="Tus nombres" className={inputClassName} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Apellidos</span>
                  <input type="text" value={regApellidos} onChange={(e) => setRegApellidos(e.target.value)} placeholder="Tus apellidos" className={inputClassName} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">DNI</span>
                  <input required type="text" value={regDni} onChange={(e) => setRegDni(e.target.value)} placeholder="12345678" className={inputClassName} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Email (opcional)</span>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="correo@ejemplo.com" className={inputClassName} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Teléfono (opcional)</span>
                  <input type="text" value={regTelefono} onChange={(e) => setRegTelefono(e.target.value)} placeholder="999 999 999" className={inputClassName} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Fecha de nacimiento (opcional)</span>
                  <input type="date" value={regFechaNacimiento} onChange={(e) => setRegFechaNacimiento(e.target.value)} className={inputClassName} />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-80 disabled:opacity-40"
                >
                  {loading ? "Registrando..." : "Registrarme"}
                </button>
                {error && <p className="text-[10px] font-semibold text-red-600 text-center">{error}</p>}
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="px-6 py-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-4">
              Acceso administrativo
            </p>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@correo.com"
                className={inputClassName}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Contraseña</span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClassName}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-80 disabled:opacity-40"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
            {error && <p className="text-[10px] font-semibold text-red-600 text-center">{error}</p>}
          </form>
        )}

        {/* Pie */}
        {tab === "cliente" && (
          <div className="border-t border-transparent/10/10 px-6 py-3 text-center">
            <button
              type="button"
              onClick={() => { setTab("registro"); setError(""); }}
              className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
            >
              ¿No tienes cuenta? Regístrate aquí
            </button>
          </div>
        )}
        {tab === "registro" && (
          <div className="border-t border-transparent/10/10 px-6 py-3 text-center">
            <button
              type="button"
              onClick={() => { setTab("cliente"); setError(""); }}
              className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
            >
              ¿Ya tienes cuenta? Ingresa aquí
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
