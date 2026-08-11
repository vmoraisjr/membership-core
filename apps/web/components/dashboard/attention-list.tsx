import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AttentionTone = "info" | "warning" | "danger" | "success";

const TONE_CLASS: Record<AttentionTone, string> = {
  info: "text-[color:var(--color-info)] bg-[color:var(--color-info-soft)]",
  warning: "text-[color:var(--color-warning)] bg-[color:var(--color-warning-soft)]",
  danger: "text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]",
  success: "text-[color:var(--color-success)] bg-[color:var(--color-success-soft)]",
};

export type AttentionListItem = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
  tone: AttentionTone;
};

type Props = {
  items: AttentionListItem[];
};

export function AttentionList({ items }: Props) {
  return (
    <div className="divide-y divide-border/70">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-[color:var(--color-surface-subtle)] md:px-5"
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg",
                TONE_CLASS[item.tone]
              )}
            >
              <Icon className="size-3.5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>

            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                TONE_CLASS[item.tone]
              )}
            >
              {item.value}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
