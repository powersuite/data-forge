"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { runCleanup } from "@/lib/cleanup";
import { unparseCSV } from "@/lib/csv-parser";
import { downloadFile } from "@/lib/utils";
import { BATCH_SIZE } from "@/lib/constants";
import { List, ListRow, CleanupSummary } from "@/types";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { DataTableToolbar } from "@/components/data-table-toolbar";
import { CleanupSummaryDialog } from "@/components/cleanup-summary-dialog";

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
        isCleaning={isCleaning}
        isCleaned={list?.cleaned ?? false}
        hideDuplicates={hideDuplicates}
        onToggleDuplicates={() => setHideDuplicates((h) => !h)}
        duplicateCount={duplicateCount}
        rowCount={hideDuplicates ? rows.length - duplicateCount : rows.length}
      />

      <DataTable
        rows={rows}
        columns={columns}
        hideDuplicates={hideDuplicates}
        onCellEdit={handleCellEdit}
      />

      <CleanupSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={summary}
      />
    </div>
  );
}
