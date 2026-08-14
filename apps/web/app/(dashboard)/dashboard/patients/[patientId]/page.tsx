import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { PatientProfilePage } from "@/features/patients/components/patient-profile-page";
import { renderOperationalClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";
import { clienteUrl, type CustomerTab } from "@/lib/company-routes";

const VALID_CUSTOMER_TABS: CustomerTab[] = [
  "overview",
  "membership",
  "benefits",
  "billing",
  "history",
];

function isCustomerTab(
  value: string | undefined
): value is CustomerTab {
  return VALID_CUSTOMER_TABS.some(
    (tab) => tab === value
  );
}

type PageProps = {
  params: Promise<{
    patientId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    returnTo?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: PageProps) {
  const { patientId } =
    await params;
  const { tab, returnTo } =
    await searchParams;
  const workspace = await getCurrentWorkspace();

  if (workspace.type === "clinic") {
    redirect(
      clienteUrl(patientId, {
        tab: isCustomerTab(tab)
          ? tab
          : undefined,
        returnTo,
      })
    );
  }

  return renderOperationalClinicScopedPage(
    <PatientProfilePage
      patientId={patientId}
      tab={tab}
      returnTo={returnTo}
    />
  );
}
