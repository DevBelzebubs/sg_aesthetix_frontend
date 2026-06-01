import type { ReactNode } from "react";
import { SectionHeader, type BreadcrumbSegment } from "@/components/dashboard/section-header";

type ModulePageShellProps = {
  title: string;
  description: string;
  breadcrumb?: BreadcrumbSegment[];
  actions?: ReactNode;
  children: ReactNode;
};

export function ModulePageShell({
  title,
  description,
  breadcrumb,
  actions,
  children,
}: ModulePageShellProps) {
  return (
    <section className="space-y-5">
      <SectionHeader
        breadcrumb={breadcrumb}
        title={title}
        description={description}
        actions={actions}
      />
      {children}
    </section>
  );
}
