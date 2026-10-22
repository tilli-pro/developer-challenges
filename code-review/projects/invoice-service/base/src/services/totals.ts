import { BPS_DENOMINATOR, multiplyCents, sumCents } from "../lib/money";
import type { Line } from "../schemas";

export type Totals = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

type PricedLine = Pick<Line, "quantity" | "unitPriceCents" | "taxRateBps">;

/**
 * Tax is rounded per line, then summed. Rounding once on the invoice total
 * instead would disagree with the per-line figures printed on the invoice.
 */
export function computeTotals(lines: readonly PricedLine[]): Totals {
  const subtotals: number[] = [];
  const taxes: number[] = [];

  for (const line of lines) {
    const lineSubtotal = multiplyCents(line.unitPriceCents, line.quantity);
    subtotals.push(lineSubtotal);
    taxes.push(Math.round((lineSubtotal * line.taxRateBps) / BPS_DENOMINATOR));
  }

  const subtotalCents = sumCents(subtotals);
  const taxCents = sumCents(taxes);
  return {
    subtotalCents,
    taxCents,
    totalCents: sumCents([subtotalCents, taxCents]),
  };
}
