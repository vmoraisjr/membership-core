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

  const selectedThread =
    filters.threadId
      ? threads.find(
          (thread) =>
            thread.id ===
            filters.threadId
        ) ?? null
      : threads[0] ?? null;

  return {
    workspace,
    threads,
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
