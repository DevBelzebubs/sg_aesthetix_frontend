import type { ReactNode } from "react";

type ModulePageShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ModulePageShell({
  title,
  description,
  actions,
  children,
}: ModulePageShellProps) {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Gestión
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600">{description}</p>
          </div>
          {actions}
        </div>
      </header>

      {children}
    </section>
  );
}
