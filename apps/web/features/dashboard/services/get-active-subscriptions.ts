import { SubscriptionStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getActiveSubscriptions() {
  const clinic = await getCurrentClinic();

  return prisma.subscription.count({
    where: {
      patient: {
        clinicId: clinic.id,
      },
      status: SubscriptionStatus.ACTIVE,
    },
  });
}
