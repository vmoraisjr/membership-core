import type { ReactNode } from "react";

import { redirect } from "next/navigation";
import { ModuleKey } from "@prisma/client";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  getCurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { assertModuleEnabled } from "@/features/modules/services/module-access";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login?next=/dashboard");
  }

  if (currentUser.clinicId) {
    await assertModuleEnabled(
      ModuleKey.MEMBERSHIP
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <DashboardSidebar
        role={currentUser.role}
      />

      <div className="flex flex-1 flex-col">
        <DashboardHeader
          role={currentUser.role}
          currentUser={currentUser}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
