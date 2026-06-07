import {
  AuditEntity,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  filterByClinic,
  getCurrentClinicContext,
} from "@/lib/auth/tenant";

export type AuditLogFilters = {
  actor?: string;
  entity?: string;
  date?: string;
};

function isAuditEntity(
  value: string
): value is
  | AuditEntity
  | "APP_USER"
  | "USER_INVITE" {
  return [
    ...Object.values(AuditEntity),
    "APP_USER",
    "USER_INVITE",
  ].includes(value as AuditEntity);
}

function getDateRange(date: string) {
  const start = new Date(`${date}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export const AUDIT_ACTION_LABELS: Record<
  string,
  string
> = {
  LOGIN: "Login",
  CREATE: "Criar",
  UPDATE: "Atualizar",
  DELETE: "Excluir",
  DEACTIVATE: "Desativar",
  REACTIVATE: "Reativar",
  CONSUME_BENEFIT: "Consumir benefício",
  CANCEL_SUBSCRIPTION:
    "Cancelar assinatura",
  RENEW_SUBSCRIPTION:
    "Renovar assinatura",
  PAUSE_SUBSCRIPTION:
    "Pausar assinatura",
  RESUME_SUBSCRIPTION:
    "Retomar assinatura",
  EXPIRE_SUBSCRIPTION:
    "Expirar assinatura",
  MARK_INVOICE_PAID:
    "Marcar cobrança como paga",
  MARK_INVOICE_OVERDUE:
    "Marcar cobrança em atraso",
  ACCEPT_CONTRACT:
    "Aceitar contrato",
  ENABLE_MODULE: "Habilitar módulo",
  DISABLE_MODULE:
    "Desabilitar módulo",
};

export const AUDIT_ENTITY_LABELS: Record<
  string,
  string
> = {
  CLINIC: "Clínica",
  APP_USER: "Usuário do app",
  USER_INVITE: "Convite de usuário",
  PATIENT: "Paciente",
  LEAD: "Lead",
  MEMBERSHIP_PLAN:
    "Plano",
  MEMBERSHIP_BENEFIT:
    "Benefício",
  SUBSCRIPTION: "Assinatura",
  BENEFIT_USAGE: "Uso de benefício",
  PATIENT_INVOICE:
    "Cobrança do paciente",
  PATIENT_PAYMENT:
    "Pagamento do paciente",
  CLINIC_BILLING_PLAN:
    "Plano de cobrança da clínica",
  CLINIC_SUBSCRIPTION:
    "Assinatura da clínica",
  CLINIC_INVOICE:
    "Cobrança da clínica",
  CLINIC_PAYMENT:
    "Pagamento da clínica",
  MODULE: "Módulo",
  CLINIC_MODULE:
    "Módulo da clínica",
  CONTRACT_TEMPLATE:
    "Modelo de contrato",
  PATIENT_CONTRACT:
    "Contrato do paciente",
  CLINIC_CONTRACT:
    "Contrato da clínica",
};

export async function getAuditLogs(
  filters: AuditLogFilters = {}
) {
  const { clinicId } =
    await getCurrentClinicContext();
  const where: Prisma.AuditLogWhereInput =
    filterByClinic(clinicId);

  const actor = filters.actor?.trim();
  if (actor) {
    where.actor = actor;
  }

  const entity = filters.entity?.trim();
  if (entity && isAuditEntity(entity)) {
    where.entity = entity;
  }

  if (filters.date) {
    const range = getDateRange(
      filters.date
    );

    if (range) {
      where.createdAt = {
        gte: range.start,
        lt: range.end,
      };
    }
  }

  const [logs, actors, entities] =
    await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),
      prisma.auditLog.findMany({
        where: {
          clinicId,
        },
        distinct: ["actor"],
        orderBy: {
          actor: "asc",
        },
        select: {
          actor: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          clinicId,
        },
        distinct: ["entity"],
        orderBy: {
          entity: "asc",
        },
        select: {
          entity: true,
        },
      }),
    ]);

  return {
    logs,
    actorOptions: actors.map(
      ({ actor: currentActor }) =>
        currentActor
    ),
    entityOptions: entities.map(
      ({ entity: currentEntity }) =>
        currentEntity
    ),
  };
}
