"use client";

import Link from "next/link";
import {
  Building2,
  CreditCard,
  MapPin,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel";
import {
  formatBrazilianPhone,
  formatBrazilianState,
} from "@/lib/br-formats";
import { formatDate } from "@/lib/formatters";

type Props = {
  clinic: {
    id: string;
    name: string;
    brandName: string | null;
    email: string;
    phone: string;
    city: string;
    state: string;
    address: string;
    createdAt: Date;
    _count: {
      patients: number;
      membershipPlans: number;
    };
    clinicSubscriptions?: Array<{
      id: string;
      status: string;
      clinicBillingPlan: {
        name: string;
      };
    }>;
  };
  trigger: React.ReactNode;
};

export function ClinicQuickViewPanel({
  clinic,
  trigger,
}: Props) {
  const currentSubscription =
    clinic.clinicSubscriptions?.[0] ?? null;

  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        {trigger}
      </SidePanelTrigger>
      <SidePanelContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <SidePanelHeader>
          <SidePanelTitle>
            {clinic.brandName ??
              clinic.name}
          </SidePanelTitle>
          <SidePanelDescription>
            Compare rapidamente dados operacionais da conta cliente sem sair da listagem.
          </SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface-subtle p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4" />
                <span className="text-sm font-medium">
                  Conta
                </span>
              </div>
              <p className="font-semibold">
                {clinic.name}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Criada em{" "}
                {formatDate(
                  clinic.createdAt
                )}
              </p>
            </div>

            <div className="surface-subtle p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span className="text-sm font-medium">
                  Operação
                </span>
              </div>
              <p className="font-semibold">
                {clinic._count.patients} clientes
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {clinic._count.membershipPlans} plano(s) local(is)
              </p>
            </div>

            <div className="surface-subtle p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <CreditCard className="size-4" />
                <span className="text-sm font-medium">
                  SaaS
                </span>
              </div>
              <p className="font-semibold">
                {currentSubscription
                  ?.clinicBillingPlan.name ??
                  "Sem plano"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Status:{" "}
                {currentSubscription?.status ??
                  "Não definido"}
              </p>
            </div>

            <div className="form-section md:col-span-2">
              <p className="form-section-title">
                Contato principal
              </p>
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">
                    E-mail
                  </p>
                  <p>{clinic.email}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Telefone
                  </p>
                  <p>
                    {formatBrazilianPhone(
                      clinic.phone
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="form-section">
              <p className="form-section-title">
                Localização
              </p>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p>
                    {clinic.city},{" "}
                    {formatBrazilianState(
                      clinic.state
                    )}
                  </p>
                  <p>{clinic.address}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <Button
                asChild
                variant="outline"
              >
                <Link
                  href={`/dashboard/clinics/${clinic.id}`}
                >
                  Abrir workspace completo
                </Link>
              </Button>
            </div>
          </div>
        </SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}
