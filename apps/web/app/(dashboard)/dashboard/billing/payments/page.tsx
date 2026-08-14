import { redirect } from "next/navigation";

import {
  empresaUrl,
  empresasUrl,
} from "@/lib/owner-routes";

type Props = {
  searchParams: Promise<{
    clinicId?: string;
    planId?: string;
    status?: string;
  }>;
};

// Legacy route. With a company selected, go straight to its billing tab;
// otherwise land on Empresas (UI-049) — same rationale as billing/subscriptions.
export default async function BillingPaymentsRoute({
  searchParams,
}: Props) {
  const { clinicId } = await searchParams;

  if (clinicId) {
    redirect(
      empresaUrl(clinicId, {
        tab: "billing",
      })
    );
  }

  redirect(empresasUrl());
}
