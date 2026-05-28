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
import { formatCurrency } from "@/lib/formatters";
import { MembershipPlanRowActions } from "./membership-plan-row-actions";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
};

type Props = {
  plans: Plan[];
};

export function PlansTable({
  plans,
}: Props) {
  return (
    <DataTableContainer
      title="Plans Catalog"
      description="Commercial plans available for the current clinic tenant."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Description</TableHead>

            <TableHead>Monthly Price</TableHead>

            <TableHead>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">
                {plan.name}
              </TableCell>

              <TableCell>
                {plan.description}
              </TableCell>

              <TableCell>
                {formatCurrency(
                  plan.monthlyPrice
                )}
              </TableCell>
              <TableCell>
  <MembershipPlanRowActions
    plan={{
  id: plan.id,

  name: plan.name,

  description:
    plan.description,

  monthlyPrice: Number(
    plan.monthlyPrice
  ),
}}
  />
</TableCell>
            </TableRow>
          ))}

          {plans.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="p-0">
                <EmptyState
                  title="No plans yet"
                  description="Create the first membership plan for this clinic so subscriptions and benefits can be attached to it."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
