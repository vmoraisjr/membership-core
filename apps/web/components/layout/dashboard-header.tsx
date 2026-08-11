import type { AppRole } from "@/features/auth/constants/roles";
import { SHEEP_BRAND_NAME } from "@/lib/branding";
import type { WorkspaceBrand } from "@/lib/branding";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { MobileNavTrigger } from "./mobile-nav-trigger";
import { UserMenu } from "./user-menu";

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
  return (
    <header className="app-shell-header">
      <div className="mx-auto flex min-h-14 w-full max-w-[var(--app-max-width)] items-center justify-between gap-4 px-4 py-2.5 md:px-6 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNavTrigger />
          <BreadcrumbTrail />
        </div>

        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="hidden rounded-full bg-[color:var(--color-primary-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--color-primary-ink)] md:inline">
            {SHEEP_BRAND_NAME}{" "}
            {currentUser.clinicId
              ? workspaceBrand.displayName
              : "SaaS"}
          </span>
          <UserMenu role={role} currentUser={currentUser} />
        </div>
      </div>
    </header>
  );
}
