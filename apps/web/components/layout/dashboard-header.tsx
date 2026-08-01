import type { AppRole } from "@/features/auth/constants/roles";
import { getRoleLabel } from "@/features/auth/constants/roles";
import { logoutAction } from "@/features/auth/actions/logout";
import { getTranslations } from "@/i18n/messages";
import { SHEEP_BRAND_NAME } from "@/lib/branding";
import type { WorkspaceBrand } from "@/lib/branding";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { Button } from "@/components/ui/button";

type Props = {
  role: AppRole;
  currentUser: {
    id: string;
    clinicId: string | null;
    name: string;
    email: string;
    role: AppRole;
  };
  workspaceBrand: WorkspaceBrand;
};

export function DashboardHeader({
  role,
  currentUser,
  workspaceBrand,
}: Props) {
  const t = getTranslations();

  return (
    <header className="app-shell-header">
      <div className="mx-auto flex min-h-24 w-full max-w-[var(--app-max-width)] items-center justify-between gap-4 px-4 py-4 md:px-6 xl:px-10">
        <div className="min-w-0 space-y-2">
          <BreadcrumbTrail />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {workspaceBrand.workspaceLabel}
          </p>
          <h2 className="text-[1.05rem] leading-7 font-semibold tracking-tight text-foreground">
            {currentUser.clinicId
              ? t(
                  "dashboardLayout.operations"
                )
              : "Gestão da plataforma"}
          </h2>

          <p className="truncate text-sm leading-6 text-muted-foreground">
            {getRoleLabel(role)}{" "}
            {currentUser.clinicId
              ? t(
                  "dashboardLayout.workspaceSuffix"
                )
              : "na plataforma"}{" "}
            · {workspaceBrand.displayName}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {!currentUser.clinicId ? (
            <span className="hidden rounded-full border border-border/70 bg-[color:var(--color-surface-subtle)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] md:inline">
              {SHEEP_BRAND_NAME} SaaS
            </span>
          ) : null}
          <div className="hidden rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-right shadow-[var(--shadow-xs)] md:block">
            <div className="text-sm font-medium text-foreground">
              {currentUser.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentUser.email}
            </div>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
            >
              {t("shared.actions.signOut")}
            </Button>
          </form>
          {currentUser.clinicId ? (
            <span className="hidden text-xs uppercase tracking-[0.18em] md:inline">
              {t("dashboardLayout.saasLabel")}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
