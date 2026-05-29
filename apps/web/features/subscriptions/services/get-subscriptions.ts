import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getSubscriptions() {
  const clinic = await getCurrentClinic();

  const subscriptions =
    await prisma.subscription.findMany(
      {
        where: {
          patient: {
            clinicId: clinic.id,
          },
        },
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
