import { prisma } from "@/lib/prisma";

export async function getSubscriptions() {
  const subscriptions =
    await prisma.subscription.findMany(
      {
        include: {
          patient: true,

          membershipPlan: true,
        },

        orderBy: {
          startedAt: "desc",
        },
      }
    );

  return subscriptions.map(
    (subscription) => ({
      ...subscription,

    startedAt: String(
  subscription.startedAt
),

expiresAt: String(
  subscription.expiresAt
),
    })
  );
}