import {
  PatientKind,
  PatientStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getSubscriptionFormOptions() {
  const clinic = await getCurrentClinic();

  const [patients, membershipPlans] =
    await Promise.all([
      prisma.patient.findMany({
        where: {
          clinicId: clinic.id,
          status: PatientStatus.ACTIVE,
          kind: PatientKind.TITULAR,
        },
        orderBy: {
          fullName: "asc",
        },
        select: {
          id: true,
          fullName: true,
        },
      }),
      prisma.membershipPlan.findMany({
        where: {
          clinicId: clinic.id,
          active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          monthlyPrice: true,
          _count: {
            select: {
              benefits: {
                where: {
                  active: true,
                },
              },
            },
          },
        },
      }),
    ]);

  return {
    patients,
    membershipPlans: membershipPlans.map(
      (plan) => ({
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        activeBenefitsCount:
          plan._count.benefits,
      })
    ),
  };
}
