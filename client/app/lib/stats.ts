// Aggregation helpers for the revenue stats panel. Metrics are described as
// StatDef entries (a registry), and the bucketing/aggregation here is generic
// over any StatDef — adding a new metric is a config addition, not new plumbing.

import { parseCurrencyAmount } from "./format";

export type Period = "This Week" | "This Month" | "This Year" | "All Time";

export const PERIODS: Period[] = [
  "This Week",
  "This Month",
  "This Year",
  "All Time",
];

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
 *
 * A four-digit year below MIN_PLAUSIBLE_YEAR is rejected as a data-entry typo:
 * a real sheet value like "7/28/0204" (meant 2024) would otherwise parse to
 * year 204 and, as the earliest record, stretch the "All Time" axis across
 * ~1800 empty year bars.
 */
const MIN_PLAUSIBLE_YEAR = 1900;

export function parseRecordDate(value: unknown): Date | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === "") return null;

  // ISO YYYY-MM-DD, optionally followed by "T…" / whitespace + a time.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/);
  if (iso) {
    return makeLocalDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // US M/D/YYYY (single- or double-digit month/day).
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    return makeLocalDate(Number(us[3]), Number(us[1]), Number(us[2]));
  }

  return null;
}

/** Local-midnight Date from 1-based month, rejecting implausible years. */
function makeLocalDate(year: number, month: number, day: number): Date | null {
  if (year < MIN_PLAUSIBLE_YEAR) return null;
  return new Date(year, month - 1, day);
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

/**
 * Earliest date across the records, read through the stat's own date extractor
 * (so it shares the local-midnight basis used for bucketing). Ignores the stat's
 * filter deliberately: the "All Time" axis spans the whole dataset, so a metric
 * that currently matches no early records still lines up year-for-year with its
 * sibling metrics instead of starting at a different year. Returns null when no
 * record has a parseable date.
 */
function minRecordDate<R>(records: R[], stat: StatDef<R>): Date | null {
  let min: Date | null = null;
  for (const record of records) {
    const date = stat.date(record);
    if (date === null || Number.isNaN(date.getTime())) continue;
    if (min === null || date < min) min = date;
  }
  return min;
}

/**
 * @param minDate earliest record date, used only by "All Time" to know which
 *   year the axis starts at (bucketing is otherwise records-independent). Null
 *   when the dataset is empty, in which case "All Time" collapses to the current
 *   year alone.
 */
function bucketSpecFor(
  period: Period,
  now: Date,
  minDate: Date | null = null,
): BucketSpec {
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
    case "All Time": {
      // One bar per calendar year, from the earliest record's year through the
      // current year. With no records (minDate null) or records only in the
      // current year, startYear === year and the axis is a single bar.
      const startYear = minDate ? minDate.getFullYear() : year;
      const span = year - startYear + 1;
      return {
        start: new Date(startYear, 0, 1),
        end: new Date(year + 1, 0, 1),
        labels: Array.from({ length: span }, (_, i) => String(startYear + i)),
        indexOf: (d) => d.getFullYear() - startYear,
      };
    }
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
  // "All Time" needs the dataset's earliest year to size its axis; the other
  // periods are anchored purely at `now`, so skip the scan for them.
  const minDate = period === "All Time" ? minRecordDate(records, stat) : null;
  const spec = bucketSpecFor(period, now, minDate);
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
