import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/sparkline";
import { cn } from "@/lib/utils";

type MetricTone = "brand" | "success" | "warning" | "danger" | "info";

const TONE_ICON_CLASS: Record<MetricTone, string> = {
  brand: "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-ink)]",
  success: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
  danger: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
  info: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]",
};

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
  delta?: ReactNode;
  /** Real historical series for this metric, oldest first. Omit when no time series is available — never fabricate one. */
  trend?: number[];
  /** Semantic color for the icon chip. Defaults to the brand hue. */
  tone?: MetricTone;
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  delta,
  trend,
  tone = "brand",
}: MetricCardProps) {
  return (
    <Card className="metric-tile transition-shadow duration-150 hover:shadow-[var(--shadow-sm)]">
      <CardContent className="metric-tile-inner">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="break-words text-xl font-semibold tracking-tight text-foreground md:text-[1.4rem]">
            {value}
          </p>

          {trend && trend.length >= 2 ? (
            <Sparkline data={trend} className="h-5 w-16" />
          ) : null}

          <p className="max-w-[26ch] text-[11px] leading-4 text-muted-foreground">
            {hint}
          </p>

          {delta ? (
            <div>{delta}</div>
          ) : null}
        </div>

        {icon ? (
          <div
            className={cn(
              "rounded-xl border border-border/70 p-2.5 shadow-[var(--shadow-xs)] [&_svg]:size-4",
              TONE_ICON_CLASS[tone]
            )}
          >
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
