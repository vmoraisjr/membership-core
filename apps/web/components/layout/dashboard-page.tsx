type Props = {
  children: React.ReactNode;
};

export function DashboardPage({
  children,
}: Props) {
  return (
    <div className="page-frame">
      {children}
    </div>
  );
}
