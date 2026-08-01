import { redirect } from "next/navigation";

import { BillingPage } from "@/features/billing/components/billing-page";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";

export default async function Page() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser?.clinicId) {
    redirect("/dashboard/billing/catalog");
  }

  return <BillingPage />;
}
