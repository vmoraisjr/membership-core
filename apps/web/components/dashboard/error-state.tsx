import { AlertTriangleIcon } from "lucide-react"

type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function ErrorState({
  title,
  description,
  action,
}: Props) {
  return (
    <div className="empty-state-block">
      <span className="flex size-11 items-center justify-center rounded-full bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]">
        <AlertTriangleIcon className="size-5" />
      </span>

      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>

      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {action ? action : null}
    </div>
  );
}
