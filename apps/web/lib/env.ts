import "@/lib/server-only";

type NodeEnv =
  | "development"
  | "test"
  | "production";

function readRequiredEnv(
  key: "DATABASE_URL"
) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }

  return value;
}

function readNodeEnv(): NodeEnv {
  const value = process.env.NODE_ENV;

  if (
    value === "production" ||
    value === "test"
  ) {
    return value;
  }

  return "development";
}

const NODE_ENV = readNodeEnv();

export const env = {
  DATABASE_URL:
    readRequiredEnv("DATABASE_URL"),
  NODE_ENV,
  ALLOW_AUTH_BOOTSTRAP:
    process.env.ALLOW_AUTH_BOOTSTRAP ===
    "true",
  APP_LOG_LEVEL:
    process.env.APP_LOG_LEVEL ??
    (NODE_ENV === "production"
      ? "info"
      : "debug"),
} as const;

export function isProduction() {
  return env.NODE_ENV === "production";
}
