import { safeRevalidatePath } from "@/lib/revalidation";

export function resolveSupportReturnTo(
  formData: FormData,
  fallback: string
) {
  const raw = String(
    formData.get("returnTo") ?? ""
  );

  return raw.startsWith("/dashboard/")
    ? raw
    : fallback;
}

export function withThreadId(
  base: string,
  threadId: string
) {
  const separator = base.includes("?")
    ? "&"
    : "?";

  return `${base}${separator}threadId=${threadId}`;
}

export function revalidateSupportPaths(
  clinicId?: string
) {
  safeRevalidatePath("/dashboard/messages");
  safeRevalidatePath("/dashboard/chamados");

  if (clinicId) {
    safeRevalidatePath(
      `/dashboard/empresas/${clinicId}`
    );
  }
}
