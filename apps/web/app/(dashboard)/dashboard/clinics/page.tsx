import { redirect } from "next/navigation";

import { empresasUrl } from "@/lib/owner-routes";

// Legacy route — canonical is /dashboard/empresas (UI-049).
export default function ClinicsRoute() {
  redirect(empresasUrl());
}
