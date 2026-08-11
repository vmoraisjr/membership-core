import { PaymentStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

const TREND_MONTHS = 6;

export async function getRevenueTrend() {
  const clinic = await getCurrentClinic();
  const now = new Date();
  const rangeStart = new Date(
    now.getFullYear(),
    now.getMonth() - (TREND_MONTHS - 1),
    1
  );

  const invoices = await prisma.patientInvoice.findMany({
    where: {
      clinicId: clinic.id,
      status: PaymentStatus.PAID,
      paidAt: {
        gte: rangeStart,
      },
    },
    select: {
      amount: true,
      paidAt: true,
    },
  });

  const months = Array.from(
    { length: TREND_MONTHS },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (TREND_MONTHS - 1 - index),
        1
      );

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        date,
        total: 0,
      };
    }
  );

  for (const invoice of invoices) {
    if (!invoice.paidAt) {
      continue;
    }

    const key = `${invoice.paidAt.getFullYear()}-${invoice.paidAt.getMonth()}`;
    const bucket = months.find(
      (month) => month.key === key
    );

    if (bucket) {
      bucket.total += invoice.amount;
    }
  }

  return months.map((month) => ({
    date: month.date,
    total: month.total,
  }));
}
