type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: Props) {
  return (
    <div className="empty-state-block">
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
