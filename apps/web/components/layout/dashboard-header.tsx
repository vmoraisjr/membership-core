export function DashboardHeader() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6">
      <div>
        <h2 className="font-semibold">
          Dashboard
        </h2>
      </div>

      <div className="text-sm text-muted-foreground">
        Membership Core
      </div>
    </header>
  );
}