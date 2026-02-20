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
  missing: "border-l-2 border-l-amber-500 bg-amber-500/10",
  cleaned: "bg-green-500/10",
  split: "bg-green-500/10",
  formatted: "bg-green-500/10",
  personal_email: "bg-blue-500/10",
  business_email: "bg-purple-500/10",
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
        "min-h-[32px] px-2 py-1 text-sm cursor-default",
        isDuplicate && "bg-red-500/10",
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
          className="h-full w-full bg-background px-2 py-1 text-sm outline-none ring-1 ring-primary rounded"
        />
      ) : (
        <span className={cn(!value && "text-muted-foreground italic")}>
          {value || "empty"}
        </span>
      )}
    </div>
  );
}
