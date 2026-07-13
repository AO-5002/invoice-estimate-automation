"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useInvoices, type InvoiceRecord } from "../hooks/useInvoices";
import { useEstimates, type EstimateRecord } from "../hooks/useEstimates";
import { formatCurrency } from "../lib/format";
import {
  PERIODS,
  aggregateStat,
  parseAmount,
  parseRecordDate,
  type Dataset,
  type Period,
  type StatDef,
  type StatResult,
} from "../lib/stats";

// ---------------------------------------------------------------------------
// Stat registry — add new metrics here; bucketing/aggregation and the render
// logic below are generic over StatDef, so entries are pure config.
// ---------------------------------------------------------------------------

const isPaid = (r: InvoiceRecord) =>
  (r.paymentStatus ?? "").trim().toUpperCase() === "PAID";

const invoiceAmount = (r: InvoiceRecord) => parseAmount(r.costToClient);
// There is no paid-date field on invoices, so paid revenue is bucketed by
// invoiceDate (when it was billed), not when payment arrived.
const invoiceDate = (r: InvoiceRecord) => parseRecordDate(r.invoiceDate);

const INVOICE_STATS: StatDef<InvoiceRecord>[] = [
  {
    id: "paid-revenue",
    label: "Paid revenue",
    dataset: "invoices",
    filter: isPaid,
    value: invoiceAmount,
    date: invoiceDate,
    chart: "bar",
  },
  {
    id: "outstanding-revenue",
    label: "Outstanding revenue",
    dataset: "invoices",
    filter: (r) => !isPaid(r),
    value: invoiceAmount,
    date: invoiceDate,
    chart: "bar",
  },
];

const ESTIMATE_STATS: StatDef<EstimateRecord>[] = [
  {
    id: "estimate-value",
    label: "Estimate value",
    dataset: "estimates",
    filter: () => true,
    value: (r) => parseAmount(r.costToClient),
    date: (r) => parseRecordDate(r.estimateDate),
    chart: "bar",
  },
];

const DATASET_LABELS: Record<Dataset, string> = {
  invoices: "Invoices",
  estimates: "Estimates",
};

const METRIC_OPTIONS: Record<Dataset, { id: string; label: string }[]> = {
  invoices: INVOICE_STATS.map(({ id, label }) => ({ id, label })),
  estimates: ESTIMATE_STATS.map(({ id, label }) => ({ id, label })),
};

// ---------------------------------------------------------------------------
// Chart geometry
// ---------------------------------------------------------------------------

const CHART_WIDTH = 900;
const CHART_HEIGHT = 160;
const BAR_COLOR = "#7987FF";

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Rounds a positive value up to a "nice" axis maximum (1/2/2.5/5 × 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(value));
  const fraction = value / pow;
  const step =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return step * pow;
}

/** Bar with rounded top corners only — the baseline end stays square. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, width / 2, height);
  const bottom = y + height;
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${bottom}`,
    "Z",
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Dropdown (matches the app's existing header-dropdown styling)
// ---------------------------------------------------------------------------

function Dropdown({
  label,
  open,
  onToggle,
  options,
  onSelect,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[12px] leading-[16px] text-white"
      >
        {label}
        <ChevronDown className="size-4 text-white" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 rounded-md border border-[#313131] bg-[#232323] py-1">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="block w-full px-4 py-1.5 text-left text-[12px] text-white hover:bg-[#2a2a2a] whitespace-nowrap"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Menu = "dataset" | "metric" | "period";

export default function RevenueStats({ title = "Revenue" }: { title?: string }) {
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { estimates, isLoading: estimatesLoading } = useEstimates();

  const [dataset, setDataset] = useState<Dataset>("invoices");
  const [statId, setStatId] = useState(INVOICE_STATS[0].id);
  const [period, setPeriod] = useState<Period>("This Week");
  const [openMenu, setOpenMenu] = useState<Menu | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (openMenu === null) return;
    const close = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  const isLoading = dataset === "invoices" ? invoicesLoading : estimatesLoading;

  const activeMetric =
    METRIC_OPTIONS[dataset].find((m) => m.id === statId) ??
    METRIC_OPTIONS[dataset][0];

  const result: StatResult = useMemo(() => {
    if (dataset === "invoices") {
      const stat = INVOICE_STATS.find((s) => s.id === statId) ?? INVOICE_STATS[0];
      return aggregateStat(invoices, stat, period);
    }
    const stat = ESTIMATE_STATS.find((s) => s.id === statId) ?? ESTIMATE_STATS[0];
    return aggregateStat(estimates, stat, period);
  }, [dataset, statId, period, invoices, estimates]);

  const isEmpty = !isLoading && result.count === 0;

  const axisMax = niceMax(Math.max(...result.buckets));
  const yTicks = [axisMax, axisMax / 2, 0];

  const slotWidth = CHART_WIDTH / result.buckets.length;
  const barWidth = Math.min(slotWidth * 0.6, 48);
  // Months have up to 31 daily bars — label every 7th day to avoid collisions.
  const showXLabel = (i: number) =>
    period !== "This Month" || i % 7 === 0 || i === result.labels.length - 1;

  const toggleMenu = (menu: Menu) =>
    setOpenMenu((current) => (current === menu ? null : menu));

  return (
    <div className="w-full" ref={containerRef}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-[17px] font-semibold leading-[22px] tracking-[-0.43px] text-white">
          {title}
        </h2>
        <div className="flex items-center gap-4">
          <Dropdown
            label={DATASET_LABELS[dataset]}
            open={openMenu === "dataset"}
            onToggle={() => toggleMenu("dataset")}
            options={(Object.keys(DATASET_LABELS) as Dataset[]).map((d) => ({
              id: d,
              label: DATASET_LABELS[d],
            }))}
            onSelect={(id) => {
              const next = id as Dataset;
              setDataset(next);
              setStatId(METRIC_OPTIONS[next][0].id);
              setOpenMenu(null);
            }}
          />
          <Dropdown
            label={activeMetric.label}
            open={openMenu === "metric"}
            onToggle={() => toggleMenu("metric")}
            options={METRIC_OPTIONS[dataset]}
            onSelect={(id) => {
              setStatId(id);
              setOpenMenu(null);
            }}
          />
          <Dropdown
            label={period}
            open={openMenu === "period"}
            onToggle={() => toggleMenu("period")}
            options={PERIODS.map((p) => ({ id: p, label: p }))}
            onSelect={(id) => {
              setPeriod(id as Period);
              setOpenMenu(null);
            }}
          />
        </div>
      </div>

      <div className="mt-2">
        <p className="text-[28px] font-semibold leading-[34px] tracking-[-0.5px] text-white">
          {isLoading ? "—" : formatCurrency(result.total)}
        </p>
        <p className="text-[12px] leading-[16px] text-white/50">
          {activeMetric.label} · {period.toLowerCase()}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex flex-col justify-between text-[12px] text-white/60 shrink-0 w-12 text-right">
          {yTicks.map((tick) => (
            <span key={tick}>{compactCurrency.format(tick)}</span>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="w-full"
              preserveAspectRatio="none"
            >
              {yTicks.map((tick) => {
                const y = CHART_HEIGHT - (tick / axisMax) * CHART_HEIGHT;
                return (
                  <line
                    key={tick}
                    x1={0}
                    y1={y}
                    x2={CHART_WIDTH}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                );
              })}

              {result.buckets.map((value, i) => {
                const height = (value / axisMax) * CHART_HEIGHT;
                const x = i * slotWidth + (slotWidth - barWidth) / 2;
                return (
                  <g key={i} className="group">
                    <title>{`${result.labels[i]}: ${formatCurrency(value)}`}</title>
                    {/* Full-column hit target so the tooltip works on short bars. */}
                    <rect
                      x={i * slotWidth}
                      y={0}
                      width={slotWidth}
                      height={CHART_HEIGHT}
                      fill="transparent"
                    />
                    {value > 0 && (
                      <path
                        d={barPath(x, CHART_HEIGHT - height, barWidth, height)}
                        fill={BAR_COLOR}
                        className="transition-opacity group-hover:opacity-75"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {(isLoading || isEmpty) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[12px] text-white/40">
                  {isLoading
                    ? "Loading…"
                    : `No ${DATASET_LABELS[dataset].toLowerCase()} in this period`}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-1">
            {result.labels.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="text-[10px] text-white/60 text-center flex-1"
              >
                {showXLabel(i) ? label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
