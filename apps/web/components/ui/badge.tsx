import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "status-badge gap-1 border border-transparent transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-ink)]",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
        warning: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
        danger: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
        info: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
