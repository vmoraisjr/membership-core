"use server";

import {
  ClinicSubscriptionStatus,
} from "@prisma/client";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";

import {
  clinicSubscriptionLifecycleSchema,
} from "../schemas/clinic-subscription.schema";
import {
  updateClinicSubscriptionStatus,
} from "../services/billing-foundation";

export async function cancelClinicSubscriptionAction(
  formData: FormData
) {
  await assertPermission(
    "billing",
    "manage"
  );

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();
  const input =
    clinicSubscriptionLifecycleSchema.parse(
      {
        subscriptionId: formData.get(
          "subscriptionId"
        ),
        status:
          ClinicSubscriptionStatus.CANCELED,
      }
    );

  await updateClinicSubscriptionStatus(
    {
      clinicId: clinic.id,
      subscriptionId:
        input.subscriptionId,
      status:
        ClinicSubscriptionStatus.CANCELED,
    },
    undefined,
    {
      actor: actor.displayName,
      actorUserId: actor.id,
    }
  );

  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath("/dashboard");
}
