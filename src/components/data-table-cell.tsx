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

// Strong, visible color tints for dark mode
const flagStyles: Record<CellFlag, string> = {
  // Phase 1 cleanup
  missing: "bg-amber-900/40 border-l-2 border-l-amber-400",
  cleaned: "bg-emerald-900/25",
  split: "bg-emerald-900/25",
  formatted: "bg-emerald-900/25",
  personal_email: "bg-blue-900/30",
  business_email: "bg-violet-900/30",
  // Phase 2 enrichment
  enriched: "bg-emerald-900/35 border-l-2 border-l-emerald-400",
  needs_enrichment: "bg-orange-900/30 border-l-2 border-l-orange-400",
  valid: "bg-green-900/30 border-l-2 border-l-green-400",
  invalid: "bg-red-900/35 border-l-2 border-l-red-400",
  risky: "bg-yellow-900/30 border-l-2 border-l-yellow-400",
  unknown: "bg-zinc-800/40",
  role_account: "bg-purple-900/30 border-l-2 border-l-purple-400",
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
        "h-[40px] px-4 py-2 text-[13px] leading-relaxed cursor-default flex items-center",
        // Duplicate row tint
        isDuplicate && "bg-red-900/25",
        // Empty cell gets amber tint so missing data jumps out
        isEmpty && !flag && "bg-amber-900/20",
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
            isEmpty && "text-amber-400/50 italic text-xs"
          )}
        >
          {value || "empty"}
        </span>
      )}
    </div>
  );
}
