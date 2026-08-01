"use server";

import {
  AuditAction,
  AuditEntity,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";

function normalizeOptionalNumber(
  value: FormDataEntryValue | null
) {
  if (
    value == null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return Number(value);
}

function assertPlatformOperator(user: {
  clinicId: string | null;
  role: string;
}) {
  if (
    user.clinicId ||
    (user.role !== "OWNER" &&
      user.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem gerenciar planos comerciais."
    );
  }
}

export async function saveClinicBillingPlanAction(
  formData: FormData
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  assertPlatformOperator(currentUser);

  const actor =
    await getCurrentAuditActor();
  const planId = String(
    formData.get("planId") ?? ""
  ).trim();
  const name = String(
    formData.get("name") ?? ""
  ).trim();
  const description = String(
    formData.get("description") ?? ""
  ).trim();
  const monthlyPrice =
    normalizeOptionalNumber(
      formData.get("monthlyPrice")
    );
  const annualPrice =
    normalizeOptionalNumber(
      formData.get("annualPrice")
    );
  const trialDays = Number(
    formData.get("trialDays") ?? 14
  );
  const activeValue = String(
    formData.get("active") ?? ""
  ).trim();
  const active =
    activeValue === "on" ||
    activeValue === "true";

  if (name.length < 3) {
    throw new Error(
      "Informe um nome de plano com pelo menos 3 caracteres."
    );
  }

  if (Number.isNaN(trialDays) || trialDays < 0) {
    throw new Error(
      "Informe uma quantidade valida de dias de teste."
    );
  }

  if (
    monthlyPrice != null &&
    Number.isNaN(monthlyPrice)
  ) {
    throw new Error(
      "Informe um valor mensal valido."
    );
  }

  if (
    annualPrice != null &&
    Number.isNaN(annualPrice)
  ) {
    throw new Error(
      "Informe um valor anual valido."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const existingPlan = planId
        ? await tx.clinicBillingPlan.findUnique({
            where: {
              id: planId,
            },
            select: {
              id: true,
              name: true,
              monthlyPrice: true,
              annualPrice: true,
              trialDays: true,
              active: true,
            },
          })
        : null;

      const savedPlan = existingPlan
        ? await tx.clinicBillingPlan.update({
            where: {
              id: existingPlan.id,
            },
            data: {
              name,
              description:
                description || null,
              monthlyPrice,
              annualPrice,
              trialDays,
              active,
            },
          })
        : await tx.clinicBillingPlan.create({
            data: {
              name,
              description:
                description || null,
              monthlyPrice,
              annualPrice,
              trialDays,
              active,
            },
          });

      await createAuditLog(tx, {
        clinicId: null,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: existingPlan
          ? AuditAction.UPDATE
          : AuditAction.CREATE,
        entity:
          AuditEntity.CLINIC_BILLING_PLAN,
        entityId: savedPlan.id,
        entityLabel: savedPlan.name,
        metadata: {
          previousPlan: existingPlan ?? null,
          nextPlan: {
            name: savedPlan.name,
            monthlyPrice:
              savedPlan.monthlyPrice,
            annualPrice:
              savedPlan.annualPrice,
            trialDays:
              savedPlan.trialDays,
            active: savedPlan.active,
          },
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/modules"
  );
  safeRevalidatePath(
    "/dashboard/billing"
  );
  safeRevalidatePath(
    "/dashboard/billing/catalog"
  );
  safeRevalidatePath(
    "/dashboard/billing/subscriptions"
  );
  safeRevalidatePath(
    "/dashboard/billing/payments"
  );
  safeRevalidatePath(
    "/dashboard/clinics"
  );
}
