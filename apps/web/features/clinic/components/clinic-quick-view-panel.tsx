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
import { empresaUrl } from "@/lib/owner-routes";

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

        <SidePanelBody className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                <span>Conta</span>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {clinic.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Criada em{" "}
                {formatDate(
                  clinic.createdAt
                )}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                <span>Operação</span>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {clinic._count.patients} clientes
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {clinic._count.membershipPlans} plano(s) local(is)
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3.5" />
                <span>SaaS</span>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {currentSubscription
                  ?.clinicBillingPlan.name ??
                  "Sem plano"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Status:{" "}
                {currentSubscription?.status ??
                  "Não definido"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                E-mail
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {clinic.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Telefone
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {formatBrazilianPhone(
                  clinic.phone
                )}
              </p>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4">
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p>
                  {clinic.city},{" "}
                  {formatBrazilianState(
                    clinic.state
                  )}
                </p>
                <p className="text-muted-foreground">
                  {clinic.address}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4">
            <Button asChild size="sm">
              <Link
                href={empresaUrl(clinic.id)}
              >
                Abrir workspace completo
              </Link>
            </Button>
          </div>
        </SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}
