// Shared display/sort helpers for the dashboard tables. The Sheets-backed API
// returns money as currency strings ("$1,250.00") and dates as US M/D/YYYY
// strings, so raw parseFloat/localeCompare don't work — these normalize first.

/**
 * Strips currency symbols, thousands separators, and whitespace before parsing.
 * Returns NaN for empty or non-numeric values. e.g. "$1,250.00" -> 1250.
 */
export function parseCurrencyAmount(value: unknown): number {
  if (value == null) return NaN;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  if (cleaned === "") return NaN;
  return parseFloat(cleaned);
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Formats a (possibly currency-string) value as "$X,XXX.XX" with thousands
 * separators and two decimals, or "—" when blank/non-numeric.
 */
export function formatCurrency(value: unknown): string {
  const n = parseCurrencyAmount(value);
  return Number.isNaN(n) ? "—" : currencyFormatter.format(n);
}

/**
 * Parses a US M/D/YYYY date (single- or double-digit month/day) to a timestamp,
 * falling back to ISO parsing. Returns NaN for blank or unparseable input.
 */
export function parseDateMs(value: unknown): number {
  if (value == null) return NaN;
  const s = String(value).trim();
  if (s === "") return NaN;

  const usDate = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDate) {
    const month = Number(usDate[1]);
    const day = Number(usDate[2]);
    const year = Number(usDate[3]);
    return new Date(year, month - 1, day).getTime();
  }

  return Date.parse(s);
}

/**
 * Compares two date values chronologically for the given sort direction, always
 * sorting blank/unparseable dates last regardless of direction (so blanks never
 * jump to the top when toggling asc/desc).
 */
export function compareDates(
  a: unknown,
  b: unknown,
  direction: "asc" | "desc",
): number {
  const ta = parseDateMs(a);
  const tb = parseDateMs(b);
  const aBlank = Number.isNaN(ta);
  const bBlank = Number.isNaN(tb);
  if (aBlank && bBlank) return 0;
  if (aBlank) return 1;
  if (bBlank) return -1;
  const cmp = ta - tb;
  return direction === "asc" ? cmp : -cmp;
}
