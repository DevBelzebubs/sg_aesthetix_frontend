"use client";

import { useState } from "react";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  userId: string;
};

export function EmployeePasswordSection({ userId }: Props) {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async () => {
    if (!password || password.length < 6) {
      setError("La clave debe tener al menos 6 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ clave_hash: password })
        .eq("id", userId);
      if (updateError) throw new Error(updateError.message);
      setSuccess(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar clave");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[var(--background)] p-3">
          <KeyRound size={20} className="text-[var(--foreground)]" />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--foreground)]">Modificar clave</p>
          <p className="text-sm text-[var(--text-muted)]">Cambia la clave de acceso de esta persona.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName + " max-w-xs"}
          placeholder="Nueva clave"
        />
        <button
          type="button"
          onClick={handleChange}
          disabled={saving || !password}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Cambiar clave
        </button>
      </div>

      {success && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[var(--hover)]">
          <CheckCircle2 size={16} />
          Clave actualizada correctamente.
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
      )}
    </div>
  );
}
