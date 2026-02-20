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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTableCell } from "@/components/data-table-cell";
import { ListRow } from "@/types";
import { cn } from "@/lib/utils";

interface DataTableProps {
  rows: ListRow[];
  columns: string[];
  hideDuplicates: boolean;
  onCellEdit: (rowId: string, column: string, value: string) => void;
}

export function DataTable({
  rows,
  columns,
  hideDuplicates,
  onCellEdit,
}: DataTableProps) {
  const filteredRows = useMemo(
    () => (hideDuplicates ? rows.filter((r) => !r.is_duplicate) : rows),
    [rows, hideDuplicates]
  );

  const tableColumns = useMemo<ColumnDef<ListRow>[]>(
    () => [
      {
        id: "_index",
        header: "#",
        size: 50,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.row_index + 1}
          </span>
        ),
      },
      ...columns.map(
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
    ],
    [columns, onCellEdit]
  );

  const table = useReactTable({
    data: filteredRows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <ScrollArea className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="whitespace-nowrap bg-muted/50 text-xs font-semibold"
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
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
