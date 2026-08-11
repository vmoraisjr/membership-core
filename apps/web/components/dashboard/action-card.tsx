import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ActionTone = "brand" | "success" | "warning" | "danger" | "info";

const TONE_ICON_CLASS: Record<ActionTone, string> = {
  brand: "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-ink)]",
  success: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
  danger: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
  info: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]",
};

const TONE_BORDER_CLASS: Record<ActionTone, string> = {
  brand: "border-l-[color:var(--color-primary)]",
  success: "border-l-[color:var(--color-success)]",
  warning: "border-l-[color:var(--color-warning)]",
  danger: "border-l-[color:var(--color-danger)]",
  info: "border-l-[color:var(--color-info)]",
};

type Props = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  emphasis?: "default" | "attention";
  tone?: ActionTone;
  /** Prominent number shown above the title, e.g. a count that needs action. */
  value?: string;
};

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  emphasis = "default",
  tone = "brand",
  value,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group block border-l-[3px] transition-all duration-150 hover:-translate-y-0.5",
        emphasis === "attention"
          ? cn(
              "attention-card hover:shadow-[var(--shadow-sm)]",
              TONE_BORDER_CLASS[tone]
            )
          : "surface-subtle border-l-transparent p-4 hover:bg-background/95"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div
            className={cn(
              "inline-flex rounded-2xl p-3 shadow-[var(--shadow-xs)]",
              TONE_ICON_CLASS[tone]
            )}
          >
            <Icon className="size-5" />
          </div>
          <div>
            {value ? (
              <p className="text-2xl leading-7 font-semibold tracking-tight text-foreground tabular-nums">
                {value}
              </p>
            ) : null}
            <p className="font-medium text-foreground">
              {title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
