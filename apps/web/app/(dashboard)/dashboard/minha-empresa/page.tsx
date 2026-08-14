import { CompanyProfilePage } from "@/features/clinic/components/company-profile-page";
import { SupportThreadsPage } from "@/features/messages/components/support-threads-page";
import { ModulesPage } from "@/features/modules/components/modules-page";
import { renderClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { UsersPage } from "@/features/users/components/users-page";

type Props = {
  searchParams: Promise<{
    tab?: string;
    checkout?: string;
    threadId?: string;
    category?: string;
    status?: string;
    inviteCreated?: string;
    inviteEmail?: string;
    inviteRole?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
    inviteError?: string;
  }>;
};

// Canonical company route (Fase 6, UI-059). Each destination reuses its
// existing implementation and now shares one tab strip (MyCompanyTabs,
// UI-066) instead of living as unrelated screens.
export default async function MinhaEmpresaRoute({
  searchParams,
}: Props) {
  const params = await searchParams;

  return renderClinicScopedPage(
    params.tab === "team" ? (
      <UsersPage searchParams={params} />
    ) : params.tab === "resources" ? (
      <ModulesPage />
    ) : params.tab === "support" ? (
      <SupportThreadsPage
        filters={{
          threadId: params.threadId,
          category: params.category,
          status: params.status,
        }}
      />
    ) : (
      <CompanyProfilePage
        activeTab={
          params.tab === "subscription"
            ? "subscription"
            : "profile"
        }
        checkoutReturn={
          params.checkout === "success" ||
          params.checkout === "canceled"
            ? params.checkout
            : undefined
        }
      />
    )
  );
}
