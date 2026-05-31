import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function getMembershipPlans() {
  const clinic = await getCurrentClinic();

  return prisma.membershipPlan.findMany({
    where: {
      clinicId: clinic.id,
    },
    include: {
      benefits: {
        orderBy: {
          title: "asc",
        },
      },
      subscriptions: {
        where: {
          status: {
            in: [
              ...MANAGEABLE_SUBSCRIPTION_STATUSES,
            ],
          },
        },
        select: {
          id: true,
          patientId: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
