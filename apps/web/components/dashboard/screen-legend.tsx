"use client";

import { HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TONE_DOT_CLASS,
  type StatusTone,
} from "@/components/ui/status-indicator";

export type LegendItem = {
  label: string;
  description: string;
  tone?: StatusTone;
};

export type LegendSection = {
  title: string;
  items: LegendItem[];
};

type Props = {
  sections: LegendSection[];
  triggerLabel?: string;
};

function LegendColumn({
  sections,
  bordered = false,
}: {
  sections: LegendSection[];
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        bordered && "border-l pl-5"
      )}
    >
      {sections.map((section) => (
        <div key={section.title} className="mb-4 last:mb-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[color:var(--color-primary-ink)]">
            {section.title}
          </p>
          <ul className="mt-1.5 space-y-2">
            {section.items.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-2"
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    TONE_DOT_CLASS[item.tone ?? "neutral"]
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="block text-[12px] leading-snug text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Discreet "?" trigger that opens a popover explaining what the statuses,
 * action buttons and roles on the current screen mean. Meant to sit right
 * next to a table or section title so it stays reachable while scrolled,
 * without competing with the primary action.
 */
export function ScreenLegend({
  sections,
  triggerLabel = "O que significam os status, ações e perfis desta tela",
}: Props) {
  const visibleSections = sections.filter(
    (section) => section.items.length > 0
  );

  if (visibleSections.length === 0) {
    return null;
  }

  const splitColumns = visibleSections.length >= 2;
  const leftSections: LegendSection[] = [];
  const rightSections: LegendSection[] = [];

  if (splitColumns) {
    let leftCount = 0;
    let rightCount = 0;

    for (const section of visibleSections) {
      if (leftCount <= rightCount) {
        leftSections.push(section);
        leftCount += section.items.length;
      } else {
        rightSections.push(section);
        rightCount += section.items.length;
      }
    }
  } else {
    leftSections.push(...visibleSections);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
          title={triggerLabel}
          aria-label={triggerLabel}
        >
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "max-h-[28rem] overflow-y-auto p-5",
          splitColumns
            ? "w-[min(35rem,calc(100vw-2.5rem))]"
            : "w-80"
        )}
      >
        <div
          className={cn(
            splitColumns && "grid grid-cols-2 gap-x-6"
          )}
        >
          <LegendColumn sections={leftSections} />
          {rightSections.length > 0 ? (
            <LegendColumn
              sections={rightSections}
              bordered
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
