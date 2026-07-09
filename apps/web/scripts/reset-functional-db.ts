import "dotenv/config";

import {
  AppUserRole,
  AppUserStatus,
  PrismaClient,
} from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.authSession.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.leadActivity.deleteMany();
    await tx.leadNote.deleteMany();
    await tx.patientContractAcceptance.deleteMany();
    await tx.clinicContractFile.deleteMany();
    await tx.patientPayment.deleteMany();
    await tx.clinicPayment.deleteMany();
    await tx.benefitUsage.deleteMany();
    await tx.patientInvoice.deleteMany();
    await tx.clinicInvoice.deleteMany();
    await tx.patientContract.deleteMany();
    await tx.clinicContract.deleteMany();
    await tx.subscription.deleteMany();
    await tx.membershipBenefit.deleteMany();
    await tx.membershipPlan.deleteMany();
    await tx.patient.deleteMany();
    await tx.lead.deleteMany();
    await tx.clinicModule.deleteMany();
    await tx.module.deleteMany();
    await tx.clinicSubscription.deleteMany();
    await tx.clinicBillingPlan.deleteMany();
    await tx.contractTemplate.deleteMany();
    await tx.clinic.deleteMany();
    await tx.appUser.deleteMany();

    await tx.appUser.create({
      data: {
        clinicId: null,
        name: "Owner Operator",
        email: "owner+workspace@membership-core.local",
        role: AppUserRole.OWNER,
        status: AppUserStatus.ACTIVE,
        passwordHash: hashPassword("ChangeMe123!"),
      },
    });
  });

  console.log(
    "Functional test reset complete. Platform master account recreated."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
