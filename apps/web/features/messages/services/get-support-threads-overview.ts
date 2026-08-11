import {
  SupportThreadCategory,
  SupportThreadStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";

type Filters = {
  threadId?: string;
  category?: string;
  status?: string;
  clinicId?: string;
};

function isThreadCategory(
  value?: string
): value is SupportThreadCategory {
  return Boolean(
    value &&
      Object.values(
        SupportThreadCategory
      ).includes(
        value as SupportThreadCategory
      )
  );
}

function isThreadStatus(
  value?: string
): value is SupportThreadStatus {
  return Boolean(
    value &&
      Object.values(
        SupportThreadStatus
      ).includes(
        value as SupportThreadStatus
      )
  );
}

const STATUS_PRIORITY: Record<
  SupportThreadStatus,
  number
> = {
  [SupportThreadStatus.OPEN]: 0,
  [SupportThreadStatus.IN_PROGRESS]: 1,
  [SupportThreadStatus.WAITING_PLATFORM]: 2,
  [SupportThreadStatus.WAITING_CLINIC]: 3,
  [SupportThreadStatus.RESOLVED]: 4,
  [SupportThreadStatus.CLOSED]: 5,
};

export async function getSupportThreadsOverview(
  filters: Filters = {}
) {
  const workspace =
    await getCurrentWorkspace();
  const isPlatformView =
    workspace.type === "platform";

  const where = {
    ...(isPlatformView
      ? {
          ...(filters.clinicId
            ? {
                clinicId:
                  filters.clinicId,
              }
            : {}),
        }
      : {
          clinicId:
            workspace.clinicId,
        }),
    ...(isThreadCategory(
      filters.category
    )
      ? {
          category:
            filters.category,
        }
      : {}),
    ...(isThreadStatus(
      filters.status
    )
      ? {
          status: filters.status,
        }
      : {}),
  };

  const [threads, clinics] =
    await Promise.all([
      prisma.supportThread.findMany({
        where,
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              brandName: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
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

  const prioritizedThreads = [
    ...threads,
  ].sort(
    (a, b) =>
      STATUS_PRIORITY[a.status] -
      STATUS_PRIORITY[b.status]
  );

  const selectedThread =
    filters.threadId
      ? prioritizedThreads.find(
          (thread) =>
            thread.id ===
            filters.threadId
        ) ?? null
      : prioritizedThreads[0] ?? null;

  return {
    workspace,
    threads: prioritizedThreads,
    selectedThread,
    clinics: clinics.map(
      (clinic) => ({
        id: clinic.id,
        name:
          clinic.brandName ??
          clinic.name,
      })
    ),
    selectedClinicId:
      filters.clinicId ?? "",
    categoryOptions:
      Object.values(
        SupportThreadCategory
      ),
    statusOptions:
      Object.values(
        SupportThreadStatus
      ),
  };
}
