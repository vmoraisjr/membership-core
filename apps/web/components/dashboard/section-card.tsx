import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "workspace-section",
        className
      )}
    >
      {title || description || action ? (
        <CardHeader className="workspace-section-header">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-1.5">
              {title ? (
                <CardTitle className="workspace-section-title">
                  {title}
                </CardTitle>
              ) : null}

              {description ? (
                <CardDescription className="workspace-section-description">
                  {description}
                </CardDescription>
              ) : null}
            </div>

            {action ? (
              <div className="shrink-0">
                {action}
              </div>
            ) : null}
          </div>
        </CardHeader>
      ) : null}

      <CardContent
        className={cn("min-w-0 p-0", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}
