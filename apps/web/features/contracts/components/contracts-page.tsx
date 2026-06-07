import {
  ClinicContractStatus,
  ContractType,
  PatientContractStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { formatDate } from "@/lib/formatters";

import { addClinicContractFileReferenceAction } from "../actions/add-clinic-contract-file-reference";
import { activateContractTemplateAction } from "../actions/activate-contract-template";
import { acceptPatientContractAction } from "../actions/accept-patient-contract";
import { deactivateContractTemplateAction } from "../actions/deactivate-contract-template";
import { saveContractTemplateAction } from "../actions/save-contract-template";
import { updateClinicContractStatusAction } from "../actions/update-clinic-contract-status";
import { updatePatientContractStatusAction } from "../actions/update-patient-contract-status";
import { getContractsOverview } from "../services/contracts-foundation";

function getContractStatusClass(
  status:
    | PatientContractStatus
    | ClinicContractStatus
) {
  switch (status) {
    case "ACCEPTED":
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING_SIGNATURE":
    case "DRAFT":
      return "bg-amber-100 text-amber-800";
    case "ARCHIVED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getTemplateScopeLabel(
  scope: "DEFAULT" | "CLINIC" | undefined
) {
  if (scope === "CLINIC") {
    return "Clinic override";
  }

  return "Default template";
}

function getPatientContractStatusOptions(
  status: PatientContractStatus
) {
  switch (status) {
    case PatientContractStatus.DRAFT:
      return [
        PatientContractStatus.DRAFT,
        PatientContractStatus.ACTIVE,
        PatientContractStatus.ARCHIVED,
      ];
    case PatientContractStatus.ACTIVE:
      return [
        PatientContractStatus.ACTIVE,
        PatientContractStatus.ARCHIVED,
      ];
    case PatientContractStatus.ACCEPTED:
      return [PatientContractStatus.ARCHIVED];
    default:
      return [PatientContractStatus.ARCHIVED];
  }
}

export async function ContractsPage() {
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "contracts",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Contracts access denied"
          description="The current role cannot view contracts."
        />
      </DashboardPage>
    );
  }

  const overview =
    await getContractsOverview();
  const canManageContracts =
    hasPermission(
      role,
      "contracts",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title="Contracts"
        description="Track patient subscription contracts and the clinic's Nortex agreement."
      />

      <SectionCard
        title="Contract templates"
        description="V1 uses one effective patient template and one effective clinic platform template per clinic, with clinic-specific templates that can be activated or deactivated."
      >
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {[
            {
              type:
                ContractType.PATIENT_MEMBERSHIP,
              heading:
                "Patient membership template",
              template:
                overview.patientTemplate,
              clinicTemplates:
                overview.patientClinicTemplates,
            },
            {
              type:
                ContractType.CLINIC_PLATFORM,
              heading:
                "Clinic platform template",
              template:
                overview.clinicTemplate,
              clinicTemplates:
                overview.clinicClinicTemplates,
            },
          ].map((entry) => (
            <div
              key={entry.type}
              className="grid gap-3 rounded-xl border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">
                    {entry.heading}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Effective template:
                    {" "}
                    {getTemplateScopeLabel(
                      entry.template?.scope
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium">
                  {entry.template?.title ??
                    "No effective template"}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                  {entry.template?.content ??
                    "This contract type is currently missing an effective template."}
                </p>
              </div>

              {canManageContracts ? (
                <form
                  action={
                    saveContractTemplateAction
                  }
                  className="grid gap-3 rounded-lg border p-3"
                >
                  <input
                    type="hidden"
                    name="type"
                    value={entry.type}
                  />
                  <p className="text-sm font-medium">
                    Create clinic template
                  </p>
                  <label className="grid gap-2 text-sm">
                    <span>Title</span>
                    <Input
                      name="title"
                      defaultValue=""
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span>Content</span>
                    <Textarea
                      name="content"
                      rows={6}
                      defaultValue=""
                    />
                  </label>
                  <div className="flex justify-end">
                    <Button type="submit">
                      Create template
                    </Button>
                  </div>
                </form>
              ) : null}

              <div className="grid gap-3">
                {entry.clinicTemplates.length ===
                0 ? (
                  <p className="text-xs text-muted-foreground">
                    No clinic-specific templates created yet.
                  </p>
                ) : (
                  entry.clinicTemplates.map(
                    (template) => (
                      <div
                        key={template.id}
                        className="grid gap-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {template.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {template.active
                                ? "Active for future contracts"
                                : "Inactive clinic template"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${template.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}
                          >
                            {template.active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </div>

                        {canManageContracts ? (
                          <form
                            action={
                              saveContractTemplateAction
                            }
                            className="grid gap-3"
                          >
                            <input
                              type="hidden"
                              name="templateId"
                              value={
                                template.id
                              }
                            />
                            <input
                              type="hidden"
                              name="type"
                              value={
                                template.type
                              }
                            />
                            <Input
                              name="title"
                              defaultValue={
                                template.title
                              }
                            />
                            <Textarea
                              name="content"
                              rows={5}
                              defaultValue={
                                template.content
                              }
                            />
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button type="submit" variant="outline">
                                Save edits
                              </Button>
                            </div>
                          </form>
                        ) : null}

                        {canManageContracts ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            {template.active ? (
                              <form
                                action={
                                  deactivateContractTemplateAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="templateId"
                                  value={
                                    template.id
                                  }
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                >
                                  Deactivate
                                </Button>
                              </form>
                            ) : (
                              <form
                                action={
                                  activateContractTemplateAction
                                }
                              >
                                <input
                                  type="hidden"
                                  name="templateId"
                                  value={
                                    template.id
                                  }
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                >
                                  Activate
                                </Button>
                              </form>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Patient contracts"
        description="Contracts generated from subscription enrollment."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Title
                </th>
                <th className="py-2">
                  Patient
                </th>
                <th className="py-2">
                  Subscription
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Accepted
                </th>
                <th className="py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.patientContracts
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No patient contracts found.
                  </td>
                </tr>
              ) : (
                overview.patientContracts.map(
                  (contract) => (
                    <tr
                      key={contract.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {contract.title}
                      </td>
                      <td className="py-3">
                        {
                          contract.patient
                            .fullName
                        }
                      </td>
                      <td className="py-3">
                        {
                          contract
                            .subscription.id
                        }
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getContractStatusClass(
                            contract.status
                          )}`}
                        >
                          {
                            contract.status
                          }
                        </span>
                      </td>
                      <td className="py-3">
                        {formatDate(
                          contract.acceptedAt
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {canManageContracts &&
                        contract.status ===
                          PatientContractStatus.ACTIVE ? (
                          <form
                            action={
                              acceptPatientContractAction
                            }
                            className="inline-flex"
                          >
                            <input
                              type="hidden"
                              name="contractId"
                              value={
                                contract.id
                              }
                            />
                            <button
                              type="submit"
                              className="rounded-md border px-3 py-1.5"
                            >
                              Accept
                            </button>
                          </form>
                        ) : null}
                        {canManageContracts ? (
                          <form
                            action={
                              updatePatientContractStatusAction
                            }
                            className="mt-2 inline-flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="contractId"
                              value={
                                contract.id
                              }
                            />
                            <select
                              name="status"
                              defaultValue={
                                getPatientContractStatusOptions(
                                  contract.status
                                )[0]
                              }
                              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                            >
                              {getPatientContractStatusOptions(
                                contract.status
                              ).map(
                                (
                                  status
                                ) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {status}
                                  </option>
                                )
                              )}
                            </select>
                            <Button
                              type="submit"
                              variant="outline"
                            >
                              Update
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {contract.acceptances
                              .length > 0
                              ? "Recorded"
                              : "Read only"}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Clinic platform contracts"
        description="Commercial agreement records between Nortex and the clinic."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Title
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Signed
                </th>
                <th className="py-2">
                  Effective
                </th>
                <th className="py-2">
                  Files
                </th>
                <th className="py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.clinicContracts
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No clinic contracts found.
                  </td>
                </tr>
              ) : (
                overview.clinicContracts.map(
                  (contract) => (
                    <tr
                      key={contract.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {
                          contract.title
                        }
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getContractStatusClass(
                            contract.status
                          )}`}
                        >
                          {
                            contract.status
                          }
                        </span>
                      </td>
                      <td className="py-3">
                        {formatDate(
                          contract.signedAt
                        )}
                      </td>
                      <td className="py-3">
                        {formatDate(
                          contract.effectiveAt
                        )}
                      </td>
                      <td className="py-3">
                        <div className="space-y-2">
                          {contract.files
                            .length > 0 ? (
                            contract.files.map(
                              (file) => (
                                <div
                                  key={file.id}
                                  className="text-xs"
                                >
                                  <div className="font-medium">
                                    {
                                      file.fileName
                                    }
                                  </div>
                                  <a
                                    href={
                                      file.fileUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-muted-foreground underline"
                                  >
                                    Open reference
                                  </a>
                                </div>
                              )
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No files referenced
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        {canManageContracts ? (
                          <div className="grid gap-3 justify-items-end">
                            <form
                              action={
                                updateClinicContractStatusAction
                              }
                              className="flex items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="contractId"
                                value={
                                  contract.id
                                }
                              />
                              <select
                                name="status"
                                defaultValue={
                                  contract.status
                                }
                                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                              >
                                {[
                                  ClinicContractStatus.PENDING_SIGNATURE,
                                  ClinicContractStatus.ACTIVE,
                                  ClinicContractStatus.SUSPENDED,
                                  ClinicContractStatus.CANCELED,
                                ].map(
                                  (
                                    status
                                  ) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    >
                                      {status}
                                    </option>
                                  )
                                )}
                              </select>
                              <Button
                                type="submit"
                                variant="outline"
                              >
                                Update
                              </Button>
                            </form>

                            <form
                              action={
                                addClinicContractFileReferenceAction
                              }
                              className="grid gap-2 rounded-lg border p-3 text-left"
                            >
                              <input
                                type="hidden"
                                name="contractId"
                                value={
                                  contract.id
                                }
                              />
                              <Input
                                name="fileName"
                                placeholder="Signed-agreement.pdf"
                              />
                              <Input
                                name="fileUrl"
                                placeholder="https://..."
                              />
                              <Button
                                type="submit"
                                variant="outline"
                              >
                                Add file reference
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Read only
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
