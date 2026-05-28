type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}