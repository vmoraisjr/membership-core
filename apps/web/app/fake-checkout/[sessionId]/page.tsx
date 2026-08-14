import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { fakeBillingGateway } from "@/features/billing/gateway/fake-billing-gateway";
import prisma from "@/lib/prisma";

import {
  approveFakeCheckoutAction,
  cancelFakeCheckoutAction,
} from "@/features/billing/actions/fake-checkout-actions";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function FakeCheckoutPage({
  params,
}: Props) {
  const { sessionId } = await params;
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    redirect(
      `/login?next=/fake-checkout/${sessionId}`
    );
  }

  const session =
    fakeBillingGateway.__getCheckoutSession(
      sessionId
    );

  if (
    !session ||
    session.clinicId !==
      currentUser.clinicId
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-neutral-900">
            Sessão de checkout não
            encontrada ou expirada.
          </p>
        </div>
      </main>
    );
  }

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id: session.clinicId,
      },
      select: {
        name: true,
        brandName: true,
      },
    });

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Checkout simulado — não é um
          provedor real
        </p>
        <h1 className="mt-2 text-lg font-semibold text-neutral-900">
          Ativar assinatura Sheep
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {clinic?.brandName ??
            clinic?.name ??
            "Sua empresa"}{" "}
          está prestes a ativar a
          cobrança recorrente da
          plataforma Sheep. Nenhum
          número de cartão real é
          coletado nesta simulação.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <form
            action={
              approveFakeCheckoutAction
            }
          >
            <input
              type="hidden"
              name="sessionId"
              value={sessionId}
            />
            <Button
              type="submit"
              className="w-full"
            >
              Aprovar pagamento
              (simulado)
            </Button>
          </form>
          <form
            action={
              cancelFakeCheckoutAction
            }
          >
            <input
              type="hidden"
              name="sessionId"
              value={sessionId}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
