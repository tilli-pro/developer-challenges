import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeTotals } from "../src/services/totals";

describe("computeTotals", () => {
  it("returns zero for an invoice with no lines", () => {
    assert.deepEqual(computeTotals([]), {
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it("applies each line's tax rate to that line", () => {
    const totals = computeTotals([
      { quantity: 2, unitPriceCents: 5_000, taxRateBps: 2_000 }, // 100.00 + 20.00
      { quantity: 1, unitPriceCents: 3_000, taxRateBps: 500 }, //    30.00 +  1.50
      { quantity: 3, unitPriceCents: 1_000, taxRateBps: 0 }, //      30.00 +  0.00
    ]);
    assert.deepEqual(totals, {
      subtotalCents: 16_000,
      taxCents: 2_150,
      totalCents: 18_150,
    });
  });

  it("rounds fractional tax to the nearest cent", () => {
    // 7.5% of 0.10 is 0.0075, i.e. 0.75 cents, which rounds to 1 cent.
    const totals = computeTotals([
      { quantity: 1, unitPriceCents: 10, taxRateBps: 750 },
    ]);
    assert.deepEqual(totals, {
      subtotalCents: 10,
      taxCents: 1,
      totalCents: 11,
    });
  });
});
