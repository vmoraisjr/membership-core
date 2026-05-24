import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";

import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const plans = await getMembershipPlans();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold">
                {plan.name}
              </h2>

              <p className="text-muted-foreground">
                {plan.description}
              </p>

              <p className="mt-4">
                R$ {plan.monthlyPrice}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}