import Link from "next/link";

import { cn } from "@/lib/utils";
import { chamadosUrl, empresaUrl } from "@/lib/owner-routes";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { MyCompanyTabs } from "@/features/clinic/components/my-company-tabs";
import {
  legendSection,
  SUPPORT_THREAD_STATUS_LEGEND,
} from "@/lib/legend-content";
import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Textarea } from "@/components/ui/textarea";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { addSupportMessageAction } from "../actions/add-support-message";
import { createSupportThreadAction } from "../actions/create-support-thread";
import { updateSupportThreadStatusAction } from "../actions/update-support-thread-status";
import { getSupportThreadsOverview } from "../services/get-support-threads-overview";
import { getSupportThreadStatusTone } from "../utils/support-status";
import { withThreadId } from "../utils/support-navigation";

type Scope =
  | { type: "global" }
  | {
      type: "company";
      clinicId: string;
      clinicName: string;
      returnBase: string;
    };

type Props = {
  filters: {
    threadId?: string;
    category?: string;
    status?: string;
    clinicId?: string;
  };
  scope?: Scope;
};

function formatDate(
  value: Date | string
) {
  return new Date(value).toLocaleString(
    "pt-BR"
  );
}

export async function SupportThreadsPage({
  filters,
  scope = { type: "global" },
}: Props) {
  const t = getTranslations();
  const role = await getCurrentUserRole();
  const isCompanyScope =
    scope.type === "company";

  if (
    !hasPermission(
      role,
      "messages",
      "view"
    )
  ) {
    const accessDenied = (
      <AccessDenied
        title={t(
          "support.accessDeniedTitle"
        )}
        description={t(
          "support.accessDeniedDescription"
        )}
      />
    );

    return isCompanyScope ? (
      accessDenied
    ) : (
      <DashboardPage>
        {accessDenied}
      </DashboardPage>
    );
  }

  const canManageThreads = hasPermission(
    role,
    "messages",
    "manage"
  );

  const overview =
    await getSupportThreadsOverview(
      isCompanyScope
        ? {
            ...filters,
            clinicId: scope.clinicId,
          }
        : filters
    );
  const isPlatformView =
    overview.workspace.type ===
    "platform";

  const globalBase = (() => {
    const params = new URLSearchParams();

    if (filters.category) {
      params.set(
        "category",
        filters.category
      );
    }

    if (filters.status) {
      params.set(
        "status",
        filters.status
      );
    }

    if (
      isPlatformView &&
      filters.clinicId
    ) {
      params.set(
        "clinicId",
        filters.clinicId
      );
    }

    if (!isPlatformView) {
      params.set("tab", "support");
    }

    const query = params.toString();
    const base = isPlatformView
      ? "/dashboard/chamados"
      : "/dashboard/minha-empresa";

    return query
      ? `${base}?${query}`
      : base;
  })();

  const returnToBase = isCompanyScope
    ? scope.returnBase
    : globalBase;

  const content = (
    <>
      <div className="page-section-grid xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard
            title={t(
              "support.list.title"
            )}
            description={t(
              "support.list.description"
            )}
            helpLegend={[
              legendSection(
                "Status do chamado",
                SUPPORT_THREAD_STATUS_LEGEND
              ),
            ]}
            action={
              canManageThreads ? (
                <Dialog>
                  <DialogTrigger
                    asChild
                  >
                    <Button size="sm">
                      {t(
                        "support.newThread.trigger"
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t(
                          "support.newThread.title"
                        )}
                      </DialogTitle>
                      <DialogDescription>
                        {t(
                          "support.newThread.description"
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      action={
                        createSupportThreadAction
                      }
                      className="grid gap-4"
                    >
                      <input
                        type="hidden"
                        name="returnTo"
                        value={
                          returnToBase
                        }
                      />
                      {isCompanyScope ? (
                        <input
                          type="hidden"
                          name="clinicId"
                          value={
                            scope.clinicId
                          }
                        />
                      ) : isPlatformView ? (
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">
                            {t(
                              "support.newThread.clinicLabel"
                            )}
                          </span>
                          <Select
                            name="clinicId"
                            required
                            defaultValue=""
                          >
                            <option value="">
                              {t(
                                "support.newThread.clinicPlaceholder"
                              )}
                            </option>
                            {overview.clinics.map(
                              (
                                clinic
                              ) => (
                                <option
                                  key={
                                    clinic.id
                                  }
                                  value={
                                    clinic.id
                                  }
                                >
                                  {
                                    clinic.name
                                  }
                                </option>
                              )
                            )}
                          </Select>
                        </label>
                      ) : null}

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium">
                          {t(
                            "support.newThread.subjectLabel"
                          )}
                        </span>
                        <Input
                          name="subject"
                          required
                          placeholder={t(
                            "support.newThread.subjectPlaceholder"
                          )}
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium">
                          {t(
                            "support.newThread.categoryLabel"
                          )}
                        </span>
                        <Select
                          name="category"
                          defaultValue={
                            filters.category ??
                            "REQUEST"
                          }
                        >
                          {overview.categoryOptions.map(
                            (
                              category
                            ) => (
                              <option
                                key={
                                  category
                                }
                                value={
                                  category
                                }
                              >
                                {t(
                                  `support.category.${category}`
                                )}
                              </option>
                            )
                          )}
                        </Select>
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium">
                          {t(
                            "support.newThread.bodyLabel"
                          )}
                        </span>
                        <Textarea
                          name="body"
                          required
                          rows={5}
                          placeholder={t(
                            "support.newThread.bodyPlaceholder"
                          )}
                        />
                      </label>

                      <Button type="submit">
                        {t(
                          "support.newThread.submit"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : null
            }
          >
            <form
              method="get"
              className="grid gap-3 border-b p-5"
            >
              {isCompanyScope ? (
                <input
                  type="hidden"
                  name="tab"
                  value="chamados"
                />
              ) : null}

              {isPlatformView &&
              !isCompanyScope ? (
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">
                    {t(
                      "support.list.clinicLabel"
                    )}
                  </span>
                  <Select
                    name="clinicId"
                    defaultValue={
                      overview.selectedClinicId
                    }
                  >
                    <option value="">
                      {t(
                        "support.list.allClinics"
                      )}
                    </option>
                    {overview.clinics.map(
                      (clinic) => (
                        <option
                          key={clinic.id}
                          value={
                            clinic.id
                          }
                        >
                          {clinic.name}
                        </option>
                      )
                    )}
                  </Select>
                </label>
              ) : null}

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  {t(
                    "support.list.categoryLabel"
                  )}
                </span>
                <Select
                  name="category"
                  defaultValue={
                    filters.category ?? ""
                  }
                >
                  <option value="">
                    {t(
                      "support.list.allCategories"
                    )}
                  </option>
                  {overview.categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {t(
                          `support.category.${category}`
                        )}
                      </option>
                    )
                  )}
                </Select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  {t(
                    "support.list.statusLabel"
                  )}
                </span>
                <Select
                  name="status"
                  defaultValue={
                    filters.status ?? ""
                  }
                >
                  <option value="">
                    {t(
                      "support.list.allStatuses"
                    )}
                  </option>
                  {overview.statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {t(
                          `support.status.${status}`
                        )}
                      </option>
                    )
                  )}
                </Select>
              </label>

              <Button
                type="submit"
                variant="outline"
              >
                {t(
                  "shared.actions.applyFilters"
                )}
              </Button>
            </form>

            <div className="divide-y max-h-[520px] overflow-y-auto">
              {overview.threads.length ===
              0 ? (
                <EmptyState
                  title={t(
                    "support.empty.title"
                  )}
                  description={t(
                    "support.empty.description"
                  )}
                />
              ) : (
                overview.threads.map(
                  (thread) => (
                    <Link
                      key={thread.id}
                      href={withThreadId(
                        returnToBase,
                        thread.id
                      )}
                      className="block px-5 py-4 transition-colors duration-150 hover:bg-[color:var(--color-surface-subtle)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <CompanyAvatarMark
                            name={
                              isPlatformView &&
                              !isCompanyScope
                                ? (thread.clinic.brandName ?? thread.clinic.name)
                                : thread.subject
                            }
                            seed={thread.id}
                            className="mt-0.5"
                          />
                          <div className="space-y-1">
                            <p className="font-medium">
                              {
                                thread.subject
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t(
                                `support.category.${thread.category}`
                              )}
                              {isPlatformView &&
                              !isCompanyScope
                                ? ` · ${thread.clinic.brandName ?? thread.clinic.name}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <StatusIndicator
                          tone={getSupportThreadStatusTone(
                            thread.status
                          )}
                          label={t(
                            `support.status.${thread.status}`
                          )}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t(
                          "support.list.updatedAt",
                          {
                            date: formatDate(
                              thread.updatedAt
                            ),
                          }
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
          title={t(
            "support.conversation.title"
          )}
          description={t(
            "support.conversation.description"
          )}
          contentClassName="p-0"
        >
          {overview.selectedThread ? (
            <div className="flex h-[640px] flex-col">
              <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    {
                      overview
                        .selectedThread
                        .subject
                    }
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      `support.category.${overview.selectedThread.category}`
                    )}
                    {" · "}
                    {overview
                      .selectedThread
                      .clinic
                      .brandName ??
                      overview
                        .selectedThread
                        .clinic.name}
                  </p>
                  {isPlatformView &&
                  !isCompanyScope ? (
                    <Link
                      href={empresaUrl(
                        overview
                          .selectedThread
                          .clinic.id,
                        {
                          tab: "chamados",
                          threadId:
                            overview
                              .selectedThread
                              .id,
                        }
                      )}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Abrir empresa →
                    </Link>
                  ) : null}
                  {isCompanyScope ? (
                    <Link
                      href={chamadosUrl({
                        threadId:
                          overview
                            .selectedThread
                            .id,
                        clinicId:
                          scope.clinicId,
                      })}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Ver na fila global →
                    </Link>
                  ) : null}
                </div>

                {canManageThreads ? (
                  <form
                    id="update-support-thread-status-form"
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
                          .selectedThread
                          .id
                      }
                    />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={returnToBase}
                    />
                    <label className="sr-only">
                      {t(
                        "support.conversation.updateStatusLabel"
                      )}
                    </label>
                    <Select
                      name="status"
                      defaultValue={
                        overview
                          .selectedThread
                          .status
                      }
                      className="h-9"
                    >
                      {overview.statusOptions.map(
                        (status) => (
                          <option
                            key={status}
                            value={
                              status
                            }
                          >
                            {t(
                              `support.status.${status}`
                            )}
                          </option>
                        )
                      )}
                    </Select>
                    <ConfirmSubmitButton
                      formId="update-support-thread-status-form"
                      size="sm"
                      variant="outline"
                      label={t(
                        "support.conversation.updateStatusAction"
                      )}
                      title={t(
                        "support.conversation.updateStatusConfirmTitle"
                      )}
                      description={t(
                        "support.conversation.updateStatusConfirmDescription"
                      )}
                      actionLabel={t(
                        "support.conversation.updateStatusAction"
                      )}
                    />
                  </form>
                ) : (
                  <StatusIndicator
                    tone={getSupportThreadStatusTone(
                      overview
                        .selectedThread
                        .status
                    )}
                    label={t(
                      `support.status.${overview.selectedThread.status}`
                    )}
                  />
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {overview.selectedThread.messages.map(
                  (message) => {
                    const isOwnMessage =
                      isPlatformView
                        ? message.authorScope ===
                          "PLATFORM"
                        : message.authorScope !==
                          "PLATFORM";

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col gap-1",
                          isOwnMessage
                            ? "items-end"
                            : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "chat-bubble",
                            isOwnMessage
                              ? "chat-bubble-own"
                              : "chat-bubble-other"
                          )}
                        >
                          <p className="whitespace-pre-wrap">
                            {
                              message.body
                            }
                          </p>
                        </div>
                        <p className="px-1 text-xs text-muted-foreground">
                          {
                            message.authorName
                          }
                          {" · "}
                          {message.authorScope ===
                          "PLATFORM"
                            ? t(
                                "support.conversation.authorPlatform"
                              )
                            : t(
                                "support.conversation.authorClinic"
                              )}
                          {" · "}
                          {formatDate(
                            message.createdAt
                          )}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>

              {canManageThreads ? (
                <form
                  action={
                    addSupportMessageAction
                  }
                  className="flex items-end gap-3 border-t p-4"
                >
                  <input
                    type="hidden"
                    name="threadId"
                    value={
                      overview
                        .selectedThread.id
                    }
                  />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={returnToBase}
                  />
                  <label className="sr-only">
                    {t(
                      "support.conversation.replyLabel"
                    )}
                  </label>
                  <Textarea
                    name="body"
                    required
                    rows={2}
                    placeholder={t(
                      "support.conversation.replyPlaceholder"
                    )}
                    className="min-h-0 flex-1 resize-none"
                  />
                  <Button type="submit">
                    {t(
                      "support.conversation.replySubmit"
                    )}
                  </Button>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              {t(
                "support.conversation.empty"
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );

  if (isCompanyScope) {
    return content;
  }

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={
          isPlatformView
            ? t("support.platformEyebrow")
            : t("support.clinicEyebrow")
        }
        title={
          isPlatformView
            ? t("support.platformTitle")
            : t("support.clinicTitle")
        }
        description={
          isPlatformView
            ? t(
                "support.platformDescription"
              )
            : t(
                "support.clinicDescription"
              )
        }
      />
      {!isPlatformView ? (
        <MyCompanyTabs
          activeTab="support"
          role={role}
        />
      ) : null}
      {content}
    </DashboardPage>
  );
}
