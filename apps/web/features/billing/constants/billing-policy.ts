/**
 * SaaS recurring-card billing policy (PAY-001). These are the only knobs
 * that decide trial length, payment-retry tolerance and dunning behavior —
 * intentionally not hidden inside UI copy or a component, so the numbers
 * can be audited and changed in one place. Overridable via env for staging
 * experiments; defaults are the documented production policy.
 */

function readIntEnv(
  name: string,
  fallback: number
) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : fallback;
}

export const BILLING_POLICY = {
  /** Length of the single automatic trial granted on provisioning. */
  trialDays: readIntEnv(
    "BILLING_TRIAL_DAYS",
    30
  ),
  /**
   * Days after a payment failure during which the subscription stays
   * PAST_DUE (still operating) before access is restricted (SUSPENDED).
   */
  paymentRetryToleranceDays: readIntEnv(
    "BILLING_RETRY_TOLERANCE_DAYS",
    7
  ),
  /**
   * Maximum number of retry attempts the gateway/webhook flow will honor
   * before giving up and leaving the subscription PAST_DUE until the
   * tolerance window above also expires.
   */
  maxPaymentRetryAttempts: readIntEnv(
    "BILLING_MAX_RETRY_ATTEMPTS",
    3
  ),
} as const;
