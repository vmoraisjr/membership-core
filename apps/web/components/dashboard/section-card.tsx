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
    <Card className={cn("border-border/60 shadow-sm", className)}>
      {title || description || action ? (
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              {title ? (
                <CardTitle>{title}</CardTitle>
              ) : null}

              {description ? (
                <CardDescription>
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

      <CardContent className={cn("p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
