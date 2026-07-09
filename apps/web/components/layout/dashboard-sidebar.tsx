"use client";

import { useState } from "react";

import Link from "next/link";
import { BrandMark } from "@/components/branding/brand-mark";

import {
  BadgePercent,
  Building2,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  MessageSquareMore,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ShieldCheck,
  SquareStack,
  Users,
} from "lucide-react";

import { usePathname } from "next/navigation";

import type { AppRole } from "@/features/auth/constants/roles";
import { hasPermission, type AppResource } from "@/features/rbac/permissions";
import { useTranslations } from "@/i18n/provider";
import type { WorkspaceBrand } from "@/lib/branding";
import { cn } from "@/lib/utils";

const items = [
  {
    section: "root",
    label: "navigation.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    resource: "dashboard",
  },

  {
    section: "operation",
    label: "navigation.clinics",
    platformLabel: "Empresas clientes",
    href: "/dashboard/clinics",
    icon: Building2,
    resource: "clinic",
    platformOnly: true,
  },

  {
    section: "operation",
    label: "navigation.membershipPlans",
    href: "/dashboard/plans",
    icon: SquareStack,
    resource: "plans",
  },

  {
    section: "operation",
    label: "navigation.patients",
    href: "/dashboard/patients",
    icon: Users,
    resource: "patients",
  },

  {
    section: "operation",
    label: "navigation.subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
    resource: "subscriptions",
  },

  {
    section: "operation",
    label: "navigation.benefits",
    href: "/dashboard/benefits",
    icon: BadgePercent,
    resource: "benefits",
  },

  {
    section: "relationship",
    label: "navigation.benefitUsage",
    href: "/dashboard/benefit-usage",
    icon: History,
    resource: "benefitUsage",
  },

  {
    section: "finance",
    label: "navigation.payments",
    href: "/dashboard/payments",
    icon: ReceiptText,
    resource: "billing",
    clinicOnly: true,
  },

  {
    section: "finance",
    label: "navigation.payments",
    platformLabel: "Assinaturas SaaS",
    href: "/dashboard/billing",
    icon: ReceiptText,
    resource: "billing",
    platformOnly: true,
  },

  {
    section: "settings",
    label: "navigation.myCompany",
    href: "/dashboard/company",
    icon: Building2,
    resource: "clinic",
    clinicOnly: true,
  },

  {
    section: "relationship",
    label: "Chamados",
    platformLabel: "Chamados",
    href: "/dashboard/messages",
    icon: MessageSquareMore,
    resource: "messages",
  },

  {
    section: "settings",
    label: "navigation.auditLog",
    platformLabel: "Auditoria global",
    href: "/dashboard/audit-logs",
    icon: ClipboardList,
    resource: "auditLogs",
  },

  {
    section: "settings",
    label: "navigation.users",
    platformLabel: "Equipe Sheep",
    href: "/dashboard/users",
    icon: ShieldCheck,
    resource: "users",
  },
].map((item) => item as {
  label: string;
  platformLabel?: string;
  href: string;
  icon: typeof LayoutDashboard;
  resource: AppResource;
  section:
    | "root"
    | "operation"
    | "relationship"
    | "finance"
    | "settings";
  clinicOnly?: boolean;
  platformOnly?: boolean;
  platformVisible?: boolean;
});

type Props = {
  role: AppRole;
  hasClinicAssignment: boolean;
  hasOperationalAccess: boolean;
  workspaceBrand: WorkspaceBrand;
};

const CLINIC_SCOPED_RESOURCES: AppResource[] = [
  "plans",
  "patients",
  "subscriptions",
  "benefits",
  "benefitUsage",
  "billing",
  "messages",
  "auditLogs",
  "users",
];

export function DashboardSidebar({
  role,
  hasClinicAssignment,
  hasOperationalAccess,
  workspaceBrand,
}: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const [collapsed, setCollapsed] =
    useState(false);
  const [expandedSections, setExpandedSections] =
    useState({
      operation: true,
      relationship: false,
      finance: false,
      settings: false,
    });
  const isPlatformView =
    !hasClinicAssignment;
  const operationExpanded =
    expandedSections.operation ||
    pathname.startsWith(
      "/dashboard/clinics"
    ) ||
    pathname.startsWith(
      "/dashboard/plans"
    ) ||
    pathname.startsWith(
      "/dashboard/patients"
    ) ||
    pathname.startsWith(
      "/dashboard/subscriptions"
    ) ||
    pathname.startsWith(
      "/dashboard/benefits"
    );
  const relationshipExpanded =
    expandedSections.relationship ||
    pathname.startsWith(
      "/dashboard/benefit-usage"
    ) ||
    pathname.startsWith(
      "/dashboard/messages"
    );
  const financeExpanded =
    expandedSections.finance ||
    pathname.startsWith(
      "/dashboard/payments"
    ) ||
    pathname.startsWith(
      "/dashboard/billing"
    );
  const settingsExpanded =
    expandedSections.settings ||
    pathname.startsWith(
      "/dashboard/company"
    ) ||
    pathname.startsWith(
      "/dashboard/modules"
    ) ||
    pathname.startsWith(
      "/dashboard/audit-logs"
    ) ||
    pathname.startsWith(
      "/dashboard/users"
    );

  const visibleItems = items.filter(
    (item) =>
      (item.section !== "operation" ||
        isPlatformView ||
        hasOperationalAccess) &&
      (!item.clinicOnly ||
        hasClinicAssignment) &&
      (!item.platformOnly ||
        isPlatformView) &&
      (hasClinicAssignment ||
        item.platformOnly ||
        item.platformVisible ||
        !CLINIC_SCOPED_RESOURCES.includes(
          item.resource
        )) &&
      hasPermission(
        role,
        item.resource,
        "view"
      )
  );

  return (
    <aside
      data-collapsed={collapsed}
      className="app-shell-sidebar"
    >
      <div className="flex h-full flex-col gap-8 p-4 lg:p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <BrandMark
              brand={workspaceBrand}
              compact={collapsed}
            />
            <button
              type="button"
              className="sidebar-rail-button"
              onClick={() =>
                setCollapsed(
                  (current) => !current
                )
              }
              aria-label={
                collapsed
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral"
              }
              title={
                collapsed
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral"
              }
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
          </div>
          {!collapsed ? (
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {workspaceBrand.isPlatform
                ? "Controle global"
                : t("navigation.workspace")}
            </p>
          ) : null}
        </div>

        <nav className="flex flex-col gap-6">
          {[
            {
              id: "root",
              title: null,
            },
            {
              id: "operation",
              title: "Operação",
              expanded: operationExpanded,
            },
            {
              id: "relationship",
              title: "Relacionamento",
              expanded:
                relationshipExpanded,
            },
            {
              id: "finance",
              title: "Financeiro",
              expanded: financeExpanded,
            },
            {
              id: "settings",
              title: "Configurações",
              expanded:
                settingsExpanded,
            },
          ].map((section) => {
            const sectionItems =
              visibleItems.filter(
                (item) =>
                  item.section ===
                  section.id
              );

            if (sectionItems.length === 0) {
              return null;
            }

            return (
              <div
                key={section.id}
                className="flex flex-col gap-1.5"
              >
                {section.title && !collapsed ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSections(
                        (current) => ({
                          ...current,
                          [section.id]:
                            !current[
                              section.id as "operation" | "relationship" | "finance" | "settings"
                            ],
                        })
                      )
                    }
                    className="sidebar-section-button"
                  >
                    <span>
                      {section.title}
                    </span>
                    <span className="text-[10px]">
                      {section.expanded
                        ? "Ocultar"
                        : "Mostrar"}
                    </span>
                  </button>
                ) : null}
                {(section.id === "root" ||
                  collapsed ||
                  section.expanded) &&
                sectionItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !==
                      "/dashboard" &&
                      pathname.startsWith(
                        `${item.href}/`
                      ));

                  const Icon = item.icon;
                  const label =
                    isPlatformView &&
                    item.platformLabel
                      ? item.platformLabel
                      : t(item.label);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={label}
                      className={cn(
                        "sidebar-item",
                        collapsed &&
                          "justify-center px-0",
                        active
                          ? "sidebar-item-active"
                          : "sidebar-item-idle"
                      )}
                    >
                      <Icon className="size-4" />

                      {!collapsed ? (
                        <span className="truncate">
                          {label}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
