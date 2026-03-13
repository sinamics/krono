/**
 * Returns the next scheduled auto sync date.
 * Stripe runs 1st of every month at 02:00 UTC.
 * PayPal runs 1st of every month at 03:00 UTC.
 */
export function getNextAutoSync(provider: "stripe" | "paypal"): Date {
  const hour = provider === "stripe" ? 2 : 3;
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, hour, 0, 0));
  return next;
}
