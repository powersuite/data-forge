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

// High-contrast color tints for dark mode — bright enough to read
const flagStyles: Record<CellFlag, string> = {
  // Phase 1 cleanup
  missing: "bg-amber-500/25 border-l-2 border-l-amber-400 text-amber-100",
  cleaned: "bg-emerald-500/20 text-emerald-100",
  split: "bg-emerald-500/20 text-emerald-100",
  formatted: "bg-emerald-500/20 text-emerald-100",
  personal_email: "bg-blue-500/20 text-blue-100",
  business_email: "bg-violet-500/20 text-violet-100",
  // Phase 2 enrichment
  enriched: "bg-emerald-500/25 border-l-2 border-l-emerald-400 text-emerald-50",
  needs_enrichment: "bg-orange-500/20 border-l-2 border-l-orange-400 text-orange-100",
  valid: "bg-green-500/20 border-l-2 border-l-green-400 text-green-100",
  invalid: "bg-red-500/25 border-l-2 border-l-red-400 text-red-100",
  risky: "bg-yellow-500/20 border-l-2 border-l-yellow-400 text-yellow-100",
  unknown: "bg-zinc-500/20 text-zinc-200",
  role_account: "bg-purple-500/20 border-l-2 border-l-purple-400 text-purple-100",
};

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

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "h-[40px] px-4 py-2 text-[13px] leading-relaxed cursor-default flex items-center text-zinc-100",
        // Duplicate row tint
        isDuplicate && "bg-red-500/20 text-red-100",
        // Empty cell gets amber tint so missing data jumps out
        isEmpty && !flag && "bg-amber-500/25",
        // Flag-based styling overrides
        flag && flagStyles[flag],
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
          className={cn(
            "truncate",
            isEmpty && "text-amber-300 italic text-xs font-medium"
          )}
        >
          {value || "empty"}
        </span>
      )}
    </div>
  );
}
