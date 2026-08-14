import {
  AuditAction,
  AuditEntity,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  filterByClinic,
} from "@/lib/auth/tenant";

export type AuditLogPageSize = 5 | 10 | 30 | "all";

export const AUDIT_LOG_PAGE_SIZE_OPTIONS: AuditLogPageSize[] =
  [5, 10, 30, "all"];

export const AUDIT_LOG_DEFAULT_PAGE_SIZE: AuditLogPageSize = 10;

export type AuditLogFilters = {
  actor?: string;
  entity?: string;
  action?: string;
  date?: string;
  clinicId?: string;
  page?: number;
  pageSize?: AuditLogPageSize;
};

function resolvePageSize(
  pageSize: AuditLogPageSize | undefined
): AuditLogPageSize {
  if (
    pageSize &&
    AUDIT_LOG_PAGE_SIZE_OPTIONS.includes(pageSize)
  ) {
    return pageSize;
  }

  return AUDIT_LOG_DEFAULT_PAGE_SIZE;
}

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

function isAuditAction(
  value: string
): value is AuditAction {
  return Object.values(
    AuditAction
  ).includes(value as AuditAction);
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
  SUPPORT_THREAD:
    "Chamado",
  SUPPORT_MESSAGE:
    "Mensagem do chamado",
};

export async function getAuditLogs(
  filters: AuditLogFilters = {}
) {
  const currentUser =
    await requireCurrentAppUser();
  const isPlatformView =
    !currentUser.clinicId &&
    (currentUser.role === "OWNER" ||
      currentUser.role === "ADMIN");

  const clinicId =
    currentUser.clinicId ??
    filters.clinicId ??
    null;
  const clinicVisibleEntities: AuditEntity[] =
    [
      AuditEntity.CLINIC,
      AuditEntity.APP_USER,
      AuditEntity.USER_INVITE,
      AuditEntity.PATIENT,
      AuditEntity.MEMBERSHIP_PLAN,
      AuditEntity.MEMBERSHIP_BENEFIT,
      AuditEntity.SUBSCRIPTION,
      AuditEntity.BENEFIT_USAGE,
      AuditEntity.PATIENT_INVOICE,
      AuditEntity.PATIENT_PAYMENT,
      AuditEntity.CLINIC_MODULE,
      AuditEntity.CONTRACT_TEMPLATE,
      AuditEntity.PATIENT_CONTRACT,
      AuditEntity.CLINIC_CONTRACT,
      AuditEntity.SUPPORT_THREAD,
      AuditEntity.SUPPORT_MESSAGE,
    ];
  const platformVisibleEntities: AuditEntity[] =
    [
      AuditEntity.CLINIC,
      AuditEntity.APP_USER,
      AuditEntity.PATIENT,
      AuditEntity.MEMBERSHIP_PLAN,
      AuditEntity.MEMBERSHIP_BENEFIT,
      AuditEntity.SUBSCRIPTION,
      AuditEntity.BENEFIT_USAGE,
      AuditEntity.PATIENT_INVOICE,
      AuditEntity.PATIENT_PAYMENT,
      AuditEntity.CLINIC_BILLING_PLAN,
      AuditEntity.CLINIC_SUBSCRIPTION,
      AuditEntity.CLINIC_INVOICE,
      AuditEntity.CLINIC_PAYMENT,
      AuditEntity.MODULE,
      AuditEntity.CLINIC_MODULE,
      AuditEntity.CONTRACT_TEMPLATE,
      AuditEntity.PATIENT_CONTRACT,
      AuditEntity.CLINIC_CONTRACT,
      AuditEntity.SUPPORT_THREAD,
      AuditEntity.SUPPORT_MESSAGE,
    ];
  if (!isPlatformView && !clinicId) {
    throw new Error(
      "Clinic context is required for clinic audit logs."
    );
  }
  const where: Prisma.AuditLogWhereInput =
    isPlatformView
      ? {
          entity: {
            in: platformVisibleEntities,
          },
          ...(filters.clinicId
            ? {
                clinicId:
                  filters.clinicId,
              }
            : {}),
        }
      : filterByClinic(
          clinicId as string,
          {
            OR: [
              {
                actorUserId: null,
              },
              {
                actorUser: {
                  is: {
                    clinicId:
                      clinicId as string,
                  },
                },
              },
            ],
            entity: {
              in: clinicVisibleEntities,
            },
          }
        );

  const actor = filters.actor?.trim();
  if (actor) {
    where.actor = actor;
  }

  const entity = filters.entity?.trim();
  if (entity && isAuditEntity(entity)) {
    where.entity = entity;
  }

  const action = filters.action?.trim();
  if (action && isAuditAction(action)) {
    where.action = action;
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

  const pageSize = resolvePageSize(
    filters.pageSize
  );
  const page = Math.max(
    1,
    filters.page ?? 1
  );

  const [
    logs,
    total,
    actors,
    entities,
    actions,
    clinics,
  ] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      ...(pageSize === "all"
        ? {}
        : {
            skip:
              (page - 1) * pageSize,
            take: pageSize,
          }),
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            brandName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      distinct: ["actor"],
      orderBy: {
        actor: "asc",
      },
      select: {
        actor: true,
      },
    }),
    prisma.auditLog.findMany({
      where,
      distinct: ["entity"],
      orderBy: {
        entity: "asc",
      },
      select: {
        entity: true,
      },
    }),
    prisma.auditLog.findMany({
      where,
      distinct: ["action"],
      orderBy: {
        action: "asc",
      },
      select: {
        action: true,
      },
    }),
    isPlatformView
      ? prisma.clinic.findMany({
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            brandName: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    actorOptions: actors.map(
      ({ actor: currentActor }) =>
        currentActor
    ),
    entityOptions: entities.map(
      ({ entity: currentEntity }) =>
        currentEntity
    ),
    actionOptions: actions.map(
      ({ action: currentAction }) =>
        currentAction
    ),
    clinicOptions: clinics.map(
      (clinic) => ({
        id: clinic.id,
        name:
          clinic.brandName ??
          clinic.name,
      })
    ),
    isPlatformView,
  };
}
