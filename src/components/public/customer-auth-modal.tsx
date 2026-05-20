"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomersService } from "@/services/customers.service";
import { RewardsService } from "@/services/rewards.service";
import { X } from "lucide-react";

type Tab = "cliente" | "admin";

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

  if (!modalOpen) return null;

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message === "Invalid login credentials"
          ? "Credenciales incorrectas"
          : authError.message);
        return;
      }
      closeModal();
      router.push("/admin");
    } catch {
      setError("Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative w-full max-w-sm border border-black/10 bg-white shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 flex items-center justify-center border border-black/10 p-1.5 text-neutral-400 hover:text-black transition"
        >
          <X size="14" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-black/10">
          <button
            type="button"
            onClick={() => setTab("cliente")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              tab === "cliente" ? "bg-black text-white" : "bg-neutral-50 text-neutral-500 hover:text-black"
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setTab("admin")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              tab === "admin" ? "bg-black text-white" : "bg-neutral-50 text-neutral-500 hover:text-black"
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
            <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">
              Puntos disponibles
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { refreshPoints(); }}
                className="flex-1 border border-black/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-neutral-50"
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
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400 text-center mb-4">
              Ingresa con tu DNI y email
            </p>
            <label className="space-y-1.5 block">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">Email</span>
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
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">DNI</span>
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
        ) : (
          <form onSubmit={handleAdminLogin} className="px-6 py-8 space-y-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400 text-center mb-4">
              Acceso administrativo
            </p>
            <label className="space-y-1.5 block">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">Email</span>
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
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">Contraseña</span>
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
        <div className="border-t border-black/10 px-6 py-3 text-center">
          <a
            href="/promocion"
            onClick={(e) => { e.preventDefault(); closeModal(); }}
            className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400 hover:text-black transition"
          >
            ¿No tienes cuenta? Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
}
