import Link from "next/link";

type Tab = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  tabs: Tab[];
  active: string;
};

/** URL-driven tab switcher (Link-based, not client state) — mirrors the pattern already used in the empresa workspace tabs. */
export function RouteTabs({ tabs, active }: Props) {
  return (
    <div className="page-frame pb-0">
      <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active === tab.id
                ? "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-ink)]"
                : "text-muted-foreground hover:bg-[color:var(--color-surface-subtle)] hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
