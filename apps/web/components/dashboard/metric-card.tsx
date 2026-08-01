import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
  delta?: ReactNode;
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  delta,
}: MetricCardProps) {
  return (
    <Card className="metric-tile">
      <CardContent className="metric-tile-inner">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {label}
          </p>

          <p className="break-words text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
            {value}
          </p>

          <p className="max-w-[26ch] text-xs leading-5 text-muted-foreground">
            {hint}
          </p>

          {delta ? (
            <div>{delta}</div>
          ) : null}
        </div>

        {icon ? (
          <div className="rounded-2xl border border-border/70 bg-[color:var(--color-surface-subtle)] p-3.5 text-muted-foreground shadow-[var(--shadow-xs)]">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
