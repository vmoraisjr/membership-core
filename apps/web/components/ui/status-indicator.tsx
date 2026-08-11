import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const TONE_TO_VARIANT = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  neutral: "secondary",
} as const

export type StatusTone = keyof typeof TONE_TO_VARIANT

const TONE_DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning)]",
  danger: "bg-[color:var(--color-danger)]",
  info: "bg-[color:var(--color-info)]",
  neutral: "bg-muted-foreground",
}

type Props = {
  tone: StatusTone
  label: string
  pulse?: boolean
  className?: string
}

function StatusIndicator({ tone, label, pulse = false, className }: Props) {
  return (
    <Badge data-slot="status-indicator" variant={TONE_TO_VARIANT[tone]} className={cn(className)}>
      <span className="relative flex size-1.5 items-center justify-center">
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex size-1.5 animate-ping rounded-full opacity-60",
              TONE_DOT_CLASS[tone]
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex size-1.5 rounded-full", TONE_DOT_CLASS[tone])} />
      </span>
      {label}
    </Badge>
  )
}

export { StatusIndicator }
