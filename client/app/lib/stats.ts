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
 * Record date -> local-midnight Date. Handles ISO YYYY-MM-DD (with or without a
 * trailing time component, which is ignored) and the API's US M/D/YYYY strings.
 *
 * Dates are always constructed LOCALLY (never `new Date("YYYY-MM-DD")`, which
 * parses as UTC midnight). This is load-bearing: the window boundaries in
 * bucketSpecFor are local, so records must share that basis. A UTC-parsed date
 * shifts back a day in timezones behind UTC, pushing a record just outside a
 * narrow week/month window — a mismatch a full-year window silently hides.
 *
 * Only the date portion is read even when a time is present, so a record that
 * arrives as "2026-07-12T00:00:00Z" still lands on the correct local day (and in
 * the current week/month bucket) instead of being dropped. Returns null for
 * blank/unrecognized input so callers can skip the record.
 */
export function parseRecordDate(value: unknown): Date | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === "") return null;

  // ISO YYYY-MM-DD, optionally followed by "T…" / whitespace + a time.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  // US M/D/YYYY (single- or double-digit month/day).
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
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
