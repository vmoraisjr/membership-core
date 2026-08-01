import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  htmlFor?: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({
  htmlFor,
  label,
  hint,
  error,
  children,
  className,
}: Props) {
  return (
    <div className={cn("field-stack", className)}>
      <label
        htmlFor={htmlFor}
        className="field-label"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p className="field-help">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
