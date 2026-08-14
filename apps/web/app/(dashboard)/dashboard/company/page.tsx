import { redirect } from "next/navigation";

import { CompanyProfilePage } from "@/features/clinic/components/company-profile-page";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { renderClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { minhaEmpresaUrl } from "@/lib/company-routes";

type Props = {
  searchParams: Promise<{
    tab?: string;
    checkout?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const { tab, checkout } =
    await searchParams;
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(
      minhaEmpresaUrl({
        tab:
          tab === "assinatura"
            ? "subscription"
            : "profile",
        checkout:
          checkout === "success" ||
          checkout === "canceled"
            ? checkout
            : undefined,
      })
    );
  }

  return renderClinicScopedPage(
    <CompanyProfilePage
      activeTab={
        tab === "assinatura"
          ? "subscription"
          : "profile"
      }
      checkoutReturn={
        checkout === "success" ||
        checkout === "canceled"
          ? checkout
          : undefined
      }
    />
  );
}
