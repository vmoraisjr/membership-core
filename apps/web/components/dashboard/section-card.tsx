import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  ScreenLegend,
  type LegendSection,
} from "./screen-legend";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  /** Sections shown in the discreet "?" legend next to the card title. */
  helpLegend?: LegendSection[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SectionCard({
  title,
  description,
  action,
  helpLegend,
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
                <div className="flex items-center gap-1.5">
                  <CardTitle className="workspace-section-title">
                    {title}
                  </CardTitle>
                  {helpLegend ? (
                    <ScreenLegend
                      sections={helpLegend}
                    />
                  ) : null}
                </div>
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
