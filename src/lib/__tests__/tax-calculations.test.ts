import { describe, it, expect } from "vitest";
import {
  determineMvaCode,
  calculateAmountNOK,
  calculateMva,
  getTermFromDate,
  getTermPeriod,
  type MvaInput,
} from "../tax-calculations";

// ─── determineMvaCode ────────────────────────────────────────────────────────

describe("determineMvaCode", () => {
  it("returns CODE_52 for all sales regardless of supplier", () => {
    expect(determineMvaCode("SALE")).toBe("CODE_52");
    expect(determineMvaCode("SALE", "NORWEGIAN")).toBe("CODE_52");
    expect(determineMvaCode("SALE", "FOREIGN")).toBe("CODE_52");
    expect(determineMvaCode("SALE", "FOREIGN", "CODE_86")).toBe("CODE_52");
  });

  it("returns supplier default MVA code when set", () => {
    expect(determineMvaCode("EXPENSE", "NORWEGIAN", "CODE_11")).toBe("CODE_11");
    expect(determineMvaCode("EXPENSE", "FOREIGN", "CODE_81")).toBe("CODE_81");
    expect(determineMvaCode("EXPENSE", "NORWEGIAN", "CODE_13")).toBe("CODE_13");
  });

  it("returns CODE_86 for foreign expenses without supplier default", () => {
    expect(determineMvaCode("EXPENSE", "FOREIGN")).toBe("CODE_86");
    expect(determineMvaCode("EXPENSE", "FOREIGN", null)).toBe("CODE_86");
    expect(determineMvaCode("EXPENSE", "FOREIGN", undefined)).toBe("CODE_86");
  });

  it("returns CODE_1 for Norwegian expenses without supplier default", () => {
    expect(determineMvaCode("EXPENSE", "NORWEGIAN")).toBe("CODE_1");
    expect(determineMvaCode("EXPENSE", "NORWEGIAN", null)).toBe("CODE_1");
    expect(determineMvaCode("EXPENSE")).toBe("CODE_1");
    expect(determineMvaCode("EXPENSE", undefined)).toBe("CODE_1");
  });
});

// ─── calculateAmountNOK ─────────────────────────────────────────────────────

describe("calculateAmountNOK", () => {
  it("returns same amount for NOK (rate = 1)", () => {
    expect(calculateAmountNOK(1000, 1)).toBe(1000);
  });

  it("converts EUR to NOK correctly", () => {
    // 100 EUR at rate 11.25 = 1125 NOK
    expect(calculateAmountNOK(100, 11.25)).toBe(1125);
  });

  it("converts USD to NOK correctly", () => {
    // 50 USD at rate 10.5 = 525 NOK
    expect(calculateAmountNOK(50, 10.5)).toBe(525);
  });

  it("handles small amounts with precision", () => {
    const result = calculateAmountNOK(0.01, 11.2485);
    expect(result).toBeCloseTo(0.112485, 5);
  });

  it("handles zero amount", () => {
    expect(calculateAmountNOK(0, 11.25)).toBe(0);
  });
});

// ─── calculateMva ────────────────────────────────────────────────────────────

describe("calculateMva", () => {
  describe("CODE_52 - Export sales (0% VAT)", () => {
    it("sums grunnlag but generates no MVA", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_52", amountNOK: 10000 },
        { mvaCode: "CODE_52", amountNOK: 5000 },
      ];
      const result = calculateMva(transactions);

      expect(result.kode52Grunnlag).toBe(15000);
      expect(result.totalMva).toBe(0); // No MVA on exports
    });

    it("reports zero grunnlag with no sales", () => {
      const result = calculateMva([]);
      expect(result.kode52Grunnlag).toBe(0);
    });
  });

  describe("CODE_86 - Foreign purchases (reverse charge)", () => {
    it("calculates 25% MVA and fully deducts it (net = 0)", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_86", amountNOK: 1000 },
      ];
      const result = calculateMva(transactions);

      expect(result.kode86Grunnlag).toBe(1000);
      expect(result.kode86Mva).toBe(250); // 1000 * 0.25
      expect(result.kode86Fradrag).toBe(-250); // Full deduction
      // Net from CODE_86 = 250 + (-250) = 0
      expect(result.kode86Mva + result.kode86Fradrag).toBe(0);
    });

    it("handles multiple foreign purchases", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_86", amountNOK: 500 },  // Stripe fee
        { mvaCode: "CODE_86", amountNOK: 200 },  // PayPal fee
        { mvaCode: "CODE_86", amountNOK: 1300 }, // Software subscription
      ];
      const result = calculateMva(transactions);

      expect(result.kode86Grunnlag).toBe(2000);
      expect(result.kode86Mva).toBe(500);
      expect(result.kode86Fradrag).toBe(-500);
    });
  });

  describe("CODE_1 - Norwegian purchases (25% MVA included)", () => {
    it("calculates 20% deduction (25% VAT = 20% of gross)", () => {
      // 1000 NOK purchase INCLUDES 25% VAT
      // Base = 800, VAT = 200
      // 200 / 1000 = 0.2 → deduction = 1000 * 0.2 = 200
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_1", amountNOK: 1000 },
      ];
      const result = calculateMva(transactions);

      expect(result.kode1MvaFradrag).toBe(-200);
    });

    it("handles multiple Norwegian purchases", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_1", amountNOK: 1250 }, // VAT = 250
        { mvaCode: "CODE_1", amountNOK: 625 },  // VAT = 125
      ];
      const result = calculateMva(transactions);

      expect(result.kode1MvaFradrag).toBe(-375); // -(1875 * 0.2)
    });

    it("the 0.2 factor is correct: 25% VAT on 100 base = 125 total, 25/125 = 0.2", () => {
      // If base price is 100, with 25% VAT the total is 125
      // VAT portion = 125 * 0.2 = 25 ✓
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_1", amountNOK: 125 },
      ];
      const result = calculateMva(transactions);
      expect(result.kode1MvaFradrag).toBe(-25);
    });
  });

  describe("totalMva - combined calculation", () => {
    it("CODE_86 nets to zero, only CODE_1 deduction remains", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_86", amountNOK: 1000 },
        { mvaCode: "CODE_1", amountNOK: 500 },
      ];
      const result = calculateMva(transactions);

      // CODE_86: 250 + (-250) = 0
      // CODE_1: -(500 * 0.2) = -100
      // Total: -100 (money back / "til gode")
      expect(result.totalMva).toBe(-100);
    });

    it("realistic scenario: export business with foreign fees and Norwegian expenses", () => {
      const transactions: MvaInput[] = [
        // Sales (export, 0% VAT)
        { mvaCode: "CODE_52", amountNOK: 50000 },
        { mvaCode: "CODE_52", amountNOK: 30000 },
        // Stripe/PayPal fees (foreign, reverse charge)
        { mvaCode: "CODE_86", amountNOK: 2400 },
        { mvaCode: "CODE_86", amountNOK: 800 },
        // Norwegian purchases (25% VAT included)
        { mvaCode: "CODE_1", amountNOK: 5000 },
        { mvaCode: "CODE_1", amountNOK: 2500 },
      ];
      const result = calculateMva(transactions);

      expect(result.kode52Grunnlag).toBe(80000);

      expect(result.kode86Grunnlag).toBe(3200);
      expect(result.kode86Mva).toBe(800);       // 3200 * 0.25
      expect(result.kode86Fradrag).toBe(-800);

      expect(result.kode1MvaFradrag).toBe(-1500); // -(7500 * 0.2)

      // Total: 800 + (-800) + (-1500) = -1500 (til gode)
      expect(result.totalMva).toBe(-1500);
    });

    it("only sales — no MVA liability", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_52", amountNOK: 100000 },
      ];
      const result = calculateMva(transactions);
      expect(result.totalMva).toBe(0);
    });

    it("empty term — all zeros", () => {
      const result = calculateMva([]);
      expect(result.kode52Grunnlag).toBe(0);
      expect(result.kode86Grunnlag).toBe(0);
      expect(result.kode86Mva).toBe(0);
      expect(result.kode86Fradrag).toBe(0);
      expect(result.kode1MvaFradrag).toBe(0);
      expect(result.totalMva).toBe(0);
    });

    it("handles decimal amounts correctly", () => {
      const transactions: MvaInput[] = [
        { mvaCode: "CODE_52", amountNOK: 1234.56 },
        { mvaCode: "CODE_86", amountNOK: 45.67 },
        { mvaCode: "CODE_1", amountNOK: 99.99 },
      ];
      const result = calculateMva(transactions);

      expect(result.kode52Grunnlag).toBeCloseTo(1234.56);
      expect(result.kode86Grunnlag).toBeCloseTo(45.67);
      expect(result.kode86Mva).toBeCloseTo(11.4175);
      expect(result.kode86Fradrag).toBeCloseTo(-11.4175);
      expect(result.kode1MvaFradrag).toBeCloseTo(-19.998);
      expect(result.totalMva).toBeCloseTo(-19.998);
    });
  });
});

// ─── Term period assignment ──────────────────────────────────────────────────

describe("getTermFromDate", () => {
  it("assigns correct terms for each month", () => {
    expect(getTermFromDate(new Date(2025, 0, 15))).toBe(1);  // Jan
    expect(getTermFromDate(new Date(2025, 1, 15))).toBe(1);  // Feb
    expect(getTermFromDate(new Date(2025, 2, 15))).toBe(2);  // Mar
    expect(getTermFromDate(new Date(2025, 3, 15))).toBe(2);  // Apr
    expect(getTermFromDate(new Date(2025, 4, 15))).toBe(3);  // May
    expect(getTermFromDate(new Date(2025, 5, 15))).toBe(3);  // Jun
    expect(getTermFromDate(new Date(2025, 6, 15))).toBe(4);  // Jul
    expect(getTermFromDate(new Date(2025, 7, 15))).toBe(4);  // Aug
    expect(getTermFromDate(new Date(2025, 8, 15))).toBe(5);  // Sep
    expect(getTermFromDate(new Date(2025, 9, 15))).toBe(5);  // Oct
    expect(getTermFromDate(new Date(2025, 10, 15))).toBe(6); // Nov
    expect(getTermFromDate(new Date(2025, 11, 15))).toBe(6); // Dec
  });

  it("handles first and last day of month", () => {
    expect(getTermFromDate(new Date(2025, 0, 1))).toBe(1);   // Jan 1
    expect(getTermFromDate(new Date(2025, 1, 28))).toBe(1);  // Feb 28
    expect(getTermFromDate(new Date(2025, 11, 31))).toBe(6); // Dec 31
  });
});

describe("getTermPeriod", () => {
  it("returns correct term period strings", () => {
    expect(getTermPeriod(new Date(2025, 0, 15))).toBe("2025-1");
    expect(getTermPeriod(new Date(2025, 5, 30))).toBe("2025-3");
    expect(getTermPeriod(new Date(2026, 11, 31))).toBe("2026-6");
  });
});

// ─── Integration scenarios (end-to-end calculation paths) ────────────────────

describe("integration: full transaction flow", () => {
  it("Stripe sale + fee: correct codes and amounts", () => {
    // Stripe sale: 100 USD, rate 10.5
    const saleCode = determineMvaCode("SALE");
    const saleAmountNOK = calculateAmountNOK(100, 10.5);

    // Stripe fee: 3.20 USD, rate 10.5
    const feeCode = determineMvaCode("EXPENSE", "FOREIGN");
    const feeAmountNOK = calculateAmountNOK(3.2, 10.5);

    expect(saleCode).toBe("CODE_52");
    expect(saleAmountNOK).toBe(1050);
    expect(feeCode).toBe("CODE_86");
    expect(feeAmountNOK).toBeCloseTo(33.6);

    const mva = calculateMva([
      { mvaCode: saleCode, amountNOK: saleAmountNOK },
      { mvaCode: feeCode, amountNOK: feeAmountNOK },
    ]);

    expect(mva.kode52Grunnlag).toBe(1050);
    expect(mva.kode86Grunnlag).toBeCloseTo(33.6);
    // Reverse charge nets to zero
    expect(mva.totalMva).toBe(0);
  });

  it("PayPal sale + fee: correct codes and amounts", () => {
    // PayPal sale: 50 EUR, rate 11.19
    const saleCode = determineMvaCode("SALE");
    const saleAmountNOK = calculateAmountNOK(50, 11.19);

    // PayPal fee: 2.30 EUR, rate 11.19
    const feeCode = determineMvaCode("EXPENSE", "FOREIGN");
    const feeAmountNOK = calculateAmountNOK(2.3, 11.19);

    expect(saleCode).toBe("CODE_52");
    expect(saleAmountNOK).toBeCloseTo(559.5);
    expect(feeCode).toBe("CODE_86");
    expect(feeAmountNOK).toBeCloseTo(25.737);

    const mva = calculateMva([
      { mvaCode: saleCode, amountNOK: saleAmountNOK },
      { mvaCode: feeCode, amountNOK: feeAmountNOK },
    ]);

    // Only export sales + foreign fee → total should be 0
    expect(mva.totalMva).toBe(0);
  });

  it("Norwegian expense from receipt: correct VAT deduction", () => {
    // Receipt: 1250 NOK (includes 25% VAT) from Norwegian supplier
    const code = determineMvaCode("EXPENSE", "NORWEGIAN");
    const amountNOK = calculateAmountNOK(1250, 1);

    expect(code).toBe("CODE_1");
    expect(amountNOK).toBe(1250);

    const mva = calculateMva([{ mvaCode: code, amountNOK }]);

    // 1250 includes 25% VAT → VAT = 1250 * 0.2 = 250
    // Base = 1250 - 250 = 1000, check: 1000 * 1.25 = 1250 ✓
    expect(mva.kode1MvaFradrag).toBe(-250);
    expect(mva.totalMva).toBe(-250); // Get 250 back
  });

  it("mixed term: sales + foreign fees + Norwegian expense", () => {
    const transactions: MvaInput[] = [
      // 3 Stripe sales
      { mvaCode: "CODE_52", amountNOK: calculateAmountNOK(200, 10.5) },  // 2100
      { mvaCode: "CODE_52", amountNOK: calculateAmountNOK(150, 10.5) },  // 1575
      { mvaCode: "CODE_52", amountNOK: calculateAmountNOK(300, 10.5) },  // 3150
      // Stripe fees
      { mvaCode: "CODE_86", amountNOK: calculateAmountNOK(6, 10.5) },    // 63
      { mvaCode: "CODE_86", amountNOK: calculateAmountNOK(4.5, 10.5) },  // 47.25
      { mvaCode: "CODE_86", amountNOK: calculateAmountNOK(9, 10.5) },    // 94.5
      // Norwegian office supplies (1000 NOK incl. 25% VAT)
      { mvaCode: "CODE_1", amountNOK: 1000 },
    ];

    const result = calculateMva(transactions);

    expect(result.kode52Grunnlag).toBeCloseTo(6825);
    expect(result.kode86Grunnlag).toBeCloseTo(204.75);
    expect(result.kode86Mva).toBeCloseTo(51.1875);
    expect(result.kode86Fradrag).toBeCloseTo(-51.1875);
    expect(result.kode1MvaFradrag).toBe(-200); // 1000 * 0.2
    // Total: 51.1875 + (-51.1875) + (-200) = -200
    expect(result.totalMva).toBeCloseTo(-200);
  });
});
