"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Download, Eye, EyeOff, Zap } from "lucide-react";
import { EnrichmentProgress as EnrichmentProgressType } from "@/types";

export type FilterMode =
  | "all"
  | "needs_enrichment"
  | "valid"
  | "invalid"
  | "risky"
  | "role_account";

interface DataTableToolbarProps {
  onCleanup: () => void;
  onExport: () => void;
  onEnrich: () => void;
  isCleaning: boolean;
  isCleaned: boolean;
  isEnriching: boolean;
  isEnriched: boolean;
  enrichmentProgress: EnrichmentProgressType | null;
  hideDuplicates: boolean;
  onToggleDuplicates: () => void;
  duplicateCount: number;
  rowCount: number;
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
}

export function DataTableToolbar({
  onCleanup,
  onExport,
  onEnrich,
  isCleaning,
  isCleaned,
  isEnriching,
  isEnriched,
  enrichmentProgress,
  hideDuplicates,
  onToggleDuplicates,
  duplicateCount,
  rowCount,
  filterMode,
  onFilterChange,
}: DataTableToolbarProps) {
  const enrichButtonLabel = isEnriching && enrichmentProgress
    ? `Enriching... ${enrichmentProgress.current}/${enrichmentProgress.total}`
    : isEnriched
      ? "Enriched"
      : "Enrich";

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
        {isCleaned && (
          <Select value={filterMode} onValueChange={(v) => onFilterChange(v as FilterMode)}>
            <SelectTrigger className="h-7 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rows</SelectItem>
              <SelectItem value="needs_enrichment">Needs enrichment</SelectItem>
              <SelectItem value="valid">Valid email</SelectItem>
              <SelectItem value="invalid">Invalid email</SelectItem>
              <SelectItem value="risky">Risky</SelectItem>
              <SelectItem value="role_account">Role accounts</SelectItem>
            </SelectContent>
          </Select>
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
        <Button
          onClick={onEnrich}
          disabled={!isCleaned || isEnriching || isEnriched}
          size="sm"
          variant="secondary"
          className="gap-1.5"
        >
          <Zap className="h-4 w-4" />
          {enrichButtonLabel}
        </Button>
        <Button onClick={onExport} variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
