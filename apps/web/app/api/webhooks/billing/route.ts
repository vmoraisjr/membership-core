import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";
import {
  recordFailedGatewayPayment,
  recordSuccessfulGatewayPayment,
  syncClinicSubscriptionFromGateway,
} from "@/features/billing/services/billing-foundation";

const SIGNATURE_HEADER =
  "x-billing-webhook-signature";

/**
 * Gateway webhook endpoint (PAY-003). Every response is fast and every
 * write is idempotent against re-delivery:
 *   1. Signature verified against the *raw* body before anything else —
 *      an invalid or missing signature is rejected immediately, nothing
 *      is read from the body, nothing is logged beyond "rejected".
 *   2. `externalEventId` is the idempotency key — a `BillingWebhookEvent`
 *      row with `processedAt` already set means this exact delivery (or
 *      a replay of it) was already applied; we ack without reprocessing.
 *   3. An event for an externalSubscriptionId we don't recognize is
 *      recorded (for observability) but never processed — it can't
 *      change any tenant's data.
 */
export async function POST(
  request: NextRequest
) {
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get(
      SIGNATURE_HEADER
    );

  const gateway = getBillingGateway();
  let event;

  try {
    event =
      gateway.verifyWebhookSignature({
        rawBody,
        signatureHeader,
      });
  } catch {
    logger.warn(
      "billing webhook rejected: invalid signature"
    );
    return NextResponse.json(
      { ok: false },
      { status: 400 }
    );
  }

  const existing =
    await prisma.billingWebhookEvent.findUnique(
      {
        where: {
          externalEventId:
            event.externalEventId,
        },
      }
    );

  if (existing?.processedAt) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
    });
  }

  const subscription =
    event.externalSubscriptionId
      ? await prisma.clinicSubscription.findUnique(
          {
            where: {
              externalSubscriptionId:
                event.externalSubscriptionId,
            },
          }
        )
      : null;

  const eventRecord =
    await prisma.billingWebhookEvent.upsert(
      {
        where: {
          externalEventId:
            event.externalEventId,
        },
        create: {
          externalEventId:
            event.externalEventId,
          type: event.type,
          clinicId:
            subscription?.clinicId ??
            null,
          externalSubscriptionId:
            event.externalSubscriptionId,
        },
        update: {},
      }
    );

  if (!subscription) {
    await prisma.billingWebhookEvent.update(
      {
        where: {
          id: eventRecord.id,
        },
        data: {
          processedAt: new Date(),
          error:
            "unknown_subscription",
        },
      }
    );

    return NextResponse.json({
      ok: true,
      unknown: true,
    });
  }

  try {
    switch (event.type) {
      case "invoice.paid":
      case "payment.succeeded": {
        const live =
          await gateway.getSubscription(
            event.externalSubscriptionId!
          );

        if (live) {
          await recordSuccessfulGatewayPayment(
            subscription.id,
            live
          );
        }

        break;
      }

      case "invoice.payment_failed":
      case "payment.failed": {
        await recordFailedGatewayPayment(
          subscription.id
        );
        break;
      }

      case "subscription.paused":
      case "subscription.resumed":
      case "subscription.canceled":
      case "customer.updated": {
        const live =
          await gateway.getSubscription(
            event.externalSubscriptionId!
          );

        if (live) {
          await syncClinicSubscriptionFromGateway(
            subscription.id,
            live
          );
        }

        break;
      }

      default:
        break;
    }

    await prisma.billingWebhookEvent.update(
      {
        where: {
          id: eventRecord.id,
        },
        data: {
          processedAt: new Date(),
        },
      }
    );
  } catch (error) {
    await prisma.billingWebhookEvent.update(
      {
        where: {
          id: eventRecord.id,
        },
        data: {
          error:
            error instanceof Error
              ? error.message
              : "unknown_error",
        },
      }
    );

    return NextResponse.json(
      { ok: false },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
