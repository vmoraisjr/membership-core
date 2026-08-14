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
// otherwise land on Empresas (UI-049) — the subscription-status vocabulary
// here has no equivalent filter on the empresas list yet, so it's dropped
// rather than mistranslated.
export default async function BillingSubscriptionsRoute({
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
