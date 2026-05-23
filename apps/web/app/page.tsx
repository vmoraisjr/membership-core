import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4 p-6">
          <h1 className="text-2xl font-bold">
            Membership Core
          </h1>

          <p className="text-muted-foreground">
            Multi-tenant membership platform
          </p>

          <Button>
            Continue
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}