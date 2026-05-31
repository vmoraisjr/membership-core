"use server";

import { revalidatePath } from "next/cache";

import {
  PatientStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";

export async function createSubscription(
  data: SubscriptionSchema
) {
  const parsed =
    subscriptionSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic = await getCurrentClinic();

  const [patient, plan] =
    await Promise.all([
      prisma.patient.findFirst({
        where: {
          id: parsed.data.patientId,
          clinicId: clinic.id,
          status: PatientStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      }),
      prisma.membershipPlan.findFirst({
        where: {
          id: parsed.data.membershipPlanId,
          clinicId: clinic.id,
          active: true,
        },
        select: {
          id: true,
        },
      }),
    ]);

  if (!patient) {
    throw new Error(
      "Only active patients can receive subscriptions."
    );
  }

  if (!plan) {
    throw new Error(
      "Only active plans can receive subscriptions."
    );
  }

  const startDate = new Date(
    parsed.data.startedAt
  );
  const expiresDate =
    parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : new Date(
          startDate.getTime() +
            30 * 24 * 60 * 60 * 1000
        );

  await prisma.subscription.create({
    data: {
      patientId: patient.id,

      membershipPlanId: plan.id,

      startedAt: startDate,

      expiresAt: expiresDate,

      status:
        SubscriptionStatus.ACTIVE,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
}
