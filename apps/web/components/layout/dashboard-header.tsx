import type { AppRole } from "@/features/auth/constants/roles";
import { getRoleLabel } from "@/features/auth/constants/roles";
import { logoutAction } from "@/features/auth/actions/logout";
import { getTranslations } from "@/i18n/messages";

type Props = {
  role: AppRole;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
  };
};

export function DashboardHeader({
  role,
  currentUser,
}: Props) {
  const t = getTranslations();

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 md:px-6">
      <div>
        <h2 className="font-semibold tracking-tight">
          {t("dashboardLayout.operations")}
        </h2>

        <p className="text-sm text-muted-foreground">
          {getRoleLabel(role)}{" "}
          {t("dashboardLayout.workspaceSuffix")}
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="hidden text-right md:block">
          <div className="text-sm font-medium text-foreground">
            {currentUser.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentUser.email}
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t("shared.actions.signOut")}
          </button>
        </form>
        <span>
          {t("dashboardLayout.saasLabel")}
        </span>
      </div>
    </header>
  );
}
