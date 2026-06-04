import type { AppRole } from "@/features/auth/constants/roles";
import { getRoleLabel } from "@/features/auth/constants/roles";
import { RoleSwitcher } from "@/features/auth/components/role-switcher";

type Props = {
  role: AppRole;
};

export function DashboardHeader({
  role,
}: Props) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 md:px-6">
      <div>
        <h2 className="font-semibold tracking-tight">
          Operations
        </h2>

        <p className="text-sm text-muted-foreground">
          {getRoleLabel(role)} workspace
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <RoleSwitcher currentRole={role} />
        <span>Membership Core SaaS</span>
      </div>
    </header>
  );
}
