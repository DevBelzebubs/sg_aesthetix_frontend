"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, X, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomersService } from "@/services/customers.service";
import { validateEmail, validatePhone, validateRequired, validatePassword, validateDateOfBirth } from "@/lib/validators";
import { hashPin, verifyPin } from "@/lib/pin";

import { sendPinResetEmail } from "@/lib/email-client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void; auto_select?: boolean }) => void;
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; type?: string; shape?: string }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
        };
      };
    };
  }
}

type Tab = "cliente" | "registro" | "admin" | "olvide-pin";

const MAX_INTENTOS = 3;

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

export function CustomerAuthModal() {
  const { session, modalOpen, closeModal, login: customerLogin, logout: customerLogout, refreshPoints } = useCustomerAuth();
  const { login: adminLogin, role } = useAuth();
  const router = useRouter();

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

  // Google login
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleLogin = useCallback(async (credential: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de autenticación");
      await customerLogin(data.id, data.nombres);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con Google");
    } finally {
      setGoogleLoading(false);
    }
  }, [customerLogin, closeModal]);

  const googleCallbackRef = useRef<(credential: string) => void>(handleGoogleLogin);
  googleCallbackRef.current = handleGoogleLogin;

  useEffect(() => {
    if (!modalOpen || tab !== "cliente" || session) return;
    const scriptId = "google-gsi-modal-script";

    const initGoogle = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) googleCallbackRef.current(response.credential);
        },
        auto_select: false,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          type: "standard",
          shape: "rectangular",
        });
      }
    };

    if (document.getElementById(scriptId)) {
      setTimeout(initGoogle, 200);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [modalOpen, tab, session]);

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
    const emailErr = validateEmail(regEmail);
    const phoneErr = validatePhone(regTelefono);
    const dobErr = validateDateOfBirth(regFechaNacimiento);
    if (nameErr) errors.nombres = nameErr;
    if (apellidoErr) errors.apellidos = apellidoErr;
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

      const codigo = String(Math.floor(100000 + Math.random() * 900000));

      const { hash: codeHash, salt: codeSalt } = await hashPin(codigo);

      const nuevo = await CustomersService.create({
        nombres: regNombres,
        apellidos: regApellidos,
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

      if (regEmail) {
        const emailRes = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: regEmail,
            templateId: "template_nhrtjp9",
            templateParams: { to_name: regNombres, codigo },
          }),
        });
        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error("[REGISTRO] Error al enviar código:", errText);
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
      await customerLogin(regNuevoId!, regNuevoNombres);
      setSuccessMsg("Cuenta verificada. Bienvenido.");
      resetRegisterForm();
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

      const tempPin = String(Math.floor(100000 + Math.random() * 900000));
      const { hash, salt } = await hashPin(tempPin);
      await CustomersService.updatePin(customer.id, hash, salt);
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: forgotEmail,
          templateId: "template_nhrtjp9",
          templateParams: { to_name: customer.nombres || forgotEmail.split("@")[0], pin: tempPin },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[OLVIDE-PIN] API error:", res.status, errText);
        throw new Error(errText.includes("no configurado") ? "El servicio de correo no está configurado. Consulta al administrador." : `Error al enviar el correo (${res.status}): ${errText}`);
      }
      setSuccessMsg("Se ha enviado un PIN temporal a tu correo. Revisa tu bandeja de entrada.");
      setForgotEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la solicitud.");
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
      await adminLogin({ email, password, slug: "" });
      closeModal();
      router.push(role === "empleado" ? "/empleado" : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    if (!loginPin || loginPin.length !== 6) errors.loginPin = "El PIN debe tener 6 dígitos";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const customer = await CustomersService.findByEmail(email);
      if (!customer) {
        setError("Correo no registrado.");
        setLoading(false);
        return;
      }
      if (!customer.pinHash || !customer.pinSalt) {
        setError("Esta cuenta no tiene PIN configurado.");
        setLoading(false);
        return;
      }
      if (customer.bloqueadoHasta && new Date(customer.bloqueadoHasta) > new Date()) {
        setError("Cuenta bloqueada temporalmente. Intenta más tarde.");
        setLoading(false);
        return;
      }
      const valido = await verifyPin(loginPin, customer.pinSalt, customer.pinHash);
      if (!valido) {
        const nuevosIntentos = (customer.intentosFallidos ?? 0) + 1;
        const updateData: Record<string, unknown> = { intentosFallidos: nuevosIntentos };
        if (nuevosIntentos >= MAX_INTENTOS) {
          updateData.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await CustomersService.update(customer.id, updateData as import("@/types/customer").UpdateCustomerPayload);
        setError(
          nuevosIntentos >= MAX_INTENTOS
            ? "Demasiados intentos. Cuenta bloqueada por 15 minutos."
            : `PIN incorrecto. Intento ${nuevosIntentos} de ${MAX_INTENTOS}.`,
        );
        setLoading(false);
        return;
      }
      await CustomersService.updatePin(customer.id, customer.pinHash, customer.pinSalt);
      await customerLogin(customer.id, customer.nombres);
      closeModal();
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const resetRegisterForm = () => {
    setRegNombres("");
    setRegApellidos("");
    setRegEmail("");
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
                onClick={() => { customerLogout(); closeModal(); }}
                className="flex-1 rounded-xl border border-[var(--destructive-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : tab === "cliente" ? (
          <>
            <div className="px-6 pt-6 flex flex-col items-center gap-3">
              <div
                ref={googleBtnRef}
                className="min-h-[40px] flex items-center justify-center"
              />
              {googleLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs text-[var(--text-muted)]">Verificando...</span>
                </div>
              )}
            </div>
            <div className="px-6 mb-2 flex items-center gap-4">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">o</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
          <form onSubmit={handleCustomerLogin} className="px-6 pb-8 space-y-4">
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
                type="text"
                inputMode="numeric"
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

            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => { setTab("olvide-pin"); setError(""); setFieldErrors({}); setForgotEmail(email); }}
                className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
              >
                {error?.includes("PIN") ? "Enviar PIN a mi correo" : "Olvidé mi PIN"}
              </button>
            </div>
          </form>
          </>
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

              <button
                type="button"
                onClick={async () => {
                  if (!regNuevoId || !regEmail || !regNuevoNombres) return;
                  const codigo = String(Math.floor(100000 + Math.random() * 900000));
                  const { hash, salt } = await hashPin(codigo);
                  await CustomersService.update(regNuevoId, {
                    codigoVerificacionHash: hash,
                    codigoVerificacionSalt: salt,
                    codigoVerificacionExpira: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                  });
                  const res = await fetch("/api/email/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: regEmail,
                      templateId: "template_nhrtjp9",
                      templateParams: { to_name: regNuevoNombres, codigo },
                    }),
                  });
                  if (res.ok) setError(""); else setError("No se pudo reenviar el código. Intenta más tarde.");
                }}
                className="w-full text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--hover)] hover:underline transition"
              >
                Reenviar código
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
                  type="text"
                  inputMode="numeric"
                  value={regPin}
                  onChange={(e) => { setRegPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((prev) => ({ ...prev, pin: "" })); }}
                  placeholder="••••••"
                  maxLength={6}
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
                  type="text"
                  inputMode="numeric"
                  value={regConfirmPin}
                  onChange={(e) => { setRegConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((prev) => ({ ...prev, confirmPin: "" })); }}
                  placeholder="••••••"
                  maxLength={6}
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
        ) : tab === "olvide-pin" ? (
          <form onSubmit={handleForgotPin} className="px-6 py-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center mb-4">
              Recuperar PIN
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                <AlertCircle size="14" className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-500">
                <CheckCircle2 size="14" className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {!successMsg && (
              <>
                <p className="text-sm text-[var(--text-muted)] text-center">
                  Ingresa tu correo y te enviaremos un PIN temporal.
                </p>
                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Email <span className="text-[var(--destructive)]">*</span>
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setError(""); }}
                    placeholder="tu@correo.com"
                    maxLength={100}
                    className={fieldClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || !forgotEmail}
                  className="w-full rounded-xl bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Enviando..." : "Enviar PIN temporal"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setTab("cliente"); setError(""); setSuccessMsg(""); setForgotEmail(""); setFieldErrors({}); }}
              className="w-full text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
            >
              Volver a inicio de sesión
            </button>
          </form>
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
        {tab === "olvide-pin" && (
          <div className="border-t border-[var(--border)] px-6 py-3 text-center">
            <button
              type="button"
              onClick={() => { setTab("cliente"); setError(""); setSuccessMsg(""); setForgotEmail(""); setFieldErrors({}); }}
              className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
            >
              Volver a inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
