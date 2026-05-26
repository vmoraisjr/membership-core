<<<<<<< HEAD
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
=======
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
<<<<<<< HEAD
import {
  formatCurrency,
  formatDate,
  formatEnumLabel,
} from "@/lib/formatters";

type SubscriptionRow = {
  id: string;
  status: string;
  startedAt: Date;
  expiresAt: Date | null;
  patient: {
    fullName: string;
  };
  membershipPlan: {
    name: string;
    monthlyPrice: number | null;
  };
};

type SubscriptionsTableProps = {
  subscriptions: SubscriptionRow[];
=======

type Props = {
  subscriptions: any[];
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
};

export function SubscriptionsTable({
  subscriptions,
<<<<<<< HEAD
}: SubscriptionsTableProps) {
  return (
    <DataTableContainer
      title="Subscription Registry"
      description="Patient-plan links that power billing, eligibility, and future benefit redemption."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Monthly Value</TableHead>
=======
}: Props) {
  return (
    <div className="border rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Patient
            </TableHead>

            <TableHead>
              Plan
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead>
              Expires At
            </TableHead>
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
          </TableRow>
        </TableHeader>

        <TableBody>
          {subscriptions.map(
            (subscription) => (
              <TableRow
                key={subscription.id}
              >
<<<<<<< HEAD
                <TableCell className="font-medium">
=======
                <TableCell>
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
                  {
                    subscription.patient
                      .fullName
                  }
                </TableCell>

                <TableCell>
                  {
                    subscription
                      .membershipPlan.name
                  }
                </TableCell>

                <TableCell>
<<<<<<< HEAD
                  {formatEnumLabel(
                    subscription.status
                  )}
                </TableCell>

                <TableCell>
                  {formatDate(
                    subscription.startedAt
                  )}
                </TableCell>

                <TableCell>
                  {formatDate(
                    subscription.expiresAt
                  )}
                </TableCell>

                <TableCell>
                  {formatCurrency(
                    subscription
                      .membershipPlan
                      .monthlyPrice
                  )}
=======
                  {subscription.status}
                </TableCell>

                <TableCell>
                  {new Date(
                    subscription.expiresAt
                  ).toLocaleDateString()}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
                </TableCell>
              </TableRow>
            )
          )}
<<<<<<< HEAD

          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="p-0"
              >
                <EmptyState
                  title="No subscriptions yet"
                  description="Link a patient to a membership plan to establish the relational core for renewals, benefits, and future billing."
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
=======
        </TableBody>
      </Table>
    </div>
  );
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
