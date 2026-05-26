import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-14 text-center",
        className
      )}
    >
      {icon ? (
        <div className="rounded-full border border-border/60 bg-muted/60 p-3 text-muted-foreground">
          {icon}
        </div>
      ) : null}

      <div className="space-y-1">
        <h3 className="text-base font-medium">
          {title}
        </h3>

        <p className="max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}
