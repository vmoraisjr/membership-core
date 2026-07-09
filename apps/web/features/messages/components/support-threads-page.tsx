import Link from "next/link";
import {
  SupportThreadCategory,
  SupportThreadStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { getTranslations } from "@/i18n/messages";

import { addSupportMessageAction } from "../actions/add-support-message";
import { createSupportThreadAction } from "../actions/create-support-thread";
import { updateSupportThreadStatusAction } from "../actions/update-support-thread-status";
import { getSupportThreadsOverview } from "../services/get-support-threads-overview";

type Props = {
  filters: {
    threadId?: string;
    category?: string;
    status?: string;
    clinicId?: string;
  };
};

function getCategoryLabel(
  category: SupportThreadCategory
) {
  switch (category) {
    case "INCIDENT":
      return "Problema";
    case "REQUEST":
      return "Solicitação";
    case "PAYMENT":
      return "Pagamento";
    case "REGISTRATION":
      return "Cadastro";
    default:
      return "Outro";
  }
}

function getStatusLabel(
  status: SupportThreadStatus
) {
  switch (status) {
    case "OPEN":
      return "Aberto";
    case "IN_PROGRESS":
      return "Em atendimento";
    case "WAITING_CLINIC":
      return "Aguardando clínica";
    case "WAITING_PLATFORM":
      return "Aguardando plataforma";
    case "RESOLVED":
      return "Resolvido";
    default:
      return "Fechado";
  }
}

function getStatusClass(
  status: SupportThreadStatus
) {
  switch (status) {
    case "OPEN":
      return "bg-sky-100 text-sky-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    case "WAITING_CLINIC":
    case "WAITING_PLATFORM":
      return "bg-slate-200 text-slate-700";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

function formatDate(
  value: Date | string
) {
  return new Date(value).toLocaleString();
}

export async function SupportThreadsPage({
  filters,
}: Props) {
  const t = getTranslations();
  const overview =
    await getSupportThreadsOverview(
      filters
    );
  const isPlatformView =
    overview.workspace.type ===
    "platform";

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={
          isPlatformView
            ? "Atendimento global"
            : "Comunicação com a plataforma"
        }
        title={
          isPlatformView
            ? "Chamados da plataforma"
            : "Chamados da empresa"
        }
        description={
          isPlatformView
            ? "Comunique-se com as empresas assinantes por tema, status e histórico de atendimento."
            : "Abra chamados com a plataforma e acompanhe o andamento por tema."
        }
      />

      <div className="page-section-grid xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Novo chamado"
            description="Abra um novo tema de atendimento com mensagem inicial."
          >
            <form
              action={
                createSupportThreadAction
              }
              className="grid gap-4 p-5"
            >
              {isPlatformView ? (
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">
                    Empresa
                  </span>
                  <select
                    name="clinicId"
                    className="h-10 rounded-md border bg-background px-3"
                    required
                  >
                    <option value="">
                      Selecione a empresa
                    </option>
                    {overview.clinics.map(
                      (clinic) => (
                        <option
                          key={clinic.id}
                          value={clinic.id}
                        >
                          {clinic.name}
                        </option>
                      )
                    )}
                  </select>
                </label>
              ) : null}

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  Assunto
                </span>
                <input
                  name="subject"
                  required
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  placeholder="Ex.: Ajuste de cobrança"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  Categoria
                </span>
                <select
                  name="category"
                  className="h-10 rounded-md border bg-background px-3"
                  defaultValue="REQUEST"
                >
                  {overview.categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {getCategoryLabel(
                          category
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  Mensagem inicial
                </span>
                <textarea
                  name="body"
                  required
                  rows={5}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Descreva o problema, solicitação ou contexto do chamado."
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Abrir chamado
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="Lista de chamados"
            description="Filtre por categoria, status e acompanhe a fila atual."
          >
            <form method="get" className="grid gap-3 border-b p-5">
              {isPlatformView ? (
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">
                    Empresa
                  </span>
                  <select
                    name="clinicId"
                    defaultValue={
                      overview.selectedClinicId
                    }
                    className="h-10 rounded-md border bg-background px-3"
                  >
                    <option value="">
                      Todas as empresas
                    </option>
                    {overview.clinics.map(
                      (clinic) => (
                        <option
                          key={clinic.id}
                          value={clinic.id}
                        >
                          {clinic.name}
                        </option>
                      )
                    )}
                  </select>
                </label>
              ) : null}

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  Categoria
                </span>
                <select
                  name="category"
                  defaultValue={
                    filters.category ?? ""
                  }
                  className="h-10 rounded-md border bg-background px-3"
                >
                  <option value="">
                    Todas
                  </option>
                  {overview.categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {getCategoryLabel(
                          category
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={
                    filters.status ?? ""
                  }
                  className="h-10 rounded-md border bg-background px-3"
                >
                  <option value="">
                    Todos
                  </option>
                  {overview.statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {getStatusLabel(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                {t(
                  "shared.actions.applyFilters"
                )}
              </button>
            </form>

            <div className="divide-y">
              {overview.threads.length ===
              0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhum chamado encontrado neste contexto.
                </div>
              ) : (
                overview.threads.map(
                  (thread) => (
                    <Link
                      key={thread.id}
                      href={`/dashboard/messages?threadId=${thread.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {thread.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryLabel(
                              thread.category
                            )}
                            {isPlatformView
                              ? ` · ${thread.clinic.brandName ?? thread.clinic.name}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                            thread.status
                          )}`}
                        >
                          {getStatusLabel(
                            thread.status
                          )}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Atualizado em{" "}
                        {formatDate(
                          thread.updatedAt
                        )}
                      </p>
                    </Link>
                  )
                )
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Conversa"
          description="Acompanhe o histórico do chamado selecionado."
        >
          {overview.selectedThread ? (
            <div className="space-y-6 p-5">
              <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    {
                      overview
                        .selectedThread
                        .subject
                    }
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabel(
                      overview
                        .selectedThread
                        .category
                    )}
                    {" · "}
                    {isPlatformView
                      ? overview
                          .selectedThread
                          .clinic.brandName ??
                        overview
                          .selectedThread
                          .clinic.name
                      : "Empresa atual"}
                  </p>
                </div>

                <form
                  action={
                    updateSupportThreadStatusAction
                  }
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    type="hidden"
                    name="threadId"
                    value={
                      overview
                        .selectedThread.id
                    }
                  />
                  <select
                    name="status"
                    defaultValue={
                      overview
                        .selectedThread.status
                    }
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    {overview.statusOptions.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {getStatusLabel(
                            status
                          )}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
                  >
                    Atualizar status
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {overview.selectedThread.messages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className="surface-subtle p-4"
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <p className="font-medium">
                          {message.authorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {message.authorScope ===
                          "PLATFORM"
                            ? "Plataforma"
                            : "Empresa"}
                          {" · "}
                          {formatDate(
                            message.createdAt
                          )}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                        {message.body}
                      </p>
                    </div>
                  )
                )}
              </div>

              <form
                action={
                  addSupportMessageAction
                }
                className="grid gap-3 border-t pt-4"
              >
                <input
                  type="hidden"
                  name="threadId"
                  value={
                    overview.selectedThread.id
                  }
                />
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">
                    Nova resposta
                  </span>
                  <textarea
                    name="body"
                    required
                    rows={5}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Escreva a próxima atualização deste chamado."
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Enviar resposta
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Selecione um chamado para ver a conversa.
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardPage>
  );
}
