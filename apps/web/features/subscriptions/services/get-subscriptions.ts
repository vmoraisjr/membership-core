import { PaymentStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import { getEvaluatedSubscriptionStatus } from "./evaluate-subscription-status";

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

          patientInvoices: {
            where: {
              status: {
                in: [
                  PaymentStatus.PENDING,
                  PaymentStatus.OVERDUE,
                ],
              },
            },
            orderBy: {
              dueDate: "asc",
            },
            take: 1,
            select: {
              dueDate: true,
              status: true,
            },
          },
        },

        orderBy: {
          startedAt: "desc",
        },
      }
    );

  const subscriptionsToUpdate =
    subscriptions.filter((subscription) => {
      const evaluatedStatus =
        getEvaluatedSubscriptionStatus({
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          status: subscription.status,
        });

      return evaluatedStatus !== subscription.status;
    });

  if (subscriptionsToUpdate.length > 0) {
    await prisma.$transaction(
      subscriptionsToUpdate.map(
        (subscription) =>
          prisma.subscription.update({
            where: {
              id: subscription.id,
            },
            data: {
              status:
                getEvaluatedSubscriptionStatus(
                  {
                    startedAt:
                      subscription.startedAt,
                    expiresAt:
                      subscription.expiresAt,
                    status:
                      subscription.status,
                  }
                ),
            },
          })
      )
    );
  }

  return subscriptions.map(
    (subscription) => ({
      ...subscription,
      status:
        getEvaluatedSubscriptionStatus({
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          status: subscription.status,
        }),
    })
  );
}
