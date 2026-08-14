import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { minhaEmpresaUrl } from "@/lib/company-routes";
import { chamadosUrl } from "@/lib/owner-routes";

type PageProps = {
  searchParams: Promise<{
    threadId?: string;
    category?: string;
    status?: string;
    clinicId?: string;
  }>;
};

// Shared route: platform owners get redirected to the canonical Chamados
// queue (UI-049); clinic-scoped users keep this URL unchanged.
export default async function MessagesPage({
  searchParams,
}: PageProps) {
  const [workspace, resolvedSearchParams] =
    await Promise.all([
      getCurrentWorkspace(),
      searchParams,
    ]);

  if (workspace.type === "platform") {
    redirect(
      chamadosUrl(resolvedSearchParams)
    );
  }

  redirect(
    minhaEmpresaUrl({
      tab: "support",
      threadId: resolvedSearchParams.threadId,
      category: resolvedSearchParams.category,
      status: resolvedSearchParams.status,
    })
  );
}
