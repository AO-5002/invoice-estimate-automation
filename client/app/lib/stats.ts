// Aggregation helpers for the revenue stats panel. Metrics are described as
// StatDef entries (a registry), and the bucketing/aggregation here is generic
// over any StatDef — adding a new metric is a config addition, not new plumbing.

import { parseCurrencyAmount } from "./format";

export type Period = "This Week" | "This Month" | "This Year";

export const PERIODS: Period[] = ["This Week", "This Month", "This Year"];

export type Dataset = "invoices" | "estimates";

export type StatDef<R> = {
  id: string;
  label: string;
  dataset: Dataset;
  filter: (r: R) => boolean;
  value: (r: R) => number;
  date: (r: R) => Date | null;
  chart: "bar"; // room for "donut" | "kpi" later
};

/**
 * Currency string -> number, treating blank/unparseable as 0 so sums never
 * produce NaN.
 */
export function parseAmount(value: unknown): number {
  const n = parseCurrencyAmount(value);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Record date -> local-midnight Date. Handles the API's US M/D/YYYY strings
 * and ISO YYYY-MM-DD. Both are constructed as local dates on purpose:
 * new Date("YYYY-MM-DD") parses as UTC midnight, which shifts the record into
 * the previous day (and the wrong bucket) in timezones behind UTC. Returns
 * null for blank/unparseable input so callers can skip the record.
 */
export function parseRecordDate(value: unknown): Date | null {
  if (value == null) return null;
  const s = String(value).trim();

  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
  }

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  return null;
}

type BucketSpec = {
  start: Date;
  end: Date; // exclusive
  labels: string[];
  indexOf: (d: Date) => number;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function bucketSpecFor(period: Period, now: Date): BucketSpec {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case "This Week": {
      // Monday-start week.
      const sinceMonday = (now.getDay() + 6) % 7;
      const start = new Date(year, month, now.getDate() - sinceMonday);
      const end = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + 7,
      );
      return {
        start,
        end,
        labels: WEEKDAY_LABELS,
        indexOf: (d) => (d.getDay() + 6) % 7,
      };
    }
    case "This Month": {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 1),
        labels: Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
        indexOf: (d) => d.getDate() - 1,
      };
    }
    case "This Year":
      return {
        start: new Date(year, 0, 1),
        end: new Date(year + 1, 0, 1),
        labels: MONTH_LABELS,
        indexOf: (d) => d.getMonth(),
      };
  }
}

export type StatResult = {
  labels: string[];
  buckets: number[];
  total: number;
  /** Number of records that landed in the window (drives the empty state). */
  count: number;
};

/**
 * Filters records to the stat's predicate and the period's window (anchored at
 * `now`), then sums values into the period's natural buckets. Records with an
 * unparseable date are skipped.
 */
export function aggregateStat<R>(
  records: R[],
  stat: StatDef<R>,
  period: Period,
  now: Date = new Date(),
): StatResult {
  const spec = bucketSpecFor(period, now);
  const buckets = new Array<number>(spec.labels.length).fill(0);
  let total = 0;
  let count = 0;

  for (const record of records) {
    if (!stat.filter(record)) continue;
    const date = stat.date(record);
    if (date === null || Number.isNaN(date.getTime())) continue;
    if (date < spec.start || date >= spec.end) continue;

    const index = spec.indexOf(date);
    if (index < 0 || index >= buckets.length) continue;

    const value = stat.value(record);
    buckets[index] += value;
    total += value;
    count += 1;
  }

  return { labels: spec.labels, buckets, total, count };
}
