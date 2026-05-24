import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingClinic = await prisma.clinic.findFirst({
    where: {
      slug: "nortex-medical",
    },
  });

  if (existingClinic) {
    console.log("Seed already exists.");
    return;
  }

  const clinic = await prisma.clinic.create({
    data: {
      name: "Nortex Medical",
      brandName: "Nortex",
      slug: "nortex-medical",
      document: "00.000.000/0001-00",
      email: "contato@nortex.com",
      phone: "11999999999",
      zipCode: "06454-000",
      city: "Barueri",
      state: "SP",
      address: "Alphaville",
    },
  });

  await prisma.membershipPlan.create({
    data: {
      clinicId: clinic.id,
      name: "Premium Health",
      description: "Premium membership plan",
      monthlyPrice: 99.9,
      active: true,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });