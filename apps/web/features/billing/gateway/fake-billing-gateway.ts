import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  BillingCheckoutSession,
  BillingGateway,
  BillingGatewayCustomer,
  BillingGatewaySubscription,
  BillingGatewaySubscriptionState,
  BillingPortalSession,
  BillingWebhookEvent,
} from "./billing-gateway.types";

/**
 * Deterministic, in-process fake of a card billing gateway. No network
 * calls, no real card data, no randomness in IDs — the same clinicId
 * always produces the same external IDs, so tests and manual QA can
 * reason about state without inspecting a real provider dashboard.
 *
 * State lives in module-level Maps: durable for the lifetime of one Node
 * process (fine for dev/test), reset on restart (also fine — this is a
 * test double, not a system of record). Never use this in production; a
 * real provider kind must be added to BillingProviderKind before shipping
 * a public checkout journey with actual cards.
 */

const FAKE_WEBHOOK_SECRET =
  process.env.FAKE_BILLING_WEBHOOK_SECRET ??
  "fake-billing-webhook-secret-dev-only";

type FakeCustomerRecord = {
  externalCustomerId: string;
  clinicId: string;
  email: string;
  name: string;
};

type FakeSubscriptionRecord = {
  externalSubscriptionId: string;
  externalCustomerId: string;
  clinicId: string;
  state: BillingGatewaySubscriptionState;
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
  canceledAt: Date | null;
};

export type FakeCheckoutSessionRecord = {
  externalSessionId: string;
  clinicId: string;
  externalCustomerId: string;
  successUrl: string;
  cancelUrl: string;
  status: "open" | "complete" | "expired";
};

const fakeCustomers = new Map<
  string,
  FakeCustomerRecord
>();
const fakeSubscriptionsById = new Map<
  string,
  FakeSubscriptionRecord
>();
const fakeCheckoutSessions = new Map<
  string,
  FakeCheckoutSessionRecord
>();

function deterministicId(
  prefix: string,
  seed: string
) {
  return `${prefix}_${seed}`;
}

function toGatewaySubscription(
  record: FakeSubscriptionRecord
): BillingGatewaySubscription {
  return {
    externalSubscriptionId:
      record.externalSubscriptionId,
    externalCustomerId:
      record.externalCustomerId,
    state: record.state,
    trialEndsAt: record.trialEndsAt,
    currentPeriodEndsAt:
      record.currentPeriodEndsAt,
    canceledAt: record.canceledAt,
  };
}

function requireSubscription(
  externalSubscriptionId: string
) {
  const record = fakeSubscriptionsById.get(
    externalSubscriptionId
  );

  if (!record) {
    throw new Error(
      `Fake gateway: unknown subscription ${externalSubscriptionId}.`
    );
  }

  return record;
}

export function signFakeWebhookPayload(
  rawBody: string
) {
  return createHmac(
    "sha256",
    FAKE_WEBHOOK_SECRET
  )
    .update(rawBody)
    .digest("hex");
}

export class FakeBillingGateway
  implements BillingGateway
{
  readonly kind = "FAKE" as const;

  async createCustomer(input: {
    clinicId: string;
    email: string;
    name: string;
  }): Promise<BillingGatewayCustomer> {
    const externalCustomerId =
      deterministicId(
        "fake_cus",
        input.clinicId
      );

    fakeCustomers.set(
      externalCustomerId,
      {
        externalCustomerId,
        clinicId: input.clinicId,
        email: input.email,
        name: input.name,
      }
    );

    return { externalCustomerId };
  }

  async createTrialSubscription(input: {
    clinicId: string;
    externalCustomerId: string;
    trialDays: number;
  }): Promise<BillingGatewaySubscription> {
    const externalSubscriptionId =
      deterministicId(
        "fake_sub",
        input.clinicId
      );
    const trialEndsAt = new Date();
    trialEndsAt.setDate(
      trialEndsAt.getDate() +
        input.trialDays
    );

    const record: FakeSubscriptionRecord =
      {
        externalSubscriptionId,
        externalCustomerId:
          input.externalCustomerId,
        clinicId: input.clinicId,
        state: "trialing",
        trialEndsAt,
        currentPeriodEndsAt: trialEndsAt,
        canceledAt: null,
      };

    fakeSubscriptionsById.set(
      externalSubscriptionId,
      record
    );

    return toGatewaySubscription(record);
  }

  async getSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription | null> {
    const record =
      fakeSubscriptionsById.get(
        externalSubscriptionId
      );

    return record
      ? toGatewaySubscription(record)
      : null;
  }

  async createCheckoutSession(input: {
    clinicId: string;
    externalCustomerId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<BillingCheckoutSession> {
    const externalSessionId =
      deterministicId(
        "fake_cs",
        `${input.clinicId}_${fakeCheckoutSessions.size}`
      );

    fakeCheckoutSessions.set(
      externalSessionId,
      {
        externalSessionId,
        clinicId: input.clinicId,
        externalCustomerId:
          input.externalCustomerId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        status: "open",
      }
    );

    return {
      externalSessionId,
      url: `/fake-checkout/${externalSessionId}`,
    };
  }

  async createPortalSession(input: {
    externalCustomerId: string;
    returnUrl: string;
  }): Promise<BillingPortalSession> {
    return {
      url: `/fake-portal/${input.externalCustomerId}?returnUrl=${encodeURIComponent(input.returnUrl)}`,
    };
  }

  async pauseSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription> {
    const record = requireSubscription(
      externalSubscriptionId
    );

    record.state = "paused";
    fakeSubscriptionsById.set(
      externalSubscriptionId,
      record
    );

    return toGatewaySubscription(record);
  }

  async resumeSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription> {
    const record = requireSubscription(
      externalSubscriptionId
    );

    record.state = "active";
    fakeSubscriptionsById.set(
      externalSubscriptionId,
      record
    );

    return toGatewaySubscription(record);
  }

  async cancelSubscription(
    externalSubscriptionId: string
  ): Promise<BillingGatewaySubscription> {
    const record = requireSubscription(
      externalSubscriptionId
    );

    record.state = "canceled";
    record.canceledAt = new Date();
    fakeSubscriptionsById.set(
      externalSubscriptionId,
      record
    );

    return toGatewaySubscription(record);
  }

  verifyWebhookSignature(input: {
    rawBody: string;
    signatureHeader: string | null;
  }): BillingWebhookEvent {
    if (!input.signatureHeader) {
      throw new Error(
        "Missing webhook signature."
      );
    }

    const expected = signFakeWebhookPayload(
      input.rawBody
    );
    const expectedBuffer =
      Buffer.from(expected);
    const providedBuffer = Buffer.from(
      input.signatureHeader
    );

    if (
      expectedBuffer.length !==
        providedBuffer.length ||
      !timingSafeEqual(
        expectedBuffer,
        providedBuffer
      )
    ) {
      throw new Error(
        "Invalid webhook signature."
      );
    }

    const parsed = JSON.parse(
      input.rawBody
    ) as {
      id: string;
      type: string;
      externalSubscriptionId?: string;
      data?: Record<string, unknown>;
    };

    return {
      externalEventId: parsed.id,
      type: parsed.type,
      externalSubscriptionId:
        parsed.externalSubscriptionId ??
        null,
      payload: parsed.data ?? {},
    };
  }

  // --- Test-only simulation helpers, not part of the BillingGateway port ---
  // These let the fake checkout route (PAY-002) and webhook tests (PAY-003)
  // drive state transitions that a real provider would otherwise trigger
  // asynchronously from its own dashboard/API.

  __getCheckoutSession(
    externalSessionId: string
  ) {
    return fakeCheckoutSessions.get(
      externalSessionId
    );
  }

  __completeCheckoutSession(
    externalSessionId: string
  ) {
    const session =
      fakeCheckoutSessions.get(
        externalSessionId
      );

    if (!session) {
      throw new Error(
        `Fake gateway: unknown checkout session ${externalSessionId}.`
      );
    }

    session.status = "complete";
    fakeCheckoutSessions.set(
      externalSessionId,
      session
    );

    const subscriptionId =
      deterministicId(
        "fake_sub",
        session.clinicId
      );
    const existing =
      fakeSubscriptionsById.get(
        subscriptionId
      );

    if (existing) {
      existing.state = "active";
      fakeSubscriptionsById.set(
        subscriptionId,
        existing
      );
    }

    return session;
  }

  __cancelCheckoutSession(
    externalSessionId: string
  ) {
    const session =
      fakeCheckoutSessions.get(
        externalSessionId
      );

    if (!session) {
      throw new Error(
        `Fake gateway: unknown checkout session ${externalSessionId}.`
      );
    }

    session.status = "expired";
    fakeCheckoutSessions.set(
      externalSessionId,
      session
    );

    return session;
  }

  __setSubscriptionState(
    externalSubscriptionId: string,
    state: BillingGatewaySubscriptionState
  ) {
    const record = requireSubscription(
      externalSubscriptionId
    );

    record.state = state;
    fakeSubscriptionsById.set(
      externalSubscriptionId,
      record
    );

    return toGatewaySubscription(record);
  }

  __reset() {
    fakeCustomers.clear();
    fakeSubscriptionsById.clear();
    fakeCheckoutSessions.clear();
  }
}

export const fakeBillingGateway =
  new FakeBillingGateway();
