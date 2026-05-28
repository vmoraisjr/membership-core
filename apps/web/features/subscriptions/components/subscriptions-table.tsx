import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  subscriptions: any[];
};

export function SubscriptionsTable({
  subscriptions,
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
          </TableRow>
        </TableHeader>

        <TableBody>
          {subscriptions.map(
            (subscription) => (
              <TableRow
                key={subscription.id}
              >
                <TableCell>
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
                  {subscription.status}
                </TableCell>

                <TableCell>
                  {new Date(
                    subscription.expiresAt
                  ).toLocaleDateString()}
                </TableCell>
              </TableRow>
            )
          )}

          {subscriptions.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-10 text-center text-muted-foreground"
              >
                No subscriptions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}