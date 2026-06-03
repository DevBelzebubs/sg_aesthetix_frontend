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
};

export function Toast({ message, type = "success", open, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3.5 shadow-lg">
      <Icon
        size={18}
        className={type === "success" ? "text-emerald-500" : "text-[var(--destructive)]"}
      />
      <p className="text-sm font-medium text-[var(--foreground)]">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
