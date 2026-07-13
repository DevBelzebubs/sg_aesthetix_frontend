"use client";
import { useEffect } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type?: ToastType;
  open: boolean;
  onClose: () => void;
  duration?: number;
  position?: "bottom-right" | "top-right";
};

export function Toast({ message, type = "success", open, onClose, duration = 4000, position = "bottom-right" }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  const positionClass = position === "top-right" ? "top-6 right-6" : "bottom-6 right-6";

  return (
    <div className={`fixed z-50 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-4 shadow-lg ${positionClass}`}>
      <Icon
        size={22}
        className={type === "success" ? "text-emerald-500" : "text-[var(--destructive)]"}
      />
      <p className="text-base font-semibold text-[var(--foreground)]">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}
