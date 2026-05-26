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
  formatEnumLabel,
} from "@/lib/formatters";

type MembershipBenefitRow = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  discountPercentage: number | null;
  discountAmount: number | null;
  usageLimit: number | null;
  resetPeriod: string | null;
  membershipPlan: {
    name: string;
  };
};

type MembershipBenefitsTableProps = {
  benefits: MembershipBenefitRow[];
};

function renderConfiguration(
  benefit: MembershipBenefitRow
) {
  if (
    benefit.type ===
    "PERCENTAGE_DISCOUNT"
  ) {
    return `${benefit.discountPercentage ?? 0}% off`;
  }

  if (benefit.type === "FIXED_DISCOUNT") {
    return `${formatCurrency(
      benefit.discountAmount
    )} off`;
  }

  if (benefit.type === "LIMITED") {
    return `${benefit.usageLimit ?? 0} uses`;
  }

  return "Included benefit";
}

export function MembershipBenefitsTable({
  benefits,
}: MembershipBenefitsTableProps) {
  return (
    <DataTableContainer
      title="Benefits Catalog"
      description="Plan-linked benefits that will later feed validation and redemption rules."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead>Reset Period</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {benefits.map((benefit) => (
            <TableRow key={benefit.id}>
              <TableCell className="font-medium">
                {benefit.title}
              </TableCell>

              <TableCell>
                {
                  benefit.membershipPlan
                    .name
                }
              </TableCell>

              <TableCell>
                {formatEnumLabel(
                  benefit.type
                )}
              </TableCell>

              <TableCell>
                {renderConfiguration(
                  benefit
                )}
              </TableCell>

              <TableCell>
                {benefit.resetPeriod
                  ? formatEnumLabel(
                      benefit.resetPeriod
                    )
                  : "-"}
              </TableCell>
            </TableRow>
          ))}

          {benefits.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="p-0"
              >
                <EmptyState
                  title="No benefits yet"
                  description="Add benefits to a membership plan so the platform can evolve beyond plan pricing into real member value."
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
