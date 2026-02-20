"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Eye, EyeOff } from "lucide-react";

interface DataTableToolbarProps {
  onCleanup: () => void;
  onExport: () => void;
  isCleaning: boolean;
  isCleaned: boolean;
  hideDuplicates: boolean;
  onToggleDuplicates: () => void;
  duplicateCount: number;
  rowCount: number;
}

export function DataTableToolbar({
  onCleanup,
  onExport,
  isCleaning,
  isCleaned,
  hideDuplicates,
  onToggleDuplicates,
  duplicateCount,
  rowCount,
}: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {rowCount.toLocaleString()} rows
        </Badge>
        {duplicateCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDuplicates}
            className="h-7 gap-1 text-xs"
          >
            {hideDuplicates ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {hideDuplicates ? "Show" : "Hide"} {duplicateCount} duplicates
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onCleanup}
          disabled={isCleaning || isCleaned}
          size="sm"
          className="gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          {isCleaning ? "Cleaning..." : isCleaned ? "Cleaned" : "Smart Cleanup"}
        </Button>
        <Button onClick={onExport} variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
