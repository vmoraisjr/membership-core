import { revalidatePath } from "next/cache";

function isMissingStaticStoreError(
  error: unknown
) {
  return (
    error instanceof Error &&
    error.message.includes(
      "static generation store missing"
    )
  );
}

export function safeRevalidatePath(
  path: string
) {
  try {
    revalidatePath(path);
  } catch (error) {
    if (
      isMissingStaticStoreError(error)
    ) {
      return;
    }

    throw error;
  }
}
