import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function getPatients() {
  const clinic = await getCurrentClinic();

  const patients = await prisma.patient.findMany({
    where: {
      clinicId: clinic.id,
    },
    include: {
      subscriptions: {
        include: {
          membershipPlan: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  return patients.map((patient) => {
    const currentSubscription =
      patient.subscriptions.find(
        (subscription) =>
          MANAGEABLE_SUBSCRIPTION_STATUSES.some(
            (status) =>
              status ===
              subscription.status
          )
      ) ??
      patient.subscriptions[0] ??
      null;

    return {
      ...patient,
      currentSubscription,
    };
  });
}
