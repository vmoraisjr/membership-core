import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";
import {
  getCurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { getWorkspaceBrand } from "@/features/auth/services/get-workspace-brand";
import { getBillingOverview } from "@/features/billing/services/billing-foundation";
import { canClinicOperate } from "@/features/billing/services/billing-foundation";

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

  if (currentUser.mustChangePassword) {
    redirect("/first-access");
  }

  const workspaceBrand =
    await getWorkspaceBrand();

  const hasOperationalAccess =
    currentUser.clinicId
      ? canClinicOperate(
          (
            await getBillingOverview()
          ).clinicSubscription?.status
        )
      : false;

  return (
    <MobileNavProvider>
      <div className="app-shell">
        <DashboardSidebar
          role={currentUser.role}
          currentUser={currentUser}
          hasClinicAssignment={Boolean(
            currentUser.clinicId
          )}
          hasOperationalAccess={
            hasOperationalAccess
          }
          workspaceBrand={workspaceBrand}
        />

        <div className="app-shell-main">
          <DashboardHeader
            role={currentUser.role}
            currentUser={currentUser}
            workspaceBrand={workspaceBrand}
          />

          <main className="app-shell-content">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
