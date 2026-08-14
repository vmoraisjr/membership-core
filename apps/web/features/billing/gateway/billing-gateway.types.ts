import type { BillingProviderKind } from "@prisma/client";

// A provider kind that actually implements the gateway (excludes MANUAL,
// which means "no gateway attached").
export type ActiveBillingProviderKind =
  Exclude<BillingProviderKind, "MANUAL">;

export type BillingGatewaySubscriptionState =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled";

export type BillingGatewayCustomer = {
  externalCustomerId: string;
};

export type BillingGatewaySubscription = {
  externalSubscriptionId: string;
  externalCustomerId: string;
  state: BillingGatewaySubscriptionState;
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
  canceledAt: Date | null;
};

export type BillingCheckoutSession = {
  externalSessionId: string;
  url: string;
};

export type BillingPortalSession = {
  url: string;
};

export type BillingWebhookEvent = {
  externalEventId: string;
  type: string;
  externalSubscriptionId: string | null;
  payload: Record<string, unknown>;
};

/**
 * Port for the recurring-card billing gateway. UI and Server Actions only
 * ever depend on this interface — never on a specific provider's SDK or
 * brand name — so a real provider can be dropped in later as another
 * implementation without touching callers. `FakeBillingGateway` is the only
 * implementation for now (see PAY-001 decision to defer the real provider
 * choice); it never calls a real API and never handles card data.
 */
export interface BillingGateway {
  readonly kind: ActiveBillingProviderKind;

  createCustomer(input: {
    clinicId: string;
    email: string;
    name: string;
  }): Promise<BillingGatewayCustomer>;

  createTrialSubscription(input: {
    clinicId: string;
    externalCustomerId: string;
    trialDays: number;
  }): Promise<BillingGatewaySubscription>;

  getSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription | null>;

  createCheckoutSession(input: {
    clinicId: string;
    externalCustomerId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<BillingCheckoutSession>;

  createPortalSession(input: {
    externalCustomerId: string;
    returnUrl: string;
  }): Promise<BillingPortalSession>;

  pauseSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription>;

  resumeSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription>;

  cancelSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription>;

  verifyWebhookSignature(input: {
    rawBody: string;
    signatureHeader: string | null;
  }): BillingWebhookEvent;
}
