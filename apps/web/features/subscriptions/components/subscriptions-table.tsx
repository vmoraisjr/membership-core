import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
};

export function SubscriptionsTable({
  subscriptions,
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
          </TableRow>
        </TableHeader>

        <TableBody>
          {subscriptions.map(
            (subscription) => (
              <TableRow
                key={subscription.id}
              >
                <TableCell className="font-medium">
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
                </TableCell>
              </TableRow>
            )
          )}

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
