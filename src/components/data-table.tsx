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

const SOURCE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  website: { label: "Scraped", variant: "default" },
  icypeas: { label: "Icypeas", variant: "secondary" },
  "website+icypeas": { label: "Scraped + Icypeas", variant: "default" },
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
        size: 56,
        cell: ({ row }) => (
          <div className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
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
        size: 130,
        cell: ({ row }) => {
          const source = row.original.data["_enrichment_source"];
          if (!source) return <div className="px-3 py-2.5 text-xs text-muted-foreground">—</div>;
          const info = SOURCE_LABELS[source] ?? { label: source, variant: "outline" as const };
          return (
            <div className="px-3 py-2.5">
              <Badge variant={info.variant} className="text-[10px] px-1.5 py-0">
                {info.label}
              </Badge>
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
    <div className="rounded-lg border border-border/50 bg-card overflow-auto max-h-[calc(100vh-220px)]">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize(), minWidth: header.getSize() }}
                  className="sticky top-0 z-10 whitespace-nowrap bg-muted/80 backdrop-blur-sm px-3 py-2.5 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border/50"
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
        <tbody className="[&_tr:last-child]:border-0">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={tableColumns.length} className="h-24 text-center text-muted-foreground">
                No data
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/30 transition-colors hover:bg-muted/30",
                  row.original.is_duplicate && "opacity-50"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-0 align-middle whitespace-nowrap">
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
