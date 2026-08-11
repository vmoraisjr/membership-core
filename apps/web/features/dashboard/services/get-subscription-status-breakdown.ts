import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getSubscriptionStatusBreakdown() {
  const clinic = await getCurrentClinic();

  const counts = await prisma.subscription.groupBy({
    by: ["status"],
    where: {
      patient: {
        clinicId: clinic.id,
      },
    },
    _count: true,
  });

  return Object.values(SubscriptionStatus).map((status) => ({
    status,
    count:
      counts.find((entry) => entry.status === status)?._count ?? 0,
  }));
}
