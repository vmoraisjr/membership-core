export function DashboardHeader() {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 md:px-6">
      <div>
        <h2 className="font-semibold tracking-tight">
          Operations
        </h2>
      </div>

      <div className="text-sm text-muted-foreground">
        Membership Core SaaS
      </div>
    </header>
  );
}
