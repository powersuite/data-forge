"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Download, Eye, EyeOff, Zap, CheckCircle2 } from "lucide-react";
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
        {/* Row count badge */}
        <span className="inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700/50 px-2.5 py-1 text-xs font-medium text-zinc-300 tabular-nums">
          {rowCount.toLocaleString()} rows
        </span>

        {/* Status badges */}
        {isCleaned && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900/50 border border-emerald-700/40 px-2.5 py-1 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Cleaned
          </span>
        )}
        {isEnriched && (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-900/50 border border-blue-700/40 px-2.5 py-1 text-xs font-medium text-blue-300">
            <Zap className="h-3 w-3" />
            Enriched
          </span>
        )}

        {duplicateCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDuplicates}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
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
            <SelectTrigger className="h-7 w-[160px] text-xs bg-zinc-800/50 border-zinc-700/50">
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
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          {isCleaning ? "Cleaning..." : isCleaned ? "Cleaned" : "Smart Cleanup"}
        </Button>
        <Button
          onClick={onEnrich}
          disabled={!isCleaned || isEnriching || isEnriched}
          size="sm"
          className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
        >
          <Zap className="h-4 w-4" />
          {enrichButtonLabel}
        </Button>
        <Button
          onClick={onExport}
          variant="outline"
          size="sm"
          className="gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
