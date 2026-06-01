"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-xl p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)] disabled:opacity-30"
      >
        <ChevronLeft size={18} />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`min-w-[2.25rem] rounded-xl px-2 py-1.5 text-sm font-semibold transition ${
            p === page
              ? "bg-[var(--hover)] text-white"
              : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-xl p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)] disabled:opacity-30"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
