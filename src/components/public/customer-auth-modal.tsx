"use client";

import { useState } from "react";
import { AlertCircle, X, Mail, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { validateDni, validateEmail, validateRequired, validatePassword } from "@/lib/validators";
import { hashPin, verifyPin } from "@/lib/pin";
import { sendConfirmationEmail, sendPinResetEmail, sendVerificationEmail } from "@/lib/email-client";
import { Toast } from "@/components/dashboard/toast";

type Tab = "cliente" | "registro" | "admin" | "olvide-pin";
type RegStep = "form" | "verification" | "success";

const MAX_INTENTOS = 3;

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

export function CustomerAuthModal() {
  const { session, modalOpen, closeModal, login, logout, refreshPoints } = useCustomerAuth();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("cliente");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Register fields
  const [regNombres, setRegNombres] = useState("");
  const [regApellidos, setRegApellidos] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDni, setRegDni] = useState("");

  const [regPin, setRegPin] = useState("");
  const [regPinConfirm, setRegPinConfirm] = useState("");
  const [regShowPin, setRegShowPin] = useState(false);
  const [regStep, setRegStep] = useState<RegStep>("form");
  const [regSent, setRegSent] = useState(false);

  // Verification fields
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [pendingRegData, setPendingRegData] = useState<{
    nombres: string;
    apellidos: string;
    dni: string;
    email: string;
    pin: string;
    customerId: string;
  } | null>(null);

  // Forgot PIN fields
  const [forgotDni, setForgotDni] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  if (!modalOpen) return null;

  const resetRegisterForm = () => {
    setRegNombres("");
    setRegApellidos("");
    setRegEmail("");
    setRegDni("");

    setRegPin("");
    setRegPinConfirm("");
    setRegShowPin(false);
    setRegStep("form");
    setRegSent(false);
    setVerificationCode("");
    setEnteredCode("");
    setPendingRegData(null);
    setError("");
    setFieldErrors({});
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateRequired(regNombres, "Los nombres");
    const dniErr = validateDni(regDni);
    const emailErr = validateEmail(regEmail);
    const pinErr = validateRequired(regPin, "El PIN");
    if (regPin.length !== 6) errors.regPin = "El PIN debe tener 6 dígitos";
    if (regPin !== regPinConfirm) errors.regPinConfirm = "Los PINs no coinciden";
    if (nameErr) errors.nombres = nameErr;
    if (dniErr) errors.regDni = dniErr;
    if (emailErr) errors.regEmail = emailErr;
    if (pinErr) errors.regPin = pinErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const existente = await CustomersService.findByDni(regDni);
      if (existente) {
        setError("Ya existe un cliente con ese DNI. Usa la pestaña Cliente para ingresar.");
        setLoading(false);
        return;
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      
      // Crear cliente temporal con código de verificación
      const nuevo = await CustomersService.create({
        nombres: regNombres,
        apellidos: regApellidos,
        dni: regDni,
        correoElectronico: regEmail,
        emailConfirmado: false,
        codigoVerificacion: code,
        codigoExpiracion: new Date(Date.now() + 15 * 60000).toISOString(),
      });
      
      // Guardar PIN en memoria para usarlo después de la verificación
      setPendingRegData({
        nombres: regNombres,
        apellidos: regApellidos,
        dni: regDni,
        email: regEmail,
        pin: regPin,
        customerId: nuevo.id,
      });
      
      await sendVerificationEmail(regEmail, regNombres, code);
      setRegStep("verification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el registro");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode || enteredCode.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }
    if (!pendingRegData) {
      setError("Datos de registro no encontrados. Intenta nuevamente.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Verificar código contra la base de datos
      const isValid = await CustomersService.verifyCode(pendingRegData.customerId, enteredCode);
      if (!isValid) {
        setError("Código incorrecto o expirado. Verifica tu correo.");
        setLoading(false);
        return;
      }

      // Generar hash del PIN
      const { hash, salt } = await hashPin(pendingRegData.pin);
      
      // Actualizar cliente con PIN, confirmar email, limpiar código
      await CustomersService.update(pendingRegData.customerId, {
        pinHash: hash,
        pinSalt: salt,
        emailConfirmado: true,
        codigoVerificacion: null as unknown as string,
        codigoExpiracion: null as unknown as string,
      });

      await login(pendingRegData.customerId, pendingRegData.nombres);
      try { await RewardsService.claimWelcomeReward(pendingRegData.customerId); } catch {}
      
      setToastMessage("¡Registrado en el sistema! Bienvenido a Aesthetix");
      setToastType("success");
      setToastOpen(true);
      
      setRegStep("success");
      setRegSent(true);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const dniErr = validateDni(dni);
    const pinErr = validateRequired(pin, "El PIN");
    if (emailErr) errors.email = emailErr;
    if (dniErr) errors.dni = dniErr;
    if (pinErr) errors.pin = pinErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const customer = await CustomersService.findByDni(dni);
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

      const valid = await verifyPin(pin, customer.pinSalt, customer.pinHash);
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
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr) errors.adminEmail = emailErr;
    if (passErr) errors.adminPassword = passErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
        <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-2xl max-h-[85vh] overflow-y-auto">
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-3 top-3 z-10 flex items-center justify-center rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          >
            <X size="14" />
          </button>

          {/* Tabs */}
          <div className="flex overflow-hidden rounded-t-2xl border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => { setTab("cliente"); setError(""); setFieldErrors({}); }}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                tab === "cliente" ? "bg-black text-white" : "bg-[var(--background)] text-neutral-500 hover:text-[var(--foreground)]"
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => { setTab("admin"); setError(""); setFieldErrors({}); }}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                tab === "admin" ? "bg-black text-white" : "bg-[var(--background)] text-neutral-500 hover:text-[var(--foreground)]"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Session / Login / Register / Forgot PIN / Admin */}
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
                  className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-[var(--background)]"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => { logout(); closeModal(); }}
                  className="flex-1 rounded-xl border border-[var(--destructive-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
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

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                  <AlertCircle size="14" className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Email <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: "" })); }}
                  placeholder="nombre@correo.com"
                  className={fieldClass}
                />
                {fieldErrors.email && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.email}
                  </p>
                )}
              </label>
              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  DNI <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => { setDni(e.target.value); setFieldErrors((prev) => ({ ...prev, dni: "" })); }}
                  placeholder="12345678"
                  maxLength={8}
                  className={fieldClass}
                />
                {fieldErrors.dni && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.dni}
                  </p>
                )}
              </label>
              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  PIN <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setFieldErrors((prev) => ({ ...prev, pin: "" })); }}
                  placeholder="******"
                  maxLength={6}
                  className={fieldClass}
                />
                {fieldErrors.pin && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.pin}
                  </p>
                )}
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          ) : tab === "registro" ? (
            <div className="px-6 py-8 space-y-4">
              {regStep === "success" ? (
                <div className="text-center space-y-5 py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--foreground)]">¡Registro exitoso!</p>
                    <p className="text-sm text-[var(--text-muted)]">+50 puntos de bienvenida</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">Tu cuenta ha sido verificada y creada.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => { resetRegisterForm(); }} className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--foreground)] transition hover:bg-[var(--background)]">Nuevo registro</button>
                    <button type="button" onClick={() => { setTab("cliente"); resetRegisterForm(); }} className="flex-1 rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--background)] transition hover:opacity-85">Ingresar</button>
                  </div>
                </div>
              ) : regStep === "verification" ? (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="text-center space-y-2 mb-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                      <Mail className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-[var(--foreground)]">Verifica tu correo</p>
                    <p className="text-xs text-[var(--text-muted)]">Enviamos un código de 6 dígitos a {pendingRegData?.email}</p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                      <AlertCircle size="14" className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Código de verificación <span className="text-[var(--destructive)]">*</span>
                    </span>
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => { setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    placeholder="123456"
                    maxLength={6}
                    className={`${fieldClass} text-center text-2xl tracking-[0.5em] font-bold`}
                  />
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? "Verificando..." : "Verificar y registrarme"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegStep("form"); setEnteredCode(""); setError(""); }}
                    className="w-full text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
                  >
                    Volver al formulario
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-2">
                    Crea tu cuenta de cliente
                  </p>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                      <AlertCircle size="14" className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Nombres <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="text"
                      value={regNombres}
                      onChange={(e) => { setRegNombres(e.target.value); setFieldErrors((prev) => ({ ...prev, nombres: "" })); }}
                      placeholder="Tus nombres"
                      className={fieldClass}
                    />
                    {fieldErrors.nombres && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.nombres}
                      </p>
                    )}
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Apellidos</span>
                    <input
                      type="text"
                      value={regApellidos}
                      onChange={(e) => setRegApellidos(e.target.value)}
                      placeholder="Tus apellidos"
                      className={fieldClass}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      DNI <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="text"
                      value={regDni}
                      onChange={(e) => { setRegDni(e.target.value); setFieldErrors((prev) => ({ ...prev, regDni: "" })); }}
                      placeholder="12345678"
                      maxLength={8}
                      className={fieldClass}
                    />
                    {fieldErrors.regDni && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.regDni}
                      </p>
                    )}
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Email <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => { setRegEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, regEmail: "" })); }}
                      placeholder="correo@ejemplo.com"
                      className={fieldClass}
                    />
                    {fieldErrors.regEmail && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.regEmail}
                      </p>
                    )}
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      PIN (6 dígitos) <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="password"
                      value={regPin}
                      onChange={(e) => { setRegPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((prev) => ({ ...prev, regPin: "" })); }}
                      placeholder="123456"
                      maxLength={6}
                      className={fieldClass}
                    />
                    {fieldErrors.regPin && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.regPin}
                      </p>
                    )}
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Confirmar PIN <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="password"
                      value={regPinConfirm}
                      onChange={(e) => { setRegPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((prev) => ({ ...prev, regPinConfirm: "" })); }}
                      placeholder="123456"
                      maxLength={6}
                      className={fieldClass}
                    />
                    {fieldErrors.regPinConfirm && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.regPinConfirm}
                      </p>
                    )}
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? "Registrando..." : "Registrarme"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="px-6 py-8 space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-4">
                Acceso administrativo
              </p>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                  <AlertCircle size="14" className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Email <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, adminEmail: "" })); }}
                  placeholder="admin@correo.com"
                  className={fieldClass}
                />
                {fieldErrors.adminEmail && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.adminEmail}
                  </p>
                )}
              </label>
              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Contraseña <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, adminPassword: "" })); }}
                  placeholder="••••••••"
                  className={fieldClass}
                />
                {fieldErrors.adminPassword && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.adminPassword}
                  </p>
                )}
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          )}

          {/* Pie */}
          {tab === "cliente" && (
            <div className="border-t border-[var(--border)] px-6 py-3 text-center">
              <button
                type="button"
                onClick={() => { setTab("registro"); setError(""); setFieldErrors({}); }}
                className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </div>
          )}
          {tab === "registro" && (
            <div className="border-t border-[var(--border)] px-6 py-3 text-center">
              <button
                type="button"
                onClick={() => { setTab("cliente"); setError(""); setFieldErrors({}); resetRegisterForm(); }}
                className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                ¿Ya tienes cuenta? Ingresa aquí
              </button>
            </div>
          )}
        </div>
      </div>
      <Toast message={toastMessage} type={toastType} open={toastOpen} onClose={() => setToastOpen(false)} />
    </>
  );
}
