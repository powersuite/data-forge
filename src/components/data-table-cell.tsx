"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CellFlag } from "@/types";

interface DataTableCellProps {
  value: string;
  flag?: CellFlag;
  isDuplicate: boolean;
  onSave: (value: string) => void;
}

// Exact brand colors at 25% opacity for cell backgrounds
// Using inline styles since Tailwind can't do arbitrary hex + opacity
const FLAG_COLORS: Record<CellFlag, { bg: string; border: string }> = {
  missing:        { bg: "rgba(255,140,0,0.25)",  border: "#FF8C00" },  // orange
  cleaned:        { bg: "rgba(0,204,102,0.18)",   border: "" },         // green
  split:          { bg: "rgba(0,204,102,0.18)",   border: "" },         // green
  formatted:      { bg: "rgba(0,204,102,0.18)",   border: "" },         // green
  personal_email: { bg: "rgba(51,153,255,0.22)",  border: "" },         // blue
  business_email: { bg: "rgba(170,68,255,0.22)",  border: "" },         // purple
  enriched:       { bg: "rgba(0,204,102,0.25)",   border: "#00CC66" },  // green
  needs_enrichment:{ bg: "rgba(255,140,0,0.20)",  border: "#FF8C00" },  // orange
  valid:          { bg: "rgba(0,204,102,0.20)",   border: "#00CC66" },  // green
  invalid:        { bg: "rgba(255,51,51,0.22)",   border: "#FF3333" },  // red
  risky:          { bg: "rgba(255,204,0,0.20)",   border: "#FFCC00" },  // yellow
  unknown:        { bg: "rgba(160,160,180,0.15)", border: "" },         // gray
  role_account:   { bg: "rgba(170,68,255,0.22)",  border: "#AA44FF" },  // purple
};

// Colors for duplicate and empty (no flag)
const DUPLICATE_BG = "rgba(255,51,51,0.22)";
const EMPTY_BG = "rgba(255,140,0,0.25)";

export function DataTableCell({
  value,
  flag,
  isDuplicate,
  onSave,
}: DataTableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [handleSave, value]
  );

  const isEmpty = !value;
  const flagColor = flag ? FLAG_COLORS[flag] : null;

  // Build inline style for background + left border
  const cellStyle: React.CSSProperties = {};
  if (flagColor) {
    cellStyle.backgroundColor = flagColor.bg;
    if (flagColor.border) {
      cellStyle.borderLeft = `2px solid ${flagColor.border}`;
    }
  } else if (isDuplicate) {
    cellStyle.backgroundColor = DUPLICATE_BG;
  } else if (isEmpty) {
    cellStyle.backgroundColor = EMPTY_BG;
  }

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      style={isEditing ? {} : cellStyle}
      className={cn(
        "h-[40px] px-4 py-2 text-[13px] leading-relaxed cursor-default flex items-center text-zinc-100",
        isEditing && "p-0 h-auto"
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-[40px] w-full bg-background px-4 py-2 text-[13px] outline-none ring-2 ring-primary/60 rounded-sm"
        />
      ) : (
        <span
          className="truncate"
          style={isEmpty ? { color: "#FF8C00", fontStyle: "italic", fontSize: "12px", fontWeight: 500 } : undefined}
        >
          {value || "empty"}
        </span>
      )}
    </div>
  );
}
