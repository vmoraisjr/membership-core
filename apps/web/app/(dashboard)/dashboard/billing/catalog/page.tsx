import { redirect } from "next/navigation";

import { planosComerciaisUrl } from "@/lib/owner-routes";

type Props = {
  searchParams: Promise<{
    query?: string;
    availability?: string;
  }>;
};

// Legacy route — canonical is /dashboard/planos-comerciais?tab=plans (UI-049).
export default async function BillingCatalogRoute({
  searchParams,
}: Props) {
  const { query, availability } =
    await searchParams;

  redirect(
    planosComerciaisUrl({
      tab: "plans",
      query,
      availability,
    })
  );
}
