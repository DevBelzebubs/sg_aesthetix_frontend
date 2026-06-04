"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { hashPin, verifyPin } from "@/lib/pin";
import { sendConfirmationEmail, sendPinResetEmail } from "@/lib/email-client";
import { X, Eye, EyeOff, Loader2, Mail, Check } from "lucide-react";

type Tab = "cliente" | "registro" | "admin" | "olvide-pin";

const MAX_INTENTOS = 3;

export function CustomerAuthModal() {
  const { session, modalOpen, closeModal, login, logout, refreshPoints } = useCustomerAuth();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login fields
  const [loginDni, setLoginDni] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Register fields
  const [regNombres, setRegNombres] = useState("");
  const [regApellidos, setRegApellidos] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regFechaNacimiento, setRegFechaNacimiento] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPinConfirm, setRegPinConfirm] = useState("");
  const [regShowPin, setRegShowPin] = useState(false);
  const [regSent, setRegSent] = useState(false);

  // Forgot PIN fields
  const [forgotDni, setForgotDni] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  if (!modalOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombres || !regApellidos || !regDni || !regTelefono || !regEmail || !regFechaNacimiento || !regPin) return;
    if (regPin !== regPinConfirm) { setError("Los PIN no coinciden"); return; }
    if (regPin.length < 4 || regPin.length > 6) { setError("El PIN debe tener entre 4 y 6 dígitos"); return; }
    if (!/^\d+$/.test(regPin)) { setError("El PIN solo puede contener números"); return; }

    setLoading(true);
    setError("");
    try {
      const existente = await CustomersService.findByDni(regDni);
      if (existente) {
        setError("Ya existe un cliente con ese DNI. Usa la pestaña Cliente para ingresar.");
        setLoading(false);
        return;
      }

      const { hash, salt } = await hashPin(regPin);
      const nuevo = await CustomersService.create({
        nombres: regNombres,
        apellidos: regApellidos,
        dni: regDni,
        telefono: regTelefono,
        correoElectronico: regEmail,
        fechaNacimiento: regFechaNacimiento,
        pinHash: hash,
        pinSalt: salt,
      });

      await login(nuevo.id, nuevo.nombres);
      try { await RewardsService.claimWelcomeReward(nuevo.id); } catch {}
      await sendConfirmationEmail(nuevo.id, regEmail);
      setRegSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginDni || !loginPin) return;
    setLoading(true);
    setError("");

    try {
      const customer = await CustomersService.findByDni(loginDni);
      if (!customer) { setError("DNI no registrado"); setLoading(false); return; }

      if (customer.bloqueadoHasta && new Date(customer.bloqueadoHasta) > new Date()) {
        const minutos = Math.ceil((new Date(customer.bloqueadoHasta).getTime() - Date.now()) / 60000);
        setError(`Cuenta bloqueada. Intenta de nuevo en ${minutos} minuto(s).`);
        setLoading(false);
        return;
      }

      if (!customer.pinHash || !customer.pinSalt) {
        setError("Esta cuenta no tiene PIN configurado. Contacta al administrador.");
        setLoading(false);
        return;
      }

      const valid = await verifyPin(loginPin, customer.pinSalt, customer.pinHash);
      if (!valid) {
        const intentos = (customer.intentosFallidos ?? 0) + 1;
        if (intentos >= MAX_INTENTOS) {
          const bloqueo = new Date(Date.now() + 15 * 60000).toISOString();
          await CustomersService.update(customer.id, { intentosFallidos: intentos, bloqueadoHasta: bloqueo });
          setError("Cuenta bloqueada por 15 minutos tras múltiples intentos fallidos.");
        } else {
          await CustomersService.update(customer.id, { intentosFallidos: intentos });
          setError(`PIN incorrecto. ${MAX_INTENTOS - intentos} intento(s) restante(s).`);
        }
        setLoading(false);
        return;
      }

      await CustomersService.update(customer.id, { intentosFallidos: 0, bloqueadoHasta: "" });
      await login(customer.id, customer.nombres);

      try {
        const cuenta = await RewardsService.getCuentaPuntosByClienteId(customer.id);
        const yaTieneBienvenida = cuenta
          ? (await RewardsService.getTransacciones(cuenta.id)).some((t) => t.tipo === "bienvenida")
          : false;
        if (!yaTieneBienvenida) await RewardsService.claimWelcomeReward(customer.id);
      } catch {}

      closeModal();
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotDni || !forgotEmail) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const customer = await CustomersService.findByDni(forgotDni);
      if (!customer || !customer.correoElectronico || customer.correoElectronico.toLowerCase() !== forgotEmail.toLowerCase()) {
        setError("DNI y/o correo no coinciden con ningún cliente.");
        setLoading(false);
        return;
      }

      const tempPin = String(Math.floor(1000 + Math.random() * 9000));
      const { hash, salt } = await hashPin(tempPin);
      await CustomersService.updatePin(customer.id, hash, salt);
      await sendPinResetEmail(customer.id, forgotEmail, tempPin);
      setSuccessMsg("Se ha enviado un PIN temporal a tu correo. Revisa tu bandeja de entrada.");
      setForgotDni("");
      setForgotEmail("");
    } catch {
      setError("Error al procesar la solicitud.");
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
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

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

  const resetRegisterForm = () => {
    setRegSuccess(false);
    setRegSent(false);
    setRegNombres("");
    setRegApellidos("");
    setRegEmail("");
    setRegDni("");
    setRegTelefono("");
    setRegFechaNacimiento("");
    setRegPin("");
    setRegPinConfirm("");
    setError("");
  };

  const inputClassName =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)] text-[var(--text-muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        >
          <X size="14" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            type="button"
            onClick={() => { setTab("cliente"); setError(""); setSuccessMsg(""); }}
            className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              tab === "cliente" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => { setTab("admin"); setError(""); setSuccessMsg(""); }}
            className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              tab === "admin" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Session / Login / Register / Forgot PIN / Admin */}
        {session && tab === "cliente" ? (
          <div className="px-6 py-8 text-center space-y-4">
            <p className="text-sm text-[var(--text-muted)]">Bienvenido, <strong className="text-[var(--foreground)]">{session.nombres}</strong></p>
            <p className="text-4xl font-black tracking-tight text-[var(--foreground)]">{session.puntosDisponibles}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Puntos disponibles</p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { refreshPoints(); }} className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--foreground)] transition hover:bg-[var(--background)]">Actualizar</button>
              <button type="button" onClick={() => { logout(); closeModal(); }} className="flex-1 rounded-xl border border-red-500/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-red-500 transition hover:bg-red-500/10">Cerrar</button>
            </div>
          </div>
        ) : tab === "cliente" ? (
          <form onSubmit={handleCustomerLogin} className="px-6 py-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Ingresa con tu DNI y PIN</p>

            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">DNI *</span>
              <input required type="text" value={loginDni} onChange={(e) => setLoginDni(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="12345678" inputMode="numeric" className={inputClassName} />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">PIN *</span>
              <div className="relative">
                <input required type={showPin ? "text" : "password"} value={loginPin} onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••" inputMode="numeric" className={`${inputClassName} pr-10`} />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]">
                  {showPin ? <EyeOff size="16" /> : <Eye size="16" />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--foreground)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--background)] transition hover:opacity-85 disabled:opacity-40">
              {loading ? <Loader2 size="14" className="animate-spin mx-auto" /> : "Ingresar"}
            </button>

            {error && <p className="text-[10px] font-semibold text-red-500 text-center">{error}</p>}

            <div className="text-center pt-1">
              <button type="button" onClick={() => { setTab("olvide-pin"); setError(""); setSuccessMsg(""); }} className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition">
                ¿Olvidaste tu PIN?
              </button>
            </div>
          </form>
        ) : tab === "olvide-pin" ? (
          <form onSubmit={handleForgotPin} className="px-6 py-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Recuperar PIN</p>
            <p className="text-xs text-[var(--text-muted)] text-center">Ingresa tu DNI y correo. Te enviaremos un PIN temporal.</p>

            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">DNI *</span>
              <input required type="text" value={forgotDni} onChange={(e) => setForgotDni(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="12345678" inputMode="numeric" className={inputClassName} />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Correo *</span>
              <input required type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="correo@ejemplo.com" className={inputClassName} />
            </label>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--foreground)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--background)] transition hover:opacity-85 disabled:opacity-40">
              {loading ? <Loader2 size="14" className="animate-spin mx-auto" /> : "Enviar PIN temporal"}
            </button>

            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-[10px] font-semibold text-emerald-600">
                <Check size="14" className="shrink-0 mt-0.5" />
                {successMsg}
              </div>
            )}
            {error && <p className="text-[10px] font-semibold text-red-500 text-center">{error}</p>}

            <div className="text-center pt-1">
              <button type="button" onClick={() => { setTab("cliente"); setError(""); setSuccessMsg(""); }} className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition">
                ← Volver al inicio
              </button>
            </div>
          </form>
        ) : tab === "registro" ? (
          <form onSubmit={handleRegister} className="px-6 py-8 space-y-4">
            {regSent ? (
              <div className="text-center space-y-5 py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Mail className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">¡Registro exitoso!</p>
                  <p className="text-sm text-[var(--text-muted)]">+50 puntos de bienvenida</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Te enviamos un correo de confirmación.<br />Revisa tu bandeja de entrada.</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { resetRegisterForm(); }} className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--foreground)] transition hover:bg-[var(--background)]">Nuevo registro</button>
                  <button type="button" onClick={closeModal} className="flex-1 rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--background)] transition hover:opacity-85">Cerrar</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Crea tu cuenta de cliente</p>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Apellidos *</span>
                    <input required type="text" value={regApellidos} onChange={(e) => setRegApellidos(e.target.value)} placeholder="Apellidos" className={inputClassName} />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Nombres *</span>
                    <input required type="text" value={regNombres} onChange={(e) => setRegNombres(e.target.value)} placeholder="Nombres" className={inputClassName} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">DNI *</span>
                    <input required type="text" value={regDni} onChange={(e) => setRegDni(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="12345678" inputMode="numeric" className={inputClassName} />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Teléfono *</span>
                    <input required type="text" value={regTelefono} onChange={(e) => setRegTelefono(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="999 999 999" inputMode="numeric" className={inputClassName} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Correo *</span>
                    <input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="correo@ejemplo.com" className={inputClassName} />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">F. Nacimiento *</span>
                    <input required type="date" value={regFechaNacimiento} onChange={(e) => setRegFechaNacimiento(e.target.value)} className={inputClassName} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">PIN (4-6 dígitos) *</span>
                    <div className="relative">
                      <input required type={regShowPin ? "text" : "password"} value={regPin} onChange={(e) => setRegPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••" inputMode="numeric" className={`${inputClassName} pr-10`} />
                      <button type="button" onClick={() => setRegShowPin(!regShowPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]">
                        {regShowPin ? <EyeOff size="16" /> : <Eye size="16" />}
                      </button>
                    </div>
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Confirmar PIN *</span>
                    <input required type="password" value={regPinConfirm} onChange={(e) => setRegPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••" inputMode="numeric" className={inputClassName} />
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--foreground)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--background)] transition hover:opacity-85 disabled:opacity-40">
                  {loading ? <Loader2 size="14" className="animate-spin mx-auto" /> : "Registrarme"}
                </button>
                {error && <p className="text-[10px] font-semibold text-red-500 text-center">{error}</p>}
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="px-6 py-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Acceso administrativo</p>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@correo.com" className={inputClassName} />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Contraseña</span>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClassName} />
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--foreground)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--background)] transition hover:opacity-85 disabled:opacity-40">
              {loading ? <Loader2 size="14" className="animate-spin mx-auto" /> : "Ingresar"}
            </button>
            {error && <p className="text-[10px] font-semibold text-red-500 text-center">{error}</p>}
          </form>
        )}

        {/* Pie */}
        {tab === "cliente" && (
          <div className="border-t border-[var(--border)] px-6 py-3.5 text-center">
            <button type="button" onClick={() => { setTab("registro"); setError(""); setSuccessMsg(""); resetRegisterForm(); }} className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] transition hover:text-[var(--foreground)]">
              ¿No tienes cuenta? Regístrate aquí
            </button>
          </div>
        )}
        {(tab === "registro" || tab === "olvide-pin") && (
          <div className="border-t border-[var(--border)] px-6 py-3.5 text-center">
            <button type="button" onClick={() => { setTab("cliente"); setError(""); setSuccessMsg(""); }} className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] transition hover:text-[var(--foreground)]">
              ¿Ya tienes cuenta? Ingresa aquí
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
