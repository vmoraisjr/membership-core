import type { ReactNode } from "react";

export function DashboardPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {children}
    </div>
  );
}