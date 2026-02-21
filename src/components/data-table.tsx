"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableCell } from "@/components/data-table-cell";
import { ListRow, CellFlag } from "@/types";
import { cn } from "@/lib/utils";
import { FilterMode } from "@/components/data-table-toolbar";

interface DataTableProps {
  rows: ListRow[];
  columns: string[];
  hideDuplicates: boolean;
  filterMode: FilterMode;
  isEnriched: boolean;
  onCellEdit: (rowId: string, column: string, value: string) => void;
}

function rowMatchesFilter(row: ListRow, filterMode: FilterMode): boolean {
  if (filterMode === "all") return true;

  const flags = Object.values(row.flags) as CellFlag[];

  switch (filterMode) {
    case "needs_enrichment":
      return flags.includes("needs_enrichment") || flags.includes("missing");
    case "valid":
      return flags.includes("valid");
    case "invalid":
      return flags.includes("invalid");
    case "risky":
      return flags.includes("risky");
    case "role_account":
      return flags.includes("role_account");
    default:
      return true;
  }
}

const SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
  website: { label: "Scraped", cls: "bg-sky-900/60 text-sky-300 border-sky-700/50" },
  icypeas: { label: "Icypeas", cls: "bg-indigo-900/60 text-indigo-300 border-indigo-700/50" },
  "website+icypeas": { label: "Scraped + Icypeas", cls: "bg-sky-900/60 text-sky-300 border-sky-700/50" },
};

export function DataTable({
  rows,
  columns,
  hideDuplicates,
  filterMode,
  isEnriched,
  onCellEdit,
}: DataTableProps) {
  const displayColumns = useMemo(
    () => columns.filter((c) => !c.startsWith("_")),
    [columns]
  );

  const hasEnrichmentSource = isEnriched && rows.some((r) => r.data["_enrichment_source"]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (hideDuplicates) {
      result = result.filter((r) => !r.is_duplicate);
    }
    if (filterMode !== "all") {
      result = result.filter((r) => rowMatchesFilter(r, filterMode));
    }
    return result;
  }, [rows, hideDuplicates, filterMode]);

  const tableColumns = useMemo<ColumnDef<ListRow>[]>(() => {
    const cols: ColumnDef<ListRow>[] = [
      {
        id: "_index",
        header: "#",
        size: 52,
        cell: ({ row }) => (
          <div className="h-[40px] px-3 flex items-center text-[11px] text-muted-foreground/70 tabular-nums font-mono">
            {row.original.row_index + 1}
          </div>
        ),
      },
      ...displayColumns.map(
        (col): ColumnDef<ListRow> => ({
          id: col,
          header: col,
          size: 180,
          cell: ({ row }) => (
            <DataTableCell
              value={row.original.data[col] ?? ""}
              flag={row.original.flags[col]}
              isDuplicate={row.original.is_duplicate}
              onSave={(value) => onCellEdit(row.original.id, col, value)}
            />
          ),
        })
      ),
    ];

    if (hasEnrichmentSource) {
      cols.push({
        id: "_source",
        header: "Source",
        size: 140,
        cell: ({ row }) => {
          const source = row.original.data["_enrichment_source"];
          if (!source) return <div className="h-[40px] px-4 flex items-center text-[11px] text-muted-foreground/40">—</div>;
          const info = SOURCE_LABELS[source] ?? { label: source, cls: "bg-zinc-800 text-zinc-300 border-zinc-700/50" };
          return (
            <div className="h-[40px] px-4 flex items-center">
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", info.cls)}>
                {info.label}
              </span>
            </div>
          );
        },
      });
    }

    return cols;
  }, [displayColumns, onCellEdit, hasEnrichmentSource]);

  const table = useReactTable({
    data: filteredRows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a1a2e] shadow-xl overflow-auto max-h-[calc(100vh-220px)]">
      <table className="w-full text-sm border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize(), minWidth: header.getSize() }}
                  className={cn(
                    "sticky top-0 z-10 whitespace-nowrap",
                    "bg-[#12121f] text-left",
                    "px-4 py-3",
                    "text-[10px] font-bold text-muted-foreground/80 uppercase tracking-[0.1em]",
                    "border-b-2 border-white/[0.06]",
                    i > 0 && "border-l border-white/[0.04]"
                  )}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={tableColumns.length} className="h-24 text-center text-muted-foreground">
                No data
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors",
                  "border-b border-white/[0.04]",
                  // Alternating row stripes
                  rowIdx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
                  // Hover
                  "hover:bg-white/[0.06]",
                  // Duplicate rows
                  row.original.is_duplicate && "opacity-50"
                )}
              >
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "p-0 align-middle whitespace-nowrap",
                      i > 0 && "border-l border-white/[0.04]"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
