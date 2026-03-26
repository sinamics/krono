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
 * CODE_52 (Utførsel/Export):  0% VAT — only grunnlag reported
 * CODE_86 (Utland/Foreign):   Reverse charge 25% — declared then fully deducted (net = 0)
 * CODE_81 (Import varer):     Reverse charge 25% — declared then fully deducted (net = 0)
 * CODE_1  (Inngående 25%):    Amounts INCLUDE 25% VAT → VAT = amount × 20% (25/125)
 * CODE_11 (Inngående 15%):    Amounts INCLUDE 15% VAT → VAT = amount × (15/115)
 * CODE_13 (Inngående 12%):    Amounts INCLUDE 12% VAT → VAT = amount × (12/112)
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
  kode81Grunnlag: number;
  kode81Mva: number;
  kode81Fradrag: number;
  kode1MvaFradrag: number;
  kode11MvaFradrag: number;
  kode13MvaFradrag: number;
  totalMva: number;
};

export function calculateMva(transactions: MvaInput[]): MvaResult {
  let kode52Grunnlag = 0;
  let kode86Grunnlag = 0;
  let kode81Grunnlag = 0;
  let kode1Total = 0;
  let kode11Total = 0;
  let kode13Total = 0;

  for (const tx of transactions) {
    switch (tx.mvaCode) {
      case "CODE_52":
        kode52Grunnlag += tx.amountNOK;
        break;
      case "CODE_86":
        kode86Grunnlag += tx.amountNOK;
        break;
      case "CODE_81":
        kode81Grunnlag += tx.amountNOK;
        break;
      case "CODE_1":
        kode1Total += tx.amountNOK;
        break;
      case "CODE_11":
        kode11Total += tx.amountNOK;
        break;
      case "CODE_13":
        kode13Total += tx.amountNOK;
        break;
    }
  }

  const kode86Mva = kode86Grunnlag * 0.25;
  const kode86Fradrag = kode86Mva === 0 ? 0 : -kode86Mva;
  const kode81Mva = kode81Grunnlag * 0.25;
  const kode81Fradrag = kode81Mva === 0 ? 0 : -kode81Mva;
  // Amounts INCLUDE VAT → VAT portion = total × (rate / (100 + rate))
  const kode1MvaFradrag = kode1Total === 0 ? 0 : -(kode1Total * (25 / 125));
  const kode11MvaFradrag = kode11Total === 0 ? 0 : -(kode11Total * (15 / 115));
  const kode13MvaFradrag = kode13Total === 0 ? 0 : -(kode13Total * (12 / 112));
  const totalMva =
    kode86Mva + kode86Fradrag +
    kode81Mva + kode81Fradrag +
    kode1MvaFradrag + kode11MvaFradrag + kode13MvaFradrag;

  return {
    kode52Grunnlag,
    kode86Grunnlag,
    kode86Mva,
    kode86Fradrag,
    kode81Grunnlag,
    kode81Mva,
    kode81Fradrag,
    kode1MvaFradrag,
    kode11MvaFradrag,
    kode13MvaFradrag,
    totalMva,
  };
}

/**
 * Get the MVA amount for a single transaction.
 * Returns the VAT portion of the amount.
 */
export function getMvaForTransaction(amountNOK: number, mvaCode: string): number {
  switch (mvaCode) {
    // Inkl. MVA codes — VAT is embedded in the amount
    case "CODE_1": return amountNOK * (25 / 125);
    case "CODE_11": return amountNOK * (15 / 115);
    case "CODE_13": return amountNOK * (12 / 112);
    // Reverse charge — VAT is on top of the amount
    case "CODE_86": return amountNOK * 0.25;
    case "CODE_81": return amountNOK * 0.25;
    // No VAT
    default: return 0;
  }
}

/**
 * Get the eks. MVA (net cost) for a single transaction.
 */
export function getEksMvaForTransaction(amountNOK: number, mvaCode: string): number {
  switch (mvaCode) {
    // Inkl. MVA codes — subtract the embedded VAT
    case "CODE_1": return amountNOK * (100 / 125);
    case "CODE_11": return amountNOK * (100 / 115);
    case "CODE_13": return amountNOK * (100 / 112);
    // Reverse charge — amount IS already eks. MVA
    case "CODE_86": return amountNOK;
    case "CODE_81": return amountNOK;
    // No VAT — amount is the net cost
    default: return amountNOK;
  }
}

/**
 * Whether the amountNOK for this mvaCode includes VAT.
 */
export function isAmountInklMva(mvaCode: string): boolean {
  return mvaCode === "CODE_1" || mvaCode === "CODE_11" || mvaCode === "CODE_13";
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
