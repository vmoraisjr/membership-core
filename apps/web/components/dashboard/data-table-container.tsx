import type { ReactNode } from "react";

import { SectionCard } from "@/components/dashboard/section-card";

type DataTableContainerProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DataTableContainer({
  title,
  description,
  action,
  children,
}: DataTableContainerProps) {
  return (
    <SectionCard
      title={title}
      description={description}
      action={action}
      contentClassName="overflow-hidden"
    >
      {children}
    </SectionCard>
  );
}
