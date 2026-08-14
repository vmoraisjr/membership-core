import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { minhaEmpresaUrl } from "@/lib/company-routes";
import { planosComerciaisUrl } from "@/lib/owner-routes";

// Shared route: platform owners get redirected to the canonical Planos
// comerciais hub (UI-049); clinic-scoped users keep this URL — Módulos is
// still how a company manages its own modules, untouched by Fase 4.
export default async function Page() {
  const workspace =
    await getCurrentWorkspace();

  if (workspace.type === "platform") {
    redirect(
      planosComerciaisUrl({
        tab: "modules",
      })
    );
  }

  redirect(
    minhaEmpresaUrl({
      tab: "resources",
    })
  );
}
