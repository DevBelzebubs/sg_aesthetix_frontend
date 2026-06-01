import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type SectionHeaderProps = {
  label?: string;
  breadcrumb?: BreadcrumbSegment[];
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SectionHeader({ label, breadcrumb, title, description, actions }: SectionHeaderProps) {
  return (
    <header className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {breadcrumb.map((segment, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={12} className="text-[var(--text-muted)]/50" />}
                  {segment.href ? (
                    <Link href={segment.href} className="transition hover:text-[var(--foreground)]">
                      {segment.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--foreground)]">{segment.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {label ?? "Administracion"}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
        </div>
        {actions}
      </div>
    </header>
  );
}
