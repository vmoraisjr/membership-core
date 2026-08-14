import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { cobrancasUrl } from "@/lib/company-routes";
import { planosComerciaisUrl } from "@/lib/owner-routes";

export default async function Page() {
  const currentUser =
    await getCurrentAppUser();

  redirect(
    currentUser?.clinicId
      ? cobrancasUrl()
      : planosComerciaisUrl({
          tab: "plans",
        })
  );
}
