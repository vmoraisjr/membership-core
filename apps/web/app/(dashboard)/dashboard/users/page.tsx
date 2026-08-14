import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { minhaEmpresaUrl } from "@/lib/company-routes";
import { administracaoUrl } from "@/lib/owner-routes";

type Props = {
  searchParams: Promise<{
    inviteCreated?: string;
    inviteEmail?: string;
    inviteRole?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
    inviteError?: string;
  }>;
};

// Shared route: platform owners get redirected to Administração > Equipe
// Sheep (UI-049); clinic-scoped users keep this URL for their own team.
export default async function DashboardUsersPage({
  searchParams,
}: Props) {
  const [workspace, params] =
    await Promise.all([
      getCurrentWorkspace(),
      searchParams,
    ]);

  if (workspace.type === "platform") {
    redirect(
      administracaoUrl({
        tab: "team",
        ...params,
      })
    );
  }

  redirect(
    minhaEmpresaUrl({
      tab: "team",
      ...params,
    })
  );
}
