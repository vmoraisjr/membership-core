import type { Prisma } from "@prisma/client";
import { LeadActivityType } from "@prisma/client";

type CreateLeadActivityInput = {
  leadId: string;
  type: LeadActivityType;
  description: string;
};

export async function createLeadActivity(
  tx: Prisma.TransactionClient,
  input: CreateLeadActivityInput
) {
  return tx.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: input.type,
      description: input.description,
    },
  });
}
