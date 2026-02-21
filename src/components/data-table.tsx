"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  // Filter out internal columns from display
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
        size: 50,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums px-2">
            {row.original.row_index + 1}
          </span>
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

    // Add enrichment source column if enriched
    if (hasEnrichmentSource) {
      cols.push({
        id: "_source",
        header: "Source",
        size: 120,
        cell: ({ row }) => {
          const source = row.original.data["_enrichment_source"];
          if (!source) return <span className="px-2 text-xs text-muted-foreground">—</span>;
          const info = SOURCE_LABELS[source] ?? { label: source, variant: "outline" as const };
          return (
            <div className="px-2 py-1">
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
    <div className="rounded-md border overflow-auto max-h-[calc(100vh-220px)]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize(), minWidth: header.getSize() }}
                  className="whitespace-nowrap bg-muted/50 text-xs font-semibold sticky top-0 z-10"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                No data
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  row.original.is_duplicate && "opacity-60"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
