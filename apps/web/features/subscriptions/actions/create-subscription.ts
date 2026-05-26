"use server";

import { revalidatePath } from "next/cache";

import {
  SubscriptionStatus,
} from "@prisma/client";

<<<<<<< HEAD
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
=======
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
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
<<<<<<< HEAD
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
=======
    throw new Error("Invalid data.");
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
  }

  await prisma.subscription.create({
    data: {
<<<<<<< HEAD
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
=======
      patientId: parsed.data.patientId,

      membershipPlanId:
        parsed.data.membershipPlanId,

      startedAt: new Date(
        parsed.data.startedAt
      ),

      expiresAt: new Date(
        parsed.data.expiresAt
      ),

      status:
        SubscriptionStatus.ACTIVE,
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
    },
  });

  revalidatePath(
    "/dashboard/subscriptions"
  );
<<<<<<< HEAD
  revalidatePath("/dashboard");
}
=======
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
