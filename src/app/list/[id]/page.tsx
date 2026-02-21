"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { runCleanup } from "@/lib/cleanup";
import { runEnrichment } from "@/lib/enrichment";
import { unparseCSV } from "@/lib/csv-parser";
import { downloadFile } from "@/lib/utils";
import { BATCH_SIZE } from "@/lib/constants";
import { List, ListRow, CleanupSummary, EnrichmentProgress as EnrichmentProgressType, EnrichmentSummary } from "@/types";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { DataTableToolbar, FilterMode } from "@/components/data-table-toolbar";
import { CleanupSummaryDialog } from "@/components/cleanup-summary-dialog";
import { EnrichmentProgress } from "@/components/enrichment-progress";
import { EnrichmentSummaryDialog } from "@/components/enrichment-summary-dialog";

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [list, setList] = useState<List | null>(null);
  const [rows, setRows] = useState<ListRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<CleanupSummary | null>(null);

  // Enrichment state
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgressType | null>(null);
  const [enrichmentSummary, setEnrichmentSummary] = useState<EnrichmentSummary | null>(null);
  const [enrichmentSummaryOpen, setEnrichmentSummaryOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Load list and rows
  useEffect(() => {
    async function load() {
      const { data: listData } = await supabase
        .from("lists")
        .select("*")
        .eq("id", id)
        .single();

      if (!listData) {
        toast.error("List not found");
        router.push("/");
        return;
      }

      const { data: rowData } = await supabase
        .from("list_rows")
        .select("*")
        .eq("list_id", id)
        .order("row_index", { ascending: true });

      setList(listData as List);
      setColumns((listData as List).columns);
      setRows((rowData ?? []) as ListRow[]);
      setLoading(false);
    }
    load();
  }, [id, router]);

  // Smart Cleanup
  const handleCleanup = useCallback(async () => {
    if (!list || rows.length === 0) return;
    setIsCleaning(true);

    try {
      const result = runCleanup(rows, columns);
      setRows(result.rows);
      setColumns(result.newColumns);
      setSummary(result.summary);
      setSummaryOpen(true);

      // Update list metadata
      await supabase
        .from("lists")
        .update({
          cleaned: true,
          columns: result.newColumns,
          updated_at: new Date().toISOString(),
        })
        .eq("id", list.id);

      setList((prev) => (prev ? { ...prev, cleaned: true, columns: result.newColumns } : prev));

      // Batch update rows in Supabase
      for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
        const batch = result.rows.slice(i, i + BATCH_SIZE);
        for (const row of batch) {
          await supabase
            .from("list_rows")
            .update({
              data: row.data,
              flags: row.flags,
              is_duplicate: row.is_duplicate,
            })
            .eq("id", row.id);
        }
      }

      toast.success("Cleanup complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cleanup failed");
    } finally {
      setIsCleaning(false);
    }
  }, [list, rows, columns]);

  // Enrichment
  const handleEnrich = useCallback(async () => {
    if (!list || rows.length === 0) return;
    setIsEnriching(true);
    setEnrichmentProgress({ step: "Starting...", current: 0, total: rows.length, errors: 0 });

    try {
      const result = await runEnrichment(rows, columns, list.id, (progress) => {
        setEnrichmentProgress(progress);
      });

      setEnrichmentSummary(result);
      setEnrichmentSummaryOpen(true);

      // Re-fetch rows from Supabase to get server-side updates
      const { data: rowData } = await supabase
        .from("list_rows")
        .select("*")
        .eq("list_id", list.id)
        .order("row_index", { ascending: true });

      if (rowData) {
        setRows(rowData as ListRow[]);
        // Check if any new columns were added (Title, etc.)
        const allKeys = new Set<string>();
        for (const row of rowData as ListRow[]) {
          for (const key of Object.keys(row.data)) {
            allKeys.add(key);
          }
        }
        const newColumns = Array.from(allKeys);
        // Preserve existing column order, append new ones
        const existingSet = new Set(columns);
        const addedColumns = newColumns.filter((c) => !existingSet.has(c));
        if (addedColumns.length > 0) {
          const updatedColumns = [...columns, ...addedColumns];
          setColumns(updatedColumns);
          await supabase
            .from("lists")
            .update({ columns: updatedColumns, updated_at: new Date().toISOString() })
            .eq("id", list.id);
        }
      }

      // Mark list as enriched
      await supabase
        .from("lists")
        .update({
          enriched: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", list.id);

      setList((prev) => (prev ? { ...prev, enriched: true } : prev));
      toast.success("Enrichment complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setIsEnriching(false);
      setEnrichmentProgress(null);
    }
  }, [list, rows, columns]);

  // Cell edit
  const handleCellEdit = useCallback(
    async (rowId: string, column: string, value: string) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, data: { ...r.data, [column]: value } }
            : r
        )
      );

      // Persist to Supabase
      const row = rows.find((r) => r.id === rowId);
      if (row) {
        const updatedData = { ...row.data, [column]: value };
        await supabase
          .from("list_rows")
          .update({ data: updatedData })
          .eq("id", rowId);
      }
    },
    [rows]
  );

  // Export
  const handleExport = useCallback(() => {
    const exportRows = hideDuplicates
      ? rows.filter((r) => !r.is_duplicate)
      : rows;
    const data = exportRows.map((r) => r.data);
    const csv = unparseCSV(data, columns);
    const filename = `${list?.name ?? "export"}_cleaned.csv`;
    downloadFile(csv, filename);
    toast.success("CSV exported!");
  }, [rows, columns, hideDuplicates, list]);

  const duplicateCount = rows.filter((r) => r.is_duplicate).length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[95vw] px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{list?.name}</h1>
          <p className="text-xs text-muted-foreground">
            {list?.row_count.toLocaleString()} rows &middot;{" "}
            {columns.length} columns
          </p>
        </div>
      </div>

      <DataTableToolbar
        onCleanup={handleCleanup}
        onExport={handleExport}
        onEnrich={handleEnrich}
        isCleaning={isCleaning}
        isCleaned={list?.cleaned ?? false}
        isEnriching={isEnriching}
        isEnriched={list?.enriched ?? false}
        enrichmentProgress={enrichmentProgress}
        hideDuplicates={hideDuplicates}
        onToggleDuplicates={() => setHideDuplicates((h) => !h)}
        duplicateCount={duplicateCount}
        rowCount={hideDuplicates ? rows.length - duplicateCount : rows.length}
        filterMode={filterMode}
        onFilterChange={setFilterMode}
      />

      {isEnriching && enrichmentProgress && (
        <div className="mb-3">
          <EnrichmentProgress progress={enrichmentProgress} />
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        hideDuplicates={hideDuplicates}
        filterMode={filterMode}
        isEnriched={list?.enriched ?? false}
        onCellEdit={handleCellEdit}
      />

      <CleanupSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={summary}
      />

      <EnrichmentSummaryDialog
        open={enrichmentSummaryOpen}
        onOpenChange={setEnrichmentSummaryOpen}
        summary={enrichmentSummary}
      />
    </div>
  );
}
