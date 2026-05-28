type Props = {
  children: React.ReactNode;
};

export function DashboardPage({
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      {children}
    </div>
  );
}