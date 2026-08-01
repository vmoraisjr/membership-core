"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<
  React.ComponentProps<"input">,
  "type"
> & {
  hideLabel: string;
  showLabel: string;
};

export const PasswordInput =
  React.forwardRef<
    HTMLInputElement,
    Props
  >(function PasswordInput(
    {
      className,
      hideLabel,
      showLabel,
      ...props
    },
    ref
  ) {
    const [visible, setVisible] =
      React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-12", className)}
          {...props}
        />

        <button
          type="button"
          aria-label={
            visible ? hideLabel : showLabel
          }
          aria-pressed={visible}
          onClick={() =>
            setVisible(
              (current) => !current
            )
          }
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
    );
  });
