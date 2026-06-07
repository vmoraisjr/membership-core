"use server";

import {
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";

import { contractTemplateStateSchema } from "../schemas/contract-template.schema";
import { setClinicContractTemplateActive } from "../services/contracts-foundation";

export async function activateContractTemplateAction(
  formData: FormData
) {
  await assertPermission(
    "contracts",
    "manage"
  );

  const parsed =
    contractTemplateStateSchema.safeParse({
      templateId: String(
        formData.get("templateId") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Invalid contract template."
    );
  }

  const clinic =
    await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const template =
        await setClinicContractTemplateActive(
          {
            clinicId: clinic.id,
            templateId:
              parsed.data.templateId,
            active: true,
          },
          tx
        );

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity:
          AuditEntity.CONTRACT_TEMPLATE,
        entityId: template.id,
        entityLabel: template.title,
        metadata: {
          active: true,
          type: template.type,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/contracts"
  );
}
