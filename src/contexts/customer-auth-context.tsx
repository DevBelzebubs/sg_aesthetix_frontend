"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { RewardsService } from "@/services/rewards.service";
import type { CuentaPuntos } from "@/types/reward";

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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CustomerSession;
        setSession(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const refreshPoints = async () => {
    if (!session) return;
    try {
      const cuenta = await RewardsService.getCuentaPuntosByClienteId(session.id);
      if (cuenta) {
        const updated = { ...session, puntosDisponibles: cuenta.puntosDisponibles };
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
