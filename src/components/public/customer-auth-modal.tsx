"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, X, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { validateDni, validateEmail, validatePhone, validateRequired, validatePassword, validateDateOfBirth } from "@/lib/validators";
import { hashPin, verifyPin } from "@/lib/pin";

import { sendPinResetEmail } from "@/lib/email-client";

type Tab = "cliente" | "registro" | "admin" | "olvide-pin";

const MAX_INTENTOS = 3;

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

export function CustomerAuthModal() {
  const { session, modalOpen, closeModal, login, logout, refreshPoints } = useCustomerAuth();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Customer login fields

  const [loginPin, setLoginPin] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Register fields
  const [regNombres, setRegNombres] = useState("");
  const [regApellidos, setRegApellidos] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regFechaNacimiento, setRegFechaNacimiento] = useState("");
  const [regNuevoId, setRegNuevoId] = useState<string | null>(null);
  const [regNuevoNombres, setRegNuevoNombres] = useState("");
  const [regCodigo, setRegCodigo] = useState("");
  const [regStep, setRegStep] = useState<"form" | "verify" | "set-pin">("form");
  const [regPin, setRegPin] = useState("");
  const [regConfirmPin, setRegConfirmPin] = useState("");

  // Forgot PIN fields
  const [forgotEmail, setForgotEmail] = useState("");

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editNombres, setEditNombres] = useState("");
  const [editApellidos, setEditApellidos] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editConfirmPin, setEditConfirmPin] = useState("");
  const [showPinFields, setShowPinFields] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!session || tab !== "cliente") return;
    (async () => {
      try {
        const all = await CustomersService.getAll();
        const found = all.find((c) => c.id === session.id);
        if (found) {
          setEditNombres(found.nombres);
          setEditApellidos(found.apellidos ?? "");
          setEditTelefono(found.telefono ?? "");
          setEditEmail(found.correoElectronico ?? "");
        }
      } catch {}
    })();
  }, [session, tab, profileSaved]);

  if (!modalOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateRequired(regNombres, "Los nombres");
    const apellidoErr = validateRequired(regApellidos, "Los apellidos");
    const dniErr = validateDni(regDni);
    const emailErr = validateEmail(regEmail);
    const phoneErr = validatePhone(regTelefono);
    const dobErr = validateDateOfBirth(regFechaNacimiento);
    if (nameErr) errors.nombres = nameErr;
    if (apellidoErr) errors.apellidos = apellidoErr;
    if (dniErr) errors.regDni = dniErr;
    if (emailErr) errors.regEmail = emailErr;
    if (phoneErr) errors.regTelefono = phoneErr;
    if (dobErr) errors.regFechaNacimiento = dobErr;
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

      // Generate 6-digit verification code
      const codigo = String(Math.floor(100000 + Math.random() * 900000));

      const { hash: codeHash, salt: codeSalt } = await hashPin(codigo);

      const nuevo = await CustomersService.create({
        nombres: regNombres,
        apellidos: regApellidos,
        dni: regDni,
        telefono: regTelefono,
        correoElectronico: regEmail,
        fechaNacimiento: regFechaNacimiento,
        emailConfirmado: false,
      });

      await CustomersService.update(nuevo.id, {
        codigoVerificacionHash: codeHash,
        codigoVerificacionSalt: codeSalt,
        codigoVerificacionExpira: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      // Send email with verification code only
      if (regEmail) {
        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: regEmail,
              subject: "Verifica tu correo - ZonaFade",
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                  <h2 style="color:#111">¡Bienvenido a ZonaFade, ${regNombres}!</h2>
                  <p>Gracias por registrarte. Tu código de verificación es:</p>
                  <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
                    <span style="font-size:28px;font-weight:bold;letter-spacing:8px;color:#111">${codigo}</span>
                  </div>
                  <p style="color:#666;font-size:12px">Ingresa este código en la app para activar tu cuenta.</p>
                </div>`,
            }),
          });
        } catch (e) {
          console.error("[REGISTRO] Error al enviar código:", e);
        }
      }

      setRegNuevoId(nuevo.id);
      setRegNuevoNombres(nuevo.nombres);
      setRegStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNuevoId || !regCodigo || regCodigo.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: regNuevoId, codigo: regCodigo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto");

      setRegStep("set-pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!regPin || regPin.length !== 6) errors.pin = "El PIN debe tener exactamente 6 dígitos";
    if (regPin !== regConfirmPin) errors.confirmPin = "Los PIN no coinciden";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { hash, salt } = await hashPin(regPin);
      await CustomersService.updatePin(regNuevoId!, hash, salt);
      await login(regNuevoId!, regNuevoNombres);
      try { await RewardsService.claimWelcomeReward(regNuevoId!); } catch {}
      setTab("cliente");
      resetRegisterForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al configurar el PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const customer = await CustomersService.findByEmail(email);
      if (!customer) { setError("Correo no registrado"); setLoading(false); return; }

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

      await CustomersService.update(customer.id, { intentosFallidos: 0 });
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
    if (!forgotEmail) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const customer = await CustomersService.findByEmail(forgotEmail);
      if (!customer) {
        setError("Correo no registrado.");
        setLoading(false);
        return;
      }

      const tempPin = String(Math.floor(1000 + Math.random() * 9000));
      const { hash, salt } = await hashPin(tempPin);
      await CustomersService.updatePin(customer.id, hash, salt);
      await sendPinResetEmail(customer.id, forgotEmail, tempPin);
      setSuccessMsg("Se ha enviado un PIN temporal a tu correo. Revisa tu bandeja de entrada.");
      setForgotEmail("");
    } catch {
      setError("Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!session) return;
    setSavingProfile(true);
    setError("");
    try {
      await CustomersService.update(session.id, {
        nombres: editNombres.trim(),
        apellidos: editApellidos.trim(),
        telefono: editTelefono.trim(),
        correoElectronico: editEmail.trim(),
      });

      if (editPin.length === 6 && editPin === editConfirmPin) {
        const { hash, salt } = await hashPin(editPin);
        await CustomersService.updatePin(session.id, hash, salt);
      }

      setEditPin("");
      setEditConfirmPin("");
      setShowPinFields(false);
      setProfileSaved(true);
      setIsEditing(false);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingProfile(false);
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

  const resetRegisterForm = () => {
    setRegNombres("");
    setRegApellidos("");
    setRegEmail("");
    setRegDni("");
    setRegTelefono("");
    setRegFechaNacimiento("");
    setRegNuevoId(null);
    setRegNuevoNombres("");
    setRegCodigo("");
    setRegPin("");
    setRegConfirmPin("");
    setRegStep("form");
    setError("");
    setFieldErrors({});
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-2xl">
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
          <div className="px-6 py-6 space-y-5">
            <div className="text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Bienvenido, <strong>{session.nombres}</strong>
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight">{session.puntosDisponibles}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Puntos disponibles
              </p>
            </div>

            {profileSaved && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                <CheckCircle2 size={14} />
                Perfil actualizado
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                <AlertCircle size="14" className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Editar perfil
                </p>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Nombres</span>
                  <input type="text" value={editNombres} onChange={(e) => setEditNombres(e.target.value)} maxLength={100} className={fieldClass} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Apellidos</span>
                  <input type="text" value={editApellidos} onChange={(e) => setEditApellidos(e.target.value)} maxLength={100} className={fieldClass} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Teléfono</span>
                  <input type="tel" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} maxLength={15} className={fieldClass} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Email</span>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} maxLength={100} className={fieldClass} />
                </label>
                <button
                  type="button"
                  onClick={() => { setShowPinFields((v) => !v); setEditPin(""); setEditConfirmPin(""); }}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 transition hover:text-amber-500"
                >
                  <KeyRound size={14} />
                  {showPinFields ? "Ocultar cambio de PIN" : "Cambiar PIN"}
                </button>
                {showPinFields && (
                  <>
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Nuevo PIN</span>
                      <input type="password" value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 dígitos" inputMode="numeric" maxLength={6} className={fieldClass} autoComplete="new-password" />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Confirmar PIN</span>
                      <input type="password" value={editConfirmPin} onChange={(e) => setEditConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Repetir PIN" inputMode="numeric" maxLength={6} className={fieldClass} autoComplete="new-password" />
                    </label>
                  </>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setShowPinFields(false); }}
                    className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-[var(--background)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 rounded-xl bg-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-80 disabled:opacity-40"
                  >
                    {savingProfile ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => { refreshPoints(); }}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-[var(--background)]"
              >
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(true); setError(""); }}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-[var(--background)]"
              >
                Perfil
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
              Ingresa con tu correo y PIN
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
                maxLength={100}
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
                PIN <span className="text-[var(--destructive)]">*</span>
              </span>
              <input
                type="password"
                value={loginPin}
                onChange={(e) => { setLoginPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((prev) => ({ ...prev, loginPin: "" })); }}
                placeholder="••••••"
                maxLength={6}
                className={fieldClass}
              />
              {fieldErrors.loginPin && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.loginPin}
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
          regStep === "verify" ? (
            <form onSubmit={handleVerifyCode} className="px-6 py-8 space-y-4">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Mail className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-[var(--foreground)]">Verifica tu correo</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Enviamos un código de 6 dígitos a<br />
                  <strong className="text-[var(--foreground)]">{regEmail}</strong>
                </p>
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
                  inputMode="numeric"
                  value={regCodigo}
                  onChange={(e) => { setRegCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="123456"
                  maxLength={6}
                  className={fieldClass}
                  autoFocus
                />
              </label>

              <button
                type="submit"
                disabled={loading || regCodigo.length !== 6}
                className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Verificando..." : "Verificar y registrarme"}
              </button>

              <button
                type="button"
                onClick={() => { resetRegisterForm(); }}
                className="w-full text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                Volver al formulario
              </button>
            </form>
          ) : regStep === "set-pin" ? (
            <form onSubmit={handleSetPin} className="px-6 py-8 space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-2">
                Crea tu PIN de acceso
              </p>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                  <AlertCircle size="14" className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-sm text-[var(--text-muted)] text-center mb-4">
                Elige un PIN de 6 dígitos para acceder a tu cuenta.
              </p>

              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  PIN <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="password"
                  value={regPin}
                  onChange={(e) => { setRegPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((prev) => ({ ...prev, pin: "" })); }}
                  placeholder="••••••"
                  maxLength={4}
                  className={fieldClass}
                  autoFocus
                />
                {fieldErrors.pin && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.pin}
                  </p>
                )}
              </label>
              <label className="space-y-1.5 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Confirmar PIN <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="password"
                  value={regConfirmPin}
                  onChange={(e) => { setRegConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setFieldErrors((prev) => ({ ...prev, confirmPin: "" })); }}
                  placeholder="••••"
                  maxLength={4}
                  className={fieldClass}
                />
                {fieldErrors.confirmPin && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.confirmPin}
                  </p>
                )}
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Configurando..." : "Crear cuenta"}
              </button>

              <button
                type="button"
                onClick={() => { resetRegisterForm(); }}
                className="w-full text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                Volver al inicio
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="px-6 py-8 space-y-4">
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
                  maxLength={100}
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
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Apellidos <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="text"
                  value={regApellidos}
                  onChange={(e) => { setRegApellidos(e.target.value); setFieldErrors((prev) => ({ ...prev, apellidos: "" })); }}
                  placeholder="Tus apellidos"
                  maxLength={100}
                  className={fieldClass}
                />
                {fieldErrors.apellidos && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.apellidos}
                  </p>
                )}
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
                  maxLength={100}
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
                  Teléfono <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="text"
                  value={regTelefono}
                  onChange={(e) => { setRegTelefono(e.target.value); setFieldErrors((prev) => ({ ...prev, regTelefono: "" })); }}
                  placeholder="999 999 999"
                  maxLength={15}
                  className={fieldClass}
                />
                {fieldErrors.regTelefono && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.regTelefono}
                  </p>
                )}
              </label>
              <label className="space-y-1 block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Fecha de nacimiento <span className="text-[var(--destructive)]">*</span>
                </span>
                <input
                  type="date"
                  value={regFechaNacimiento}
                  onChange={(e) => { setRegFechaNacimiento(e.target.value); setFieldErrors((prev) => ({ ...prev, regFechaNacimiento: "" })); }}
                  className={fieldClass}
                />
                {fieldErrors.regFechaNacimiento && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                    <AlertCircle size={11} />
                    {fieldErrors.regFechaNacimiento}
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
          )
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
                maxLength={100}
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
                maxLength={72}
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
              onClick={() => { setTab("cliente"); setError(""); setFieldErrors({}); }}
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
