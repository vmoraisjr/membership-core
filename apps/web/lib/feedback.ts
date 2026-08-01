export const FEEDBACK_WARNING_MESSAGES =
  {
    reviewBeforeContinue:
      "Revise os campos destacados e tente novamente.",
    filtersReset:
      "Filtros limpos. Revise a lista atual.",
    unsupportedImageFormat:
      "Use um arquivo SVG ou PNG para continuar.",
    oversizedImage:
      "Use um arquivo menor para continuar.",
  } as const;

export function getFeedbackErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error
    ? error.message
    : fallback;
}
