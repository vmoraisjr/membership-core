import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: Props) {
  return (
    <div className={cn("form-section", className)}>
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
