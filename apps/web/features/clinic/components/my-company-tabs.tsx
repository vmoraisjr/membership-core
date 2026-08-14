import Link from "next/link";

import type { AppRole } from "@/features/auth/constants/roles";
import { hasPermission } from "@/features/rbac/permissions";
import {
  minhaEmpresaUrl,
  type MyCompanyTab,
} from "@/lib/company-routes";

const TABS: Array<{
  id: MyCompanyTab;
  label: string;
  resource: "clinic" | "users" | "modules" | "messages";
}> = [
  {
    id: "profile",
    label: "Perfil",
    resource: "clinic",
  },
  {
    id: "subscription",
    label: "Assinatura Sheep",
    resource: "clinic",
  },
  {
    id: "team",
    label: "Equipe",
    resource: "users",
  },
  {
    id: "resources",
    label: "Recursos",
    resource: "modules",
  },
  {
    id: "support",
    label: "Suporte",
    resource: "messages",
  },
];

type Props = {
  activeTab: MyCompanyTab;
  role: AppRole;
};

/**
 * Shared tab strip for /dashboard/minha-empresa (UI-066). Each tab still
 * reuses its own existing page (perfil/assinatura, Equipe, Recursos,
 * Suporte) — this only gives them one consistent, always-reachable
 * navigation surface instead of separate unrelated screens.
 *
 * Every destination already enforces its own `hasPermission` check when
 * rendered — this filter only keeps the strip itself from ever pointing at
 * a tab the current role would immediately be denied, which would read as
 * a misleading shortcut (UI-067).
 */
export function MyCompanyTabs({
  activeTab,
  role,
}: Props) {
  const visibleTabs = TABS.filter((tab) =>
    hasPermission(
      role,
      tab.resource,
      "view"
    )
  );

  return (
    <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.id}
          href={minhaEmpresaUrl({
            tab: tab.id,
          })}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-ink)]"
              : "text-muted-foreground hover:bg-[color:var(--color-surface-subtle)] hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
