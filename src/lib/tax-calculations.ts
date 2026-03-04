/**
 * Pure tax/MVA calculation functions.
 * Extracted for testability — these must be 100% correct.
 */

/**
 * Determine the MVA code for a transaction.
 * - SALE → CODE_52 (export, 0% VAT)
 * - EXPENSE with supplier default → use supplier's default
 * - EXPENSE with FOREIGN supplier → CODE_86 (reverse charge, 25%)
 * - EXPENSE with NORWEGIAN supplier → CODE_1 (inngående 25%)
 */
export function determineMvaCode(
  type: string,
  supplierType?: string,
  supplierDefaultMvaCode?: string | null
): string {
  if (type === "SALE") return "CODE_52";
  if (supplierDefaultMvaCode) return supplierDefaultMvaCode;
  if (supplierType === "FOREIGN") return "CODE_86";
  return "CODE_1";
}

/**
 * Calculate amountNOK from original amount and exchange rate.
 */
export function calculateAmountNOK(amount: number, exchangeRate: number): number {
  return amount * exchangeRate;
}

/**
 * MVA calculation for a term period.
 *
 * CODE_52 (Utførsel/Export): 0% VAT — only grunnlag reported
 * CODE_86 (Utland/Foreign):  Reverse charge — 25% MVA declared, then fully deducted (net = 0)
 * CODE_1  (Inngående 25%):   Norwegian purchase amounts INCLUDE VAT
 *                             VAT portion = amount × 20% (because 25/125 = 0.2)
 */
export type MvaInput = {
  mvaCode: string;
  amountNOK: number;
};

export type MvaResult = {
  kode52Grunnlag: number;
  kode86Grunnlag: number;
  kode86Mva: number;
  kode86Fradrag: number;
  kode1MvaFradrag: number;
  totalMva: number;
};

export function calculateMva(transactions: MvaInput[]): MvaResult {
  let kode52Grunnlag = 0;
  let kode86Grunnlag = 0;
  let kode1Total = 0;

  for (const tx of transactions) {
    switch (tx.mvaCode) {
      case "CODE_52":
        kode52Grunnlag += tx.amountNOK;
        break;
      case "CODE_86":
        kode86Grunnlag += tx.amountNOK;
        break;
      case "CODE_1":
        kode1Total += tx.amountNOK;
        break;
    }
  }

  const kode86Mva = kode86Grunnlag * 0.25;
  const kode86Fradrag = kode86Mva === 0 ? 0 : -kode86Mva;
  // Amounts INCLUDE 25% VAT → VAT portion = total × (25/125) = total × 0.2
  const kode1MvaFradrag = kode1Total === 0 ? 0 : -(kode1Total * 0.2);
  const totalMva = kode86Mva + kode86Fradrag + kode1MvaFradrag;

  return {
    kode52Grunnlag,
    kode86Grunnlag,
    kode86Mva,
    kode86Fradrag,
    kode1MvaFradrag,
    totalMva,
  };
}

/**
 * Get the MVA term (1-6) from a date.
 * Term 1 = Jan-Feb, Term 2 = Mar-Apr, ... Term 6 = Nov-Dec
 */
export function getTermFromDate(date: Date): number {
  const month = date.getMonth() + 1;
  return Math.ceil(month / 2);
}

/**
 * Get the term period string (e.g., "2025-3") from a date.
 */
export function getTermPeriod(date: Date): string {
  const year = date.getFullYear();
  const term = getTermFromDate(date);
  return `${year}-${term}`;
}
