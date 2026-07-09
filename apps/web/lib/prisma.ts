import { PrismaClient } from "@prisma/client";

import { env, isProduction } from "@/lib/env";
import { logger } from "@/lib/logger";

// Ensure this code only runs on the server
if (typeof window !== "undefined") {
  throw new Error("Prisma client can only be used on the server");
}

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

let prisma: PrismaClient;

try {
  process.env.PRISMA_CLIENT_ENGINE_TYPE =
    process.env
      .PRISMA_CLIENT_ENGINE_TYPE ??
    "library";

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma =
      new PrismaClient();
    logger.info(
      "Prisma client initialized",
      {
        databaseUrlPrefix:
          env.DATABASE_URL.slice(0, 32),
      }
    );
  }
  prisma = globalForPrisma.prisma;
} catch (error) {
  logger.error(
    "Prisma initialization failed",
    error
  );
  throw error;
}

if (!isProduction()) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
