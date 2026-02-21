"use client";

const LEGEND_ITEMS = [
  { color: "#FF8C00", label: "Missing Data" },
  { color: "#00CC66", label: "Enriched" },
  { color: "#FF3333", label: "Duplicate" },
  { color: "#3399FF", label: "Personal Email" },
  { color: "#AA44FF", label: "Business Email" },
];

export function ColorLegend() {
  return (
    <div className="flex items-center gap-4 py-2 px-1">
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[11px] text-zinc-400">{label}</span>
        </div>
      ))}
    </div>
  );
}
