import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type Props = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  emphasis?: "default" | "attention";
};

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  emphasis = "default",
}: Props) {
  return (
    <Link
      href={href}
      className={`group ${
        emphasis === "attention"
          ? "attention-card hover:bg-background"
          : "surface-subtle hover:bg-background/95"
      } block p-4 transition-colors`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-border/70 bg-background p-3 text-muted-foreground shadow-[var(--shadow-xs)]">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
