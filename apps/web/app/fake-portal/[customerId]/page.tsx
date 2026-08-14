import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { minhaEmpresaUrl } from "@/lib/company-routes";

type Props = {
  params: Promise<{
    customerId: string;
  }>;
  searchParams: Promise<{
    returnUrl?: string;
  }>;
};

export default async function FakePortalPage({
  params,
  searchParams,
}: Props) {
  const { customerId } = await params;
  const { returnUrl } =
    await searchParams;
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    redirect(
      `/login?next=/fake-portal/${customerId}`
    );
  }

  const safeReturnUrl =
    returnUrl?.startsWith("/dashboard/")
      ? returnUrl
      : minhaEmpresaUrl({
          tab: "subscription",
        });

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Portal simulado — não é um
          provedor real
        </p>
        <h1 className="mt-2 text-lg font-semibold text-neutral-900">
          Gerenciar forma de pagamento
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Em um provedor real, aqui você
          trocaria o cartão cadastrado
          sem que a Sheep tivesse acesso
          ao número. A simulação não
          coleta nem armazena nenhum
          dado de cartão.
        </p>
        <Link
          href={safeReturnUrl}
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Voltar para a Sheep
        </Link>
      </div>
    </main>
  );
}
