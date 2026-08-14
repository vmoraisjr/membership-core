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
} from "lucide-react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

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
    href: "/dashboard/empresas",
    icon: Building2,
    resource: "clinic",
    platformOnly: true,
  },

  {
    section: "operation",
    label: "navigation.membershipPlans",
    href: "/dashboard/planos",
    icon: SquareStack,
    resource: "plans",
  },

  {
    section: "operation",
    label: "navigation.patients",
    href: "/dashboard/clientes",
    icon: Users,
    resource: "patients",
  },

  {
    section: "operation",
    label: "navigation.subscriptions",
    href: "/dashboard/clientes",
    icon: CreditCard,
    resource: "subscriptions",
    clinicLegacyHidden: true,
  },

  {
    section: "operation",
    label: "navigation.benefits",
    href: "/dashboard/planos",
    icon: BadgePercent,
    resource: "benefits",
    clinicLegacyHidden: true,
  },

  {
    section: "operation",
    label: "navigation.benefitUsage",
    href: "/dashboard/atendimentos",
    icon: History,
    resource: "benefitUsage",
  },

  {
    section: "operation",
    label: "Cobranças",
    href: "/dashboard/cobrancas",
    icon: ReceiptText,
    resource: "billing",
    clinicOnly: true,
  },

  {
    section: "operation",
    label: "Planos comerciais",
    platformLabel: "Planos comerciais",
    href: "/dashboard/planos-comerciais",
    icon: BookCopy,
    resource: "billing",
    platformOnly: true,
  },

  {
    section: "administracao",
    label: "navigation.myCompany",
    href: "/dashboard/minha-empresa",
    icon: Building2,
    resource: "clinic",
    clinicOnly: true,
    // A clinic must always be able to reach its own subscription tab to
    // fix whatever is blocking operation (pause, past due, suspended) —
    // never hide the one way out (PAY-002).
    alwaysVisible: true,
  },

  {
    section: "operation",
    label: "navigation.modules",
    href: "/dashboard/minha-empresa?tab=resources",
    icon: Blocks,
    resource: "modules",
    clinicOnly: true,
    clinicLegacyHidden: true,
  },

  {
    section: "operation",
    label: "navigation.messages",
    platformLabel: "Chamados",
    href: "/dashboard/messages",
    platformHref: "/dashboard/chamados",
    icon: MessageSquareMore,
    resource: "messages",
    platformOnly: true,
  },

  {
    section: "administracao",
    label: "navigation.messages",
    href: "/dashboard/minha-empresa?tab=support",
    icon: MessageSquareMore,
    resource: "messages",
    clinicOnly: true,
    alwaysVisible: true,
  },

  {
    section: "administracao",
    label: "navigation.users",
    platformLabel: "Equipe Sheep",
    href: "/dashboard/administracao?tab=team",
    icon: ShieldCheck,
    resource: "users",
    platformOnly: true,
  },

  {
    section: "administracao",
    label: "navigation.auditLog",
    platformLabel: "Auditoria global",
    href: "/dashboard/administracao?tab=audit",
    icon: ClipboardList,
    resource: "auditLogs",
    platformOnly: true,
  },
].map((item) => item as {
  label: string;
  platformLabel?: string;
  href: string;
  platformHref?: string;
  icon: typeof LayoutDashboard;
  resource: AppResource;
  section: "operation" | "administracao";
  clinicOnly?: boolean;
  platformOnly?: boolean;
  alwaysVisible?: boolean;
  clinicLegacyHidden?: boolean;
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
        hasOperationalAccess ||
        item.alwaysVisible) &&
      (!item.clinicOnly || hasClinicAssignment) &&
      (!item.platformOnly || isPlatformView) &&
      (isPlatformView || !item.clinicLegacyHidden) &&
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
  const searchParams = useSearchParams();
  const [expandedSections, setExpandedSections] = useState({
    operation: true,
    administracao: hasClinicAssignment,
  });
  const isPlatformView = !hasClinicAssignment;

  const operationExpanded =
    expandedSections.operation ||
    items.some(
      (item) =>
        item.section === "operation" &&
        item.href !== "/dashboard" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
    ) ||
    pathname === "/dashboard";

  const administracaoExpanded =
    expandedSections.administracao ||
    items.some(
      (item) =>
        item.section === "administracao" &&
        (pathname === item.href ||
          pathname.startsWith(
            item.href.split("?")[0] + "/"
          ) ||
          pathname === item.href.split("?")[0])
    );

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
          {
            id: "administracao",
            title: isPlatformView
              ? "Administração"
              : "Minha empresa",
            expanded: administracaoExpanded,
          },
        ].map((section) => {
          const sectionItems = visibleItems.filter(
            (item) => item.section === section.id
          );

          if (sectionItems.length === 0) {
            return null;
          }

          return (
            <div
              key={section.id}
              className={cn(
                "flex flex-col gap-1.5",
                section.id === "administracao" &&
                  !isPlatformView &&
                  "mt-auto"
              )}
            >
              {section.title && !collapsed ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSections((current) => ({
                      ...current,
                      [section.id]:
                        !current[
                          section.id as
                            | "operation"
                            | "administracao"
                        ],
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
                  const resolvedHref =
                    isPlatformView && item.platformHref
                      ? item.platformHref
                      : item.href;
                  const [itemPath, itemQuery] =
                    resolvedHref.split("?");
                  const active =
                    pathname === itemPath
                      ? !itemQuery ||
                        Array.from(
                          new URLSearchParams(
                            itemQuery
                          ).entries()
                        ).every(
                          ([key, value]) =>
                            searchParams.get(
                              key
                            ) === value
                        )
                      : itemPath !== "/dashboard" &&
                        pathname.startsWith(
                          `${itemPath}/`
                        );

                  const Icon = item.icon;
                  const label =
                    isPlatformView && item.platformLabel
                      ? item.platformLabel
                      : t(item.label);

                  return (
                    <Link
                      key={item.href}
                      href={resolvedHref}
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
            <PanelLeftClose className="size-4.5" />
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
