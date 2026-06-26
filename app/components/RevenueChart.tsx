"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const periods = ["This Week", "This Month", "This Year"] as const;

const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"];

const series = [
  {
    label: "Income",
    color: "#7987FF",
    data: [10, 40, 35, 15, 20, -5, -10, 5, 25, 30, 20, -10, -25, -20, -15, -5, -10, -15, 10, 20, 15, 10, 25, 20],
  },
  {
    label: "Expenses",
    color: "#E697FF",
    data: [5, 15, 10, 0, -5, -10, -5, 5, 10, 15, 25, 20, 25, 30, 20, 15, -5, -10, 10, 20, 25, 20, 15, 25],
  },
  {
    label: "Profit",
    color: "#FFA5CB",
    data: [20, 30, 10, 5, 15, 20, -5, -10, 0, 5, -5, -10, -15, -25, -30, -20, 5, -5, 15, 25, 20, 15, 55, 60],
  },
];

const chartWidth = 900;
const chartHeight = 160;
const yMin = -60;
const yMax = 60;

function dataToPath(data: number[]): string {
  const stepX = chartWidth / (data.length - 1);
  return data
    .map((val, i) => {
      const x = i * stepX;
      const y = chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function RevenueChart({ title = "Revenue" }: { title?: string }) {
  const [period, setPeriod] = useState<(typeof periods)[number]>("This Week");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const yTicks = [60, 20, -20, -60];
  const gridLines = yTicks.map(
    (val) => chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-[17px] font-semibold leading-[22px] tracking-[-0.43px] text-white">
          {title}
        </h2>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 text-[12px] leading-[16px] text-white"
          >
            {period}
            <ChevronDown className="size-4 text-white" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 rounded-md border border-[#313131] bg-[#232323] py-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setDropdownOpen(false);
                  }}
                  className="block w-full px-4 py-1.5 text-left text-[12px] text-white hover:bg-[#2a2a2a] whitespace-nowrap"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex flex-col justify-between text-[12px] text-white shrink-0 w-8 text-right">
          {yTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full"
            preserveAspectRatio="none"
          >
            {gridLines.map((y, i) => (
              <line
                key={i}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {months.map((_, i) => {
              const x = (i / (months.length - 1)) * chartWidth;
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartHeight}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}

            {series.map((s) => (
              <path
                key={s.label}
                d={dataToPath(s.data)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
              />
            ))}

            {series.map((s) =>
              s.data.map((val, i) => {
                const stepX = chartWidth / (s.data.length - 1);
                const cx = i * stepX;
                const cy =
                  chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight;
                return (
                  <circle
                    key={`${s.label}-${i}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#1e1e1e"
                    stroke={s.color}
                    strokeWidth={1.5}
                  />
                );
              })
            )}
          </svg>

          <div className="flex justify-between mt-1">
            {months.map((m) => (
              <span
                key={m}
                className="text-[10px] text-white text-center flex-1"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6 pt-4">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <span
              className="size-2 rounded-full inline-block"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[12px] text-white font-medium">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
