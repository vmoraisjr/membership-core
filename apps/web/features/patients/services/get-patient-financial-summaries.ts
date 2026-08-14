import { PaymentStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { filterByClinic, getCurrentClinicContext } from "@/lib/auth/tenant";

export type PatientFinancialSummary = {
  patientId: string;
  pendingCount: number;
  overdueCount: number;
  overdueAmount: number;
};

/**
 * One row per patient with a pending or overdue invoice — the summary the
 * client hub table needs to show "situação financeira" without pulling in
 * the full billing domain (UI-061). Invoices are always billed against the
 * titular (see createPatientInvoiceForSubscription), so dependents look
 * this up via their responsible patient's id.
 */
export async function getPatientFinancialSummaries() {
  const { clinicId } = await getCurrentClinicContext();

  const grouped = await prisma.patientInvoice.groupBy({
    by: ["patientId", "status"],
    where: filterByClinic(clinicId, {
      status: {
        in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE],
      },
    }),
    _count: { _all: true },
    _sum: { amount: true },
  });

  const summaries = new Map<string, PatientFinancialSummary>();

  for (const row of grouped) {
    const current =
      summaries.get(row.patientId) ??
      ({
        patientId: row.patientId,
        pendingCount: 0,
        overdueCount: 0,
        overdueAmount: 0,
      } satisfies PatientFinancialSummary);

    if (row.status === PaymentStatus.PENDING) {
      current.pendingCount += row._count._all;
    } else if (row.status === PaymentStatus.OVERDUE) {
      current.overdueCount += row._count._all;
      current.overdueAmount += row._sum.amount ?? 0;
    }

    summaries.set(row.patientId, current);
  }

  return Array.from(summaries.values());
}
