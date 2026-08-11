"use client";

import { useState } from "react";

import Link from "next/link";
import { BrandMark } from "@/components/branding/brand-mark";
import {
  SidePanel,
  SidePanelContent,
  SidePanelDescription,
  SidePanelTitle,
} from "@/components/ui/side-panel";

import {
  BadgePercent,
  Blocks,
  BookCopy,
  Building2,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  MessageSquareMore,
  PanelLeftClose,
  ReceiptText,
  ShieldCheck,
  SquareStack,
  Users,
  WalletCards,
} from "lucide-react";

import { usePathname } from "next/navigation";

import type { AppRole } from "@/features/auth/constants/roles";
import { hasPermission, type AppResource } from "@/features/rbac/permissions";
import { useTranslations } from "@/i18n/provider";
import type { WorkspaceBrand } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./mobile-nav-context";

const items = [
  {
    section: "operation",
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
    section: "operation",
    label: "navigation.benefitUsage",
    href: "/dashboard/benefit-usage",
    icon: History,
    resource: "benefitUsage",
  },

  {
    section: "operation",
    label: "navigation.payments",
    href: "/dashboard/payments",
    icon: ReceiptText,
    resource: "billing",
    clinicOnly: true,
  },

  {
    section: "operation",
    label: "Catálogo comercial",
    platformLabel: "Catálogo comercial",
    href: "/dashboard/billing/catalog",
    icon: BookCopy,
    resource: "billing",
    platformOnly: true,
  },

  {
    section: "operation",
    label: "Assinaturas SaaS",
    platformLabel: "Assinaturas SaaS",
    href: "/dashboard/billing/subscriptions",
    icon: CreditCard,
    resource: "billing",
    platformOnly: true,
  },

  {
    section: "operation",
    label: "Pagamentos SaaS",
    platformLabel: "Pagamentos SaaS",
    href: "/dashboard/billing/payments",
    icon: WalletCards,
    resource: "billing",
    platformOnly: true,
  },

  {
    section: "operation",
    label: "navigation.myCompany",
    href: "/dashboard/company",
    icon: Building2,
    resource: "clinic",
    clinicOnly: true,
  },

  {
    section: "operation",
    label: "navigation.modules",
    href: "/dashboard/modules",
    icon: Blocks,
    resource: "modules",
  },

  {
    section: "operation",
    label: "navigation.messages",
    platformLabel: "Chamados",
    href: "/dashboard/messages",
    icon: MessageSquareMore,
    resource: "messages",
  },

  {
    section: "operation",
    label: "navigation.auditLog",
    platformLabel: "Auditoria global",
    href: "/dashboard/audit-logs",
    icon: ClipboardList,
    resource: "auditLogs",
    platformOnly: true,
  },

  {
    section: "operation",
    label: "navigation.users",
    platformLabel: "Equipe Sheep",
    href: "/dashboard/users",
    icon: ShieldCheck,
    resource: "users",
    platformOnly: true,
  },
].map((item) => item as {
  label: string;
  platformLabel?: string;
  href: string;
  icon: typeof LayoutDashboard;
  resource: AppResource;
  section: "operation";
  clinicOnly?: boolean;
  platformOnly?: boolean;
});

type CurrentUser = {
  name: string;
  email: string;
};

type Props = {
  role: AppRole;
  currentUser: CurrentUser;
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
  "auditLogs",
  "users",
];

function getVisibleItems({
  role,
  hasClinicAssignment,
  hasOperationalAccess,
}: {
  role: AppRole;
  hasClinicAssignment: boolean;
  hasOperationalAccess: boolean;
}) {
  const isPlatformView = !hasClinicAssignment;

  return items.filter(
    (item) =>
      (item.section !== "operation" ||
        isPlatformView ||
        hasOperationalAccess) &&
      (!item.clinicOnly || hasClinicAssignment) &&
      (!item.platformOnly || isPlatformView) &&
      (hasClinicAssignment ||
        item.platformOnly ||
        !CLINIC_SCOPED_RESOURCES.includes(item.resource)) &&
      hasPermission(role, item.resource, "view")
  );
}

type NavContentProps = {
  role: AppRole;
  hasClinicAssignment: boolean;
  hasOperationalAccess: boolean;
  workspaceBrand: WorkspaceBrand;
  collapsed: boolean;
  onNavigate?: () => void;
};

function SidebarNavContent({
  role,
  hasClinicAssignment,
  hasOperationalAccess,
  workspaceBrand,
  collapsed,
  onNavigate,
}: NavContentProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState({
    operation: true,
  });
  const isPlatformView = !hasClinicAssignment;

  const operationExpanded =
    expandedSections.operation ||
    items.some(
      (item) =>
        item.href !== "/dashboard" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
    ) ||
    pathname === "/dashboard";

  const visibleItems = getVisibleItems({
    role,
    hasClinicAssignment,
    hasOperationalAccess,
  });

  return (
    <div className="flex h-full flex-col gap-8 p-4 lg:p-6">
      <div className="space-y-4">
        <BrandMark
          brand={workspaceBrand}
          compact={collapsed}
          iconOnly={collapsed}
        />
        {!collapsed ? (
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {workspaceBrand.isPlatform
              ? "Controle global"
              : t("navigation.workspace")}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6">
        {[
          {
            id: "operation",
            title: "Operação",
            expanded: operationExpanded,
          },
        ].map((section) => {
          const sectionItems = visibleItems.filter(
            (item) => item.section === section.id
          );

          if (sectionItems.length === 0) {
            return null;
          }

          return (
            <div key={section.id} className="flex flex-col gap-1.5">
              {section.title && !collapsed ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSections((current) => ({
                      ...current,
                      [section.id]:
                        !current[section.id as "operation"],
                    }))
                  }
                  className="sidebar-section-button"
                >
                  <span>{section.title}</span>
                  <span className="text-[10px]">
                    {section.expanded ? "Ocultar" : "Mostrar"}
                  </span>
                </button>
              ) : null}
              {(collapsed || section.expanded) &&
                sectionItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  const Icon = item.icon;
                  const label =
                    isPlatformView && item.platformLabel
                      ? item.platformLabel
                      : t(item.label);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={label}
                      onClick={onNavigate}
                      className={cn(
                        "sidebar-item",
                        collapsed && "justify-center px-0",
                        active
                          ? "sidebar-item-active"
                          : "sidebar-item-idle"
                      )}
                    >
                      <Icon className="size-4" />

                      {!collapsed ? (
                        <span className="truncate">{label}</span>
                      ) : null}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function DashboardSidebar({
  role,
  hasClinicAssignment,
  hasOperationalAccess,
  workspaceBrand,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { open, setOpen } = useMobileNav();

  return (
    <>
      <aside
        data-collapsed={collapsed}
        className="app-shell-sidebar hidden lg:block"
      >
        <div className="app-shell-sidebar-sticky">
          <SidebarNavContent
            role={role}
            hasClinicAssignment={hasClinicAssignment}
            hasOperationalAccess={hasOperationalAccess}
            workspaceBrand={workspaceBrand}
            collapsed={collapsed}
          />

          <button
            type="button"
            className="sidebar-collapse-toggle"
            data-collapsed={collapsed}
            onClick={() => setCollapsed((current) => !current)}
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
            <PanelLeftClose className="size-3.5" />
          </button>
        </div>
      </aside>

      <SidePanel open={open} onOpenChange={setOpen}>
        <SidePanelContent
          side="left"
          className="max-w-xs border-sidebar-border bg-sidebar p-0 sm:w-72"
          showCloseButton={false}
        >
          <SidePanelTitle className="sr-only">
            {workspaceBrand.workspaceLabel}
          </SidePanelTitle>
          <SidePanelDescription className="sr-only">
            Menu de navegação
          </SidePanelDescription>
          <SidebarNavContent
            role={role}
            hasClinicAssignment={hasClinicAssignment}
            hasOperationalAccess={hasOperationalAccess}
            workspaceBrand={workspaceBrand}
            collapsed={false}
            onNavigate={() => setOpen(false)}
          />
        </SidePanelContent>
      </SidePanel>
    </>
  );
}
