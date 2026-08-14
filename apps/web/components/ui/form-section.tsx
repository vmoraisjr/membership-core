import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Lighter, borderless-fill variant for screens that don't need a heavy boxed section. */
  subtle?: boolean;
};

export function FormSection({
  title,
  description,
  children,
  className,
  subtle = false,
}: Props) {
  return (
    <div
      className={cn(
        subtle
          ? "space-y-3 rounded-lg border border-border/40 bg-transparent p-3.5 md:p-4"
          : "form-section",
        className
      )}
    >
      {title || description ? (
        <div>
          {title ? (
            <h3 className="form-section-title">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="form-section-description">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </div>
  );
}
