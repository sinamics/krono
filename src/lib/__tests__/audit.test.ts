import { describe, it, expect } from "vitest";
import { diffTransaction, AUDITED_FIELDS } from "../audit";

describe("diffTransaction", () => {
  it("returns empty object when no fields changed", () => {
    const obj = { description: "Test", amount: 100, currency: "NOK" };
    const result = diffTransaction(obj, { ...obj }, AUDITED_FIELDS);
    expect(result).toEqual({});
  });

  it("detects changed string field", () => {
    const before = { description: "Old", amount: 100 };
    const after = { description: "New", amount: 100 };
    const result = diffTransaction(before, after, ["description", "amount"]);
    expect(result).toEqual({
      description: { from: "Old", to: "New" },
    });
  });

  it("detects changed number field", () => {
    const before = { amount: 100, description: "Test" };
    const after = { amount: 200, description: "Test" };
    const result = diffTransaction(before, after, ["amount", "description"]);
    expect(result).toEqual({
      amount: { from: 100, to: 200 },
    });
  });

  it("detects multiple changed fields", () => {
    const before = { description: "Old", amount: 100, currency: "NOK" };
    const after = { description: "New", amount: 200, currency: "EUR" };
    const result = diffTransaction(before, after, ["description", "amount", "currency"]);
    expect(result).toEqual({
      description: { from: "Old", to: "New" },
      amount: { from: 100, to: 200 },
      currency: { from: "NOK", to: "EUR" },
    });
  });

  it("handles null to value change", () => {
    const before = { category: null };
    const after = { category: "Kontor" };
    const result = diffTransaction(before, after, ["category"]);
    expect(result).toEqual({
      category: { from: null, to: "Kontor" },
    });
  });

  it("handles value to null change", () => {
    const before = { category: "Kontor" };
    const after = { category: null };
    const result = diffTransaction(before, after, ["category"]);
    expect(result).toEqual({
      category: { from: "Kontor", to: null },
    });
  });

  it("compares dates by ISO string", () => {
    const date1 = new Date("2025-01-15T00:00:00.000Z");
    const date2 = new Date("2025-01-15T00:00:00.000Z");
    const before = { date: date1 };
    const after = { date: date2 };
    const result = diffTransaction(before, after, ["date"]);
    expect(result).toEqual({});
  });

  it("detects changed dates", () => {
    const date1 = new Date("2025-01-15T00:00:00.000Z");
    const date2 = new Date("2025-02-20T00:00:00.000Z");
    const before = { date: date1 };
    const after = { date: date2 };
    const result = diffTransaction(before, after, ["date"]);
    expect(result).toEqual({
      date: { from: date1, to: date2 },
    });
  });

  it("only compares specified fields", () => {
    const before = { description: "Old", amount: 100, notes: "A" };
    const after = { description: "New", amount: 200, notes: "B" };
    const result = diffTransaction(before, after, ["description"]);
    expect(result).toEqual({
      description: { from: "Old", to: "New" },
    });
  });

  it("handles boolean fields", () => {
    const before = { isRecurring: false };
    const after = { isRecurring: true };
    const result = diffTransaction(before, after, ["isRecurring"]);
    expect(result).toEqual({
      isRecurring: { from: false, to: true },
    });
  });

  it("AUDITED_FIELDS contains expected fields", () => {
    expect(AUDITED_FIELDS).toContain("description");
    expect(AUDITED_FIELDS).toContain("amount");
    expect(AUDITED_FIELDS).toContain("currency");
    expect(AUDITED_FIELDS).toContain("mvaCode");
    expect(AUDITED_FIELDS).toContain("type");
    expect(AUDITED_FIELDS).toContain("category");
    expect(AUDITED_FIELDS).toContain("notes");
    expect(AUDITED_FIELDS).toContain("supplierId");
    expect(AUDITED_FIELDS).toContain("termPeriod");
  });
});
