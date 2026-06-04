import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role =
    await getCurrentUserRole();

  return (
    <div className="min-h-screen lg:flex">
      <DashboardSidebar role={role} />

      <div className="flex flex-1 flex-col">
        <DashboardHeader role={role} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
