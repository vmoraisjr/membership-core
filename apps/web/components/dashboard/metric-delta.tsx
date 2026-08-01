import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  direction?: "up" | "down" | "neutral";
  label: string;
};

export function MetricDelta({
  direction = "neutral",
  label,
}: Props) {
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        direction === "up" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        direction === "down" &&
          "border-amber-200 bg-amber-50 text-amber-700",
        direction === "neutral" &&
          "border-border/70 bg-background text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
