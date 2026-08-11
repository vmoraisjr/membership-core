import type { Prisma } from "@prisma/client";

const BEFORE_PREFIXES = [
  "previous",
  "prior",
  "old",
];
const AFTER_PREFIXES = ["next", "new"];

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) =>
      char.toUpperCase()
    )
    .trim();
}

function humanizeValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const looksLikeDate =
      /^\d{4}-\d{2}-\d{2}/.test(value);

    if (looksLikeDate) {
      const asDate = new Date(value);

      if (
        !Number.isNaN(asDate.getTime())
      ) {
        return asDate.toLocaleString(
          "pt-BR"
        );
      }
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.length === 0
      ? "—"
      : value
          .map(humanizeValue)
          .join(", ");
  }

  return JSON.stringify(value);
}

function stripPrefix(
  key: string,
  prefixes: string[]
) {
  const lowerKey = key.toLowerCase();

  for (const prefix of prefixes) {
    if (
      lowerKey.startsWith(prefix) &&
      key.length > prefix.length
    ) {
      const rest = key.slice(
        prefix.length
      );

      return (
        rest.charAt(0).toLowerCase() +
        rest.slice(1)
      );
    }
  }

  return null;
}

export type AuditMetadataChange = {
  label: string;
  before: string;
  after: string;
};

export type AuditMetadataField = {
  label: string;
  value: string;
};

export type HumanizedAuditMetadata = {
  changes: AuditMetadataChange[];
  fields: AuditMetadataField[];
};

export function humanizeAuditMetadata(
  metadata: Prisma.JsonValue | null
): HumanizedAuditMetadata {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return { changes: [], fields: [] };
  }

  const entries = Object.entries(
    metadata as Record<string, unknown>
  );
  const befores = new Map<
    string,
    { rawKey: string; value: unknown }
  >();
  const afters = new Map<
    string,
    { rawKey: string; value: unknown }
  >();
  const rest: Array<
    [string, unknown]
  > = [];

  for (const [key, value] of entries) {
    const beforeBase = stripPrefix(
      key,
      BEFORE_PREFIXES
    );

    if (beforeBase) {
      befores.set(
        beforeBase.toLowerCase(),
        { rawKey: beforeBase, value }
      );
      continue;
    }

    const afterBase = stripPrefix(
      key,
      AFTER_PREFIXES
    );

    if (afterBase) {
      afters.set(
        afterBase.toLowerCase(),
        { rawKey: afterBase, value }
      );
      continue;
    }

    rest.push([key, value]);
  }

  const changes: AuditMetadataChange[] =
    [];
  const consumedAfterKeys = new Set<
    string
  >();

  for (const [
    normalizedKey,
    before,
  ] of befores) {
    const after = afters.get(
      normalizedKey
    );

    if (after) {
      changes.push({
        label: humanizeKey(
          before.rawKey
        ),
        before: humanizeValue(
          before.value
        ),
        after: humanizeValue(
          after.value
        ),
      });
      consumedAfterKeys.add(
        normalizedKey
      );
    } else {
      rest.push([
        before.rawKey,
        before.value,
      ]);
    }
  }

  for (const [
    normalizedKey,
    after,
  ] of afters) {
    if (
      !consumedAfterKeys.has(
        normalizedKey
      )
    ) {
      rest.push([
        after.rawKey,
        after.value,
      ]);
    }
  }

  const fields: AuditMetadataField[] =
    rest.map(([key, value]) => ({
      label: humanizeKey(key),
      value: humanizeValue(value),
    }));

  return { changes, fields };
}
