type Props = {
  title?: string;

  description?: string;

  children: React.ReactNode;
};

export function DataTableContainer({
  title,
  description,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border">
      {(title || description) && (
        <div className="border-b p-6">
          {title && (
            <h2 className="font-semibold">
              {title}
            </h2>
          )}

          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}