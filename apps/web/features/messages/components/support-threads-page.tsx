import Link from "next/link";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
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

type Props = {
  filters: {
    threadId?: string;
    category?: string;
    status?: string;
    clinicId?: string;
  };
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
}: Props) {
  const t = getTranslations();
  const role = await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "messages",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t(
            "support.accessDeniedTitle"
          )}
          description={t(
            "support.accessDeniedDescription"
          )}
        />
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

      <div className="page-section-grid xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          {canManageThreads ? (
            <SectionCard
              title={t(
                "support.newThread.title"
              )}
              description={t(
                "support.newThread.description"
              )}
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
                        (clinic) => (
                          <option
                            key={
                              clinic.id
                            }
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
                    defaultValue="REQUEST"
                  >
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
            </SectionCard>
          ) : null}

          <SectionCard
            title={t(
              "support.list.title"
            )}
            description={t(
              "support.list.description"
            )}
          >
            <form
              method="get"
              className="grid gap-3 border-b p-5"
            >
              {isPlatformView ? (
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

            <div className="divide-y">
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
                      href={`/dashboard/messages?threadId=${thread.id}`}
                      className="block px-5 py-4 transition-colors duration-150 hover:bg-[color:var(--color-surface-subtle)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <CompanyAvatarMark
                            name={
                              isPlatformView
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
                              {isPlatformView
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
                </div>

                {canManageThreads ? (
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
                          .selectedThread
                          .id
                      }
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
                      className="h-10"
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
                    <Button
                      type="submit"
                      variant="outline"
                    >
                      {t(
                        "support.conversation.updateStatusAction"
                      )}
                    </Button>
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

              <div className="space-y-3">
                {overview.selectedThread.messages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className="surface-subtle p-4"
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <p className="font-medium">
                          {
                            message.authorName
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                        {message.body}
                      </p>
                    </div>
                  )
                )}
              </div>

              {canManageThreads ? (
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
                      overview
                        .selectedThread.id
                    }
                  />
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">
                      {t(
                        "support.conversation.replyLabel"
                      )}
                    </span>
                    <Textarea
                      name="body"
                      required
                      rows={5}
                      placeholder={t(
                        "support.conversation.replyPlaceholder"
                      )}
                    />
                  </label>
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
    </DashboardPage>
  );
}
