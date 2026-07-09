import prisma from "@/lib/prisma";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

import { ensureDefaultModules } from "./module-access";

export async function getPlatformModulesOverview() {
  const currentUser =
    await requireCurrentAppUser();

  if (
    currentUser.clinicId ||
    (currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas a plataforma pode administrar modulos e planos globais."
    );
  }

  const [modules, billingPlans] =
    await Promise.all([
      ensureDefaultModules(),
      prisma.clinicBillingPlan.findMany({
        include: {
          subscriptions: {
            select: {
              id: true,
              status: true,
              clinicId: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

  return {
    modules,
    billingPlans: billingPlans.map(
      (plan) => ({
        ...plan,
        metrics: {
          clinicCount:
            plan.subscriptions.length,
          activeSubscriptionCount:
            plan.subscriptions.filter(
              (subscription) =>
                subscription.status ===
                  "ACTIVE" ||
                subscription.status ===
                  "TRIAL" ||
                subscription.status ===
                  "PENDING"
            ).length,
        },
      })
    ),
  };
}
