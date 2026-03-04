import { db } from "@/lib/db";

export const AUDITED_FIELDS = [
  "date",
  "description",
  "amount",
  "currency",
  "exchangeRate",
  "amountNOK",
  "type",
  "mvaCode",
  "supplierId",
  "category",
  "receiptUrl",
  "isRecurring",
  "recurringDay",
  "notes",
  "termPeriod",
] as const;

type AuditInput = {
  transactionId: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  changes: Record<string, { from: unknown; to: unknown }>;
};

export async function logAudit(input: AuditInput) {
  await db.auditLog.create({
    data: {
      transactionId: input.transactionId,
      userId: input.userId,
      action: input.action,
      changes: JSON.stringify(input.changes),
    },
  });
}

export function diffTransaction(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[]
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of fields) {
    const fromVal = before[field];
    const toVal = after[field];

    // Compare dates by ISO string
    const fromStr = fromVal instanceof Date ? fromVal.toISOString() : fromVal;
    const toStr = toVal instanceof Date ? toVal.toISOString() : toVal;

    if (fromStr !== toStr) {
      changes[field] = { from: fromVal, to: toVal };
    }
  }

  return changes;
}
