import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type StepperStep = {
  key: string
  label: string
  description?: string
}

type Props = {
  steps: StepperStep[]
  currentIndex: number
  className?: string
}

function Stepper({ steps, currentIndex, className }: Props) {
  return (
    <ol
      data-slot="stepper"
      className={cn("flex w-full items-start gap-2", className)}
    >
      {steps.map((step, index) => {
        const state =
          index < currentIndex
            ? "complete"
            : index === currentIndex
              ? "active"
              : "upcoming"

        return (
          <li
            key={step.key}
            data-state={state}
            className="flex flex-1 flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  state === "complete" &&
                    "border-primary bg-primary text-primary-foreground",
                  state === "active" &&
                    "border-primary bg-[color:var(--color-primary-soft)] text-primary",
                  state === "upcoming" &&
                    "border-border bg-background text-muted-foreground"
                )}
              >
                {state === "complete" ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "h-px flex-1",
                    state === "complete" ? "bg-primary" : "bg-border"
                  )}
                />
              ) : null}
            </div>

            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
