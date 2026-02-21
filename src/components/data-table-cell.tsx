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

const flagStyles: Record<CellFlag, string> = {
  // Phase 1 cleanup flags
  missing: "border-l-2 border-l-amber-500 bg-amber-500/10",
  cleaned: "bg-emerald-500/8",
  split: "bg-emerald-500/8",
  formatted: "bg-emerald-500/8",
  personal_email: "bg-blue-500/10",
  business_email: "bg-violet-500/10",
  // Phase 2 enrichment flags — enriched cells are visually distinct
  enriched: "border-l-2 border-l-emerald-400 bg-emerald-500/15",
  needs_enrichment: "border-l-2 border-l-orange-400 bg-orange-500/8",
  valid: "border-l-2 border-l-green-400 bg-green-500/10",
  invalid: "border-l-2 border-l-red-400 bg-red-500/10",
  risky: "border-l-2 border-l-yellow-400 bg-yellow-500/10",
  unknown: "bg-zinc-500/8",
  role_account: "border-l-2 border-l-purple-400 bg-purple-500/10",
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

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "min-h-[36px] px-3 py-2.5 text-sm cursor-default",
        isDuplicate && "bg-red-500/8",
        flag && flagStyles[flag],
        isEditing && "p-0"
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-full w-full bg-background px-3 py-2.5 text-sm outline-none ring-1 ring-primary rounded"
        />
      ) : (
        <span className={cn(!value && "text-muted-foreground/60 italic text-xs")}>
          {value || "empty"}
        </span>
      )}
    </div>
  );
}
