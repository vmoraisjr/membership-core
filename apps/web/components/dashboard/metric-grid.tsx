type Props = {
  children: React.ReactNode;
  columns?:
    | "two"
    | "three"
    | "four"
    | "six";
};

export function MetricGrid({
  children,
  columns = "four",
}: Props) {
  const className =
    columns === "two"
      ? "grid gap-4 md:grid-cols-2"
      : columns === "three"
        ? "grid gap-4 md:grid-cols-3"
        : columns === "six"
          ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
          : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={className}>
      {children}
    </div>
  );
}
