import type { BillingGateway } from "./billing-gateway.types";
import { fakeBillingGateway } from "./fake-billing-gateway";

/**
 * Single seam for selecting the active billing gateway implementation.
 * PAY-001 ships only the fake (see the task's provider decision — no
 * contract signed yet). Adding a real provider later means implementing
 * `BillingGateway` and adding one branch here; no caller changes.
 */
export function getBillingGateway(): BillingGateway {
  return fakeBillingGateway;
}
