"use client";

import Link from "next/link";

import {
  BadgePercent,
  CreditCard,
  History,
  LayoutDashboard,
  SquareStack,
  Users,
} from "lucide-react";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "Membership Plans",
    href: "/dashboard/plans",
    icon: SquareStack,
  },

  {
    label: "Patients",
    href: "/dashboard/patients",
    icon: Users,
  },

  {
    label: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
  },

  {
    label: "Benefits",
    href: "/dashboard/benefits",
    icon: BadgePercent,
  },

  {
    label: "Benefit Usage",
    href: "/dashboard/benefit-usage",
    icon: History,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-border/60 bg-muted/30 p-4 lg:w-72 lg:border-r lg:border-b-0 lg:p-6">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Membership Core
          </h1>

          <p className="text-sm text-muted-foreground">
            Clinic operations workspace
          </p>
        </div>

        <nav className="flex flex-wrap gap-1.5 lg:flex-col">
          {items.map((item) => {
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

                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
