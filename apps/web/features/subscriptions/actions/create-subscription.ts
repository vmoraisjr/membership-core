"use server";

import { revalidatePath } from "next/cache";

import {
  SubscriptionStatus,
} from "@prisma/client";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { prisma } from "@/lib/prisma";

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
    throw new Error("Invalid form data.");
  }

  const clinic = await getCurrentClinic();

  const [patient, membershipPlan] =
    await Promise.all([
      prisma.patient.findFirst({
        where: {
          id: parsed.data.patientId,
          clinicId: clinic.id,
        },
      }),
      prisma.membershipPlan.findFirst({
        where: {
          id: parsed.data.membershipPlanId,
          clinicId: clinic.id,
        },
      }),
    ]);

  if (!patient || !membershipPlan) {
    throw new Error(
      "Patient or membership plan not found for this clinic."
    );
  }

  await prisma.subscription.create({
    data: {
      patientId: patient.id,
      membershipPlanId: membershipPlan.id,
      status:
        parsed.data.status ??
        SubscriptionStatus.PENDING,
      startedAt: new Date(
        parsed.data.startedAt
      ),
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : null,
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
  revalidatePath("/dashboard");
}
