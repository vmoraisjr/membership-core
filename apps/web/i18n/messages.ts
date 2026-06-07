import messages from "@/messages/pt-BR.json";

type Primitive =
  | string
  | number
  | boolean
  | null
  | undefined;

type TranslationValues = Record<
  string,
  Primitive
>;

type MessageTree = typeof messages;

export const defaultLocale = "pt-BR";

function resolveMessage(
  key: string
): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (
      typeof current !== "object" ||
      current === null ||
      !(part in current)
    ) {
      return undefined;
    }

    current = (
      current as Record<string, unknown>
    )[part];
  }

  return typeof current === "string"
    ? current
    : undefined;
}

function interpolate(
  template: string,
  values?: TranslationValues
) {
  if (!values) {
    return template;
  }

  return template.replace(
    /\{(\w+)\}/g,
    (_, token: string) =>
      String(values[token] ?? `{${token}}`)
  );
}

export function getMessage(
  key: string,
  values?: TranslationValues
) {
  const template =
    resolveMessage(key) ?? key;

  return interpolate(template, values);
}

export function getTranslations(
  namespace?: string
) {
  return (
    key: string,
    values?: TranslationValues
  ) =>
    getMessage(
      namespace
        ? `${namespace}.${key}`
        : key,
      values
    );
}

export type Messages = MessageTree;
