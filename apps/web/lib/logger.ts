import "@/lib/server-only";

import { env } from "./env";

type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error";

const LOG_PRIORITY: Record<
  LogLevel,
  number
> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel) {
  const currentLevel =
    env.APP_LOG_LEVEL.toLowerCase() as LogLevel;

  return (
    LOG_PRIORITY[level] >=
    (LOG_PRIORITY[currentLevel] ??
      LOG_PRIORITY.info)
  );
}

function writeLog(
  level: LogLevel,
  message: string,
  metadata?: unknown
) {
  if (!shouldLog(level)) {
    return;
  }

  const method =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error;

  if (metadata === undefined) {
    method(`[membership-core] ${message}`);
    return;
  }

  method(
    `[membership-core] ${message}`,
    metadata
  );
}

export const logger = {
  debug(message: string, metadata?: unknown) {
    writeLog("debug", message, metadata);
  },
  info(message: string, metadata?: unknown) {
    writeLog("info", message, metadata);
  },
  warn(message: string, metadata?: unknown) {
    writeLog("warn", message, metadata);
  },
  error(message: string, metadata?: unknown) {
    writeLog("error", message, metadata);
  },
};
