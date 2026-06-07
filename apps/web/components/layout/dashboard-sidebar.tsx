"use client";

import Link from "next/link";

import {
  BadgePercent,
  Building2,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShieldCheck,
  SquareStack,
  Users,
} from "lucide-react";

import { usePathname } from "next/navigation";

import type { AppRole } from "@/features/auth/constants/roles";
import { hasPermission, type AppResource } from "@/features/rbac/permissions";
import { useTranslations } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const items = [
  {
    label: "navigation.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    resource: "dashboard",
  },

  {
    label: "navigation.clinics",
    href: "/dashboard/clinics",
    icon: Building2,
    resource: "clinic",
  },

  {
    label: "navigation.membershipPlans",
    href: "/dashboard/plans",
    icon: SquareStack,
    resource: "plans",
  },

  {
    label: "navigation.patients",
    href: "/dashboard/patients",
    icon: Users,
    resource: "patients",
  },

  {
    label: "navigation.subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
    resource: "subscriptions",
  },

  {
    label: "navigation.benefits",
    href: "/dashboard/benefits",
    icon: BadgePercent,
    resource: "benefits",
  },

  {
    label: "navigation.benefitUsage",
    href: "/dashboard/benefit-usage",
    icon: History,
    resource: "benefitUsage",
  },

  {
    label: "navigation.payments",
    href: "/dashboard/payments",
    icon: ReceiptText,
    resource: "billing",
  },

  {
    label: "navigation.modules",
    href: "/dashboard/modules",
    icon: Package,
    resource: "modules",
  },

  {
    label: "navigation.auditLog",
    href: "/dashboard/audit-logs",
    icon: ClipboardList,
    resource: "auditLogs",
  },

  {
    label: "navigation.users",
    href: "/dashboard/users",
    icon: ShieldCheck,
    resource: "users",
  },
].map((item) => item as {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  resource: AppResource;
});

type Props = {
  role: AppRole;
};

export function DashboardSidebar({
  role,
}: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const visibleItems = items.filter(
    (item) =>
      hasPermission(
        role,
        item.resource,
        "view"
      )
  );

  return (
    <aside className="border-b border-border/60 bg-muted/30 p-4 lg:w-72 lg:border-r lg:border-b-0 lg:p-6">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("app.name")}
          </h1>

          <p className="text-sm text-muted-foreground">
            {t("navigation.workspace")}
          </p>
        </div>

        <nav className="flex flex-wrap gap-1.5 lg:flex-col">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(
                  `${item.href}/`
                ));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="size-4" />

                {t(item.label)}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
