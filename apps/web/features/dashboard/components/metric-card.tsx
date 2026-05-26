type Props = {
  title: string;

  value: string | number;

  description: string;
};

export function MetricCard({
  title,
  value,
  description,
}: Props) {
  return (
    <div className="border rounded-2xl p-6 flex flex-col gap-2 bg-background">
      <span className="text-sm text-muted-foreground">
        {title}
      </span>

      <strong className="text-4xl font-bold">
        {value}
      </strong>

      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}