import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

export function SheepIcon({ className }: IconProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl shadow-[0_3px_10px_-2px_rgba(14,169,104,0.5)]",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary), var(--color-primary-2))",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[55%] w-[55%]"
      >
        <path
          d="M4 17c0-4 3-7 8-7s8 3 8 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="7"
          r="3"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

type LockupProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
};

export function SheepLockup({
  className,
  iconClassName,
  wordmarkClassName,
}: LockupProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        className
      )}
    >
      <SheepIcon
        className={cn("h-12 w-12", iconClassName)}
      />
      <span
        className={cn(
          "text-2xl font-semibold tracking-tight text-foreground",
          wordmarkClassName
        )}
      >
        Sheep
      </span>
    </div>
  );
}
