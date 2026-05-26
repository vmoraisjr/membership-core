import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: MetricCardProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="text-3xl font-semibold tracking-tight">
            {value}
          </p>

          <p className="text-xs text-muted-foreground">
            {hint}
          </p>
        </div>

        {icon ? (
          <div className="rounded-full border border-border/60 bg-muted/60 p-3 text-muted-foreground">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
