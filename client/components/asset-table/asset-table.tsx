"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  RowSelectionState,
  Updater,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AssetCollapsibleContent } from "./collapsible-content";
import { Asset } from "@/types/asset";

interface DataTableProps<TData extends Asset, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (updaterOrValue: Updater<RowSelectionState>) => void;
}

export function AssetTable<TData extends Asset, TValue>({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: onRowSelectionChange,
    state: {
      columnFilters,
      rowSelection,
    },
  });

  // Custom row sorting function
  const sortedRows = React.useMemo(() => {
    const rows = [...table.getRowModel().rows];
    return rows.sort((a, b) => {
      const aSelected = a.getIsSelected() ? 1 : 0;
      const bSelected = b.getIsSelected() ? 1 : 0;
      return bSelected - aSelected;
    });
  }, [table.getRowModel().rows, rowSelection]);

  return (
    <div className="rounded-md border">
      <Input
        placeholder="Find assets..."
        value={(table.getColumn("label")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("label")?.setFilterValue(event.target.value)
        }
        className="max-w-sm m-4"
      />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {sortedRows.length ? (
            sortedRows.map((row) => (
              <Collapsible key={row.id} asChild>
                <>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <div className="p-4 bg-gray-100 rounded-lg">
                          <AssetCollapsibleContent asset={row.original} />
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}