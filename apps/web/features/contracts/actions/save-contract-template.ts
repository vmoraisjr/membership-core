"use server";

import { ContractType } from "@prisma/client";

import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { createAuditLog, getCurrentAuditActor } from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";

import { contractTemplateSchema } from "../schemas/contract-template.schema";
import { upsertClinicContractTemplate } from "../services/contracts-foundation";

function getTemplateEntityLabel(
  type: ContractType
) {
  switch (type) {
    case ContractType.CLINIC_PLATFORM:
      return "Clinic platform contract template";
    default:
      return "Patient membership contract template";
  }
}

export async function saveContractTemplateAction(
  formData: FormData
) {
  await assertPermission(
    "contracts",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.clinicId) {
    throw new Error(
      "The current user is not assigned to a clinic."
    );
  }

  const parsed =
    contractTemplateSchema.safeParse({
      templateId: String(
        formData.get("templateId") ?? ""
      ),
      type: String(
        formData.get("type") ?? ""
      ),
      title: String(
        formData.get("title") ?? ""
      ),
      content: String(
        formData.get("content") ?? ""
      ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Invalid contract template data."
    );
  }

  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const existingTemplate =
        parsed.data.templateId
          ? await tx.contractTemplate.findFirst(
              {
                where: {
                  id: parsed.data.templateId,
                  clinicId:
                    currentUser.clinicId!,
                  type: parsed.data.type,
                },
                select: {
                  id: true,
                },
              }
            )
          : null;

      const template =
        await upsertClinicContractTemplate(
          {
            clinicId:
              currentUser.clinicId!,
            type: parsed.data.type,
            title: parsed.data.title,
            content: parsed.data.content,
            templateId:
              parsed.data.templateId ||
              null,
          },
          tx
        );

      await createAuditLog(tx, {
        clinicId:
          currentUser.clinicId!,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: existingTemplate
          ? "UPDATE"
          : "CREATE",
        entity:
          "CONTRACT_TEMPLATE",
        entityId: template.id,
        entityLabel:
          getTemplateEntityLabel(
            template.type
          ),
        metadata: {
          type: template.type,
          title: template.title,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/contracts"
  );
}
