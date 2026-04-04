"use client";

import { useState } from "react";
import { Gift, PencilLine, Plus, Trash2 } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

type LoyaltyRule = {
  id: string;
  name: string;
  earnRate: string;
  redeemValue: string;
  status: "Activa" | "Pausada";
  note: string;
};

const initialRules: LoyaltyRule[] = [
  {
    id: "rule-01",
    name: "Regla general",
    earnRate: "1 punto por S/ 1",
    redeemValue: "100 pts = S/ 10",
    status: "Activa",
    note: "Aplica a todos los servicios excepto promociones flash.",
  },
  {
    id: "rule-02",
    name: "Bono cumpleanos",
    earnRate: "50 puntos extra",
    redeemValue: "Uso unico",
    status: "Pausada",
    note: "Revisar automatizacion por fecha.",
  },
];

const emptyDraft: LoyaltyRule = {
  id: "",
  name: "",
  earnRate: "",
  redeemValue: "",
  status: "Activa",
  note: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function LoyaltyManagement() {
  const [rules, setRules] = useState(initialRules);
  const [selectedId, setSelectedId] = useState(initialRules[0]?.id ?? "");
  const [draft, setDraft] = useState(initialRules[0] ?? emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const selectedRule = rules.find((rule) => rule.id === selectedId);

  const handleSelect = (rule: LoyaltyRule) => {
    setSelectedId(rule.id);
    setDraft(rule);
  };

  const handleCreateMode = () => {
    setSelectedId("");
    setDraft(emptyDraft);
  };

  const handleSave = () => {
    if (!draft.name || !draft.earnRate) {
      return;
    }

    if (!selectedId) {
      const nextRule = { ...draft, id: slugify(draft.name) };
      setRules((current) => [nextRule, ...current]);
      setSelectedId(nextRule.id);
      setDraft(nextRule);
      return;
    }

    setRules((current) =>
      current.map((rule) => (rule.id === selectedId ? { ...draft, id: selectedId } : rule)),
    );
  };

  const handleDelete = () => {
    if (!selectedId) {
      return;
    }

    const nextRules = rules.filter((rule) => rule.id !== selectedId);
    setRules(nextRules);

    if (nextRules.length === 0) {
      setSelectedId("");
      setDraft(emptyDraft);
      return;
    }

    setSelectedId(nextRules[0].id);
    setDraft(nextRules[0]);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.95fr]">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCreateMode}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <Plus size={16} />
            Nuevo beneficio
          </button>
        </div>

        <div className="grid gap-4">
          {rules.map((rule) => (
            <article
              key={rule.id}
              onClick={() => handleSelect(rule)}
              className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition ${
                selectedId === rule.id
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50"
                  : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-zinc-900">{rule.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{rule.earnRate}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rule.status === "Activa" ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"}`}>
                  {rule.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Uso</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">{rule.redeemValue}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Nota</p>
                  <p className="mt-2 text-sm text-zinc-700">{rule.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-zinc-100 p-3">
              <Gift size={18} className="text-zinc-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {selectedId ? "Editar beneficio" : "Crear beneficio"}
              </p>
              <p className="text-sm text-zinc-600">Define como gana y usa sus beneficios el cliente.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <Field label="Nombre">
              <input
                className={inputClassName}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Como se gana">
              <input
                className={inputClassName}
                value={draft.earnRate}
                onChange={(event) => setDraft((current) => ({ ...current, earnRate: event.target.value }))}
              />
            </Field>
            <Field label="Como se usa">
              <input
                className={inputClassName}
                value={draft.redeemValue}
                onChange={(event) => setDraft((current) => ({ ...current, redeemValue: event.target.value }))}
              />
            </Field>
            <Field label="Estado">
              <select
                className={inputClassName}
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as LoyaltyRule["status"],
                  }))
                }
              >
                <option>Activa</option>
                <option>Pausada</option>
              </select>
            </Field>
            <Field label="Nota">
              <textarea
                className={`${inputClassName} min-h-28 resize-none`}
                value={draft.note}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <PencilLine size={16} />
              {selectedId ? "Guardar beneficio" : "Crear beneficio"}
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={!selectedRule}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo beneficio"}
        description={
          selectedId
            ? "Se guardaran los cambios hechos en este beneficio."
            : "Se creara un nuevo beneficio con los datos que llenaste."
        }
        confirmLabel={selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          handleSave();
          setIsConfirmOpen(false);
        }}
      />

      <ConfirmationModal
        open={isDeleteConfirmOpen}
        title="Confirmar eliminacion"
        description="Este beneficio se eliminara de la lista actual."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteConfirmOpen(false);
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function slugify(value: string) {
  return `rule-${value.toLowerCase().trim().replace(/\s+/g, "-")}`;
}
