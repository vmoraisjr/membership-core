"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

const items = [
  {
    label: "Membership Plans",
    href: "/dashboard/plans",
  },

  {
    label: "Patients",
    href: "/dashboard/patients",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/40 p-6">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold">
            Membership Core
          </h1>

          <p className="text-sm text-muted-foreground">
            Admin Dashboard
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          {items.map((item) => {
            const active =
              pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}