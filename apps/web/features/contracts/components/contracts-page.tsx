import {
  ClinicContractStatus,
  PatientContractStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";

import { acceptPatientContractAction } from "../actions/accept-patient-contract";
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
    case "PENDING_ACCEPTANCE":
    case "PENDING_SIGNATURE":
    case "DRAFT":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
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
        title="Patient contracts"
        description="Contracts generated from subscription enrollment."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Patient
                </th>
                <th className="py-2">
                  Subscription
                </th>
                <th className="py-2">
                  Status
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
                    colSpan={4}
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
                      <td className="py-3 text-right">
                        {canManageContracts &&
                        contract.status ===
                          PatientContractStatus.PENDING_ACCEPTANCE ? (
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
                  Files
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.clinicContracts
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
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
                        {contract.files
                          .length > 0
                          ? contract.files
                              .length
                          : "No files referenced"}
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
