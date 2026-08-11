import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg, var(--color-primary), var(--color-primary-2))",
  "linear-gradient(135deg, var(--color-accent), var(--color-info))",
  "linear-gradient(135deg, var(--color-warning), var(--color-primary))",
  "linear-gradient(135deg, var(--color-info), var(--color-primary-2))",
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

type Props = {
  name: string;
  /** Stable value (e.g. an id) used to pick the gradient. Defaults to name. */
  seed?: string;
  className?: string;
};

export function CompanyAvatarMark({ name, seed, className }: Props) {
  const gradient =
    GRADIENTS[hashString(seed ?? name) % GRADIENTS.length];

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-[var(--shadow-xs)]",
        className
      )}
      style={{ background: gradient }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
