"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { RewardsService } from "@/services/rewards.service";
import { getRealtimeClient } from "@/lib/supabase/realtime";

type CustomerSession = {
  id: string;
  nombres: string;
  puntosDisponibles: number;
};

type CustomerAuthContextValue = {
  session: CustomerSession | null;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (customerId: string, nombres: string) => Promise<void>;
  logout: () => void;
  refreshPoints: () => Promise<void>;
};

const STORAGE_KEY = "sg_customer_session";

const CustomerAuthContext = createContext<CustomerAuthContextValue>({
  session: null,
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  login: async () => {},
  logout: () => {},
  refreshPoints: async () => {},
});

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const sessionRef = useRef<CustomerSession | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as CustomerSession;
      setSession(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshPoints = async () => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      const cuenta = await RewardsService.getCuentaPuntosByClienteId(current.id);
      if (cuenta) {
        const updated = { ...current, puntosDisponibles: cuenta.puntosDisponibles };
        setSession(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
  };

  const login = async (customerId: string, nombres: string) => {
    let puntosDisponibles = 0;
    try {
      const cuenta = await RewardsService.getCuentaPuntosByClienteId(customerId);
      if (cuenta) puntosDisponibles = cuenta.puntosDisponibles;
    } catch {}
    const newSession: CustomerSession = { id: customerId, nombres, puntosDisponibles };
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const clienteId = session?.id;
    if (!clienteId) return;

    const supabase = getRealtimeClient();

    const channel = supabase
      .channel(`cuenta_puntos:cliente_id=eq.${clienteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cuenta_puntos",
          filter: `cliente_id=eq.${clienteId}`,
        },
        () => {
          refreshPoints();
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Suscrito a cuenta_puntos del cliente ${clienteId}`);
        }
        if (err) {
          console.warn("[Realtime] Error de suscripción:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  return (
    <CustomerAuthContext.Provider
      value={{ session, modalOpen, openModal: () => setModalOpen(true), closeModal: () => setModalOpen(false), login, logout, refreshPoints }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
