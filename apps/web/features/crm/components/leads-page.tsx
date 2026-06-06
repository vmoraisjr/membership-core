import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

import { getLeads } from "../services/get-leads";

import { LeadDialog } from "./lead-dialog";
import { LeadsTable } from "./leads-table";
import { PipelineBoard } from "./pipeline-board";

export async function LeadsPage() {
  const role =
    await getCurrentUserRole();

  if (!hasPermission(role, "crm", "view")) {
    return (
      <DashboardPage>
        <AccessDenied
          title="CRM access denied"
          description="The current role cannot view leads."
        />
      </DashboardPage>
    );
  }

  const [leads, plans] = await Promise.all([
    getLeads(),
    getMembershipPlans(),
  ]);

  const canManageCrm =
    hasPermission(role, "crm", "manage");
  const canManageSubscriptions =
    hasPermission(
      role,
      "subscriptions",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title="CRM"
        description="Track leads through the pipeline, convert them into patients, and keep the path to subscription visible."
        action={
          canManageCrm ? (
            <LeadDialog />
          ) : undefined
        }
      />

      <PipelineBoard leads={leads} />

      <LeadsTable
        leads={leads}
        plans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
        }))}
        canManageCrm={canManageCrm}
        canManageSubscriptions={
          canManageSubscriptions
        }
      />
    </DashboardPage>
  );
}
