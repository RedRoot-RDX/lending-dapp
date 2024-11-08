"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState,
  Updater,
  TableState,
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
} from "@/components/ui/collapsible";
import { AssetCollapsibleContent } from "./collapsible-content";
import { Asset } from "@/types/asset";

interface DataTableProps<TData extends Asset, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (updaterOrValue: Updater<RowSelectionState>) => void;
  onAmountChange: (address: string, amount: number) => void;
}

export function AssetTable<TData extends Asset, TValue>({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
  onAmountChange,
}: DataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState(data);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const [selectionOrder, setSelectionOrder] = React.useState<string[]>([]);

  const handleAmountChange = (address: string, amount: number) => {
    setTableData(current =>
      current.map(row =>
        row.address === address
          ? { ...row, select_native: amount }
          : row
      )
    );
    onAmountChange(address, amount);
  };

  const handleConfirm = () => {
    setExpandedRows({}); // Collapse all rows
  };

  // Handle row selection changes
  const handleRowSelectionChange = (updaterOrValue: Updater<RowSelectionState>) => {
    const newSelection = typeof updaterOrValue === 'function' 
      ? updaterOrValue(rowSelection)
      : updaterOrValue;

    // Update selection order
    const previouslySelected = Object.keys(rowSelection).filter(id => rowSelection[id]);
    const newlySelected = Object.keys(newSelection).filter(id => newSelection[id]);
    
    setSelectionOrder(current => {
      // Remove unselected items
      const filtered = current.filter(id => newlySelected.includes(id));
      // Add newly selected items
      const newItems = newlySelected.filter(id => !current.includes(id));
      return [...filtered, ...newItems];
    });

    // Automatically expand the newly selected row
    const newlySelectedId = newlySelected.find(id => !previouslySelected.includes(id));
    if (newlySelectedId) {
      setExpandedRows({ [newlySelectedId]: true });
    } else if (previouslySelected.length > newlySelected.length) {
      // If we're unselecting, collapse all
      setExpandedRows({});
    }
    
    onRowSelectionChange(newSelection);
  };

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: handleRowSelectionChange,
    enableExpanding: true,
    onExpandedChange: (updaterOrValue) => {
      const newValue = typeof updaterOrValue === 'function'
        ? updaterOrValue(expandedRows)
        : updaterOrValue;
      
      const expandedState = typeof newValue === 'boolean' 
        ? {} 
        : newValue as Record<string, boolean>;
      
      // Always ensure only one row is expanded
      const expandedRowIds = Object.entries(expandedState)
        .filter(([_, expanded]) => expanded)
        .map(([id]) => id);
      
      // Create a new state with all rows collapsed
      const newState: Record<string, boolean> = {};
      Object.keys(expandedState).forEach(id => {
        newState[id] = false;
      });
      
      // If there's an expanded row, only expand the last one
      if (expandedRowIds.length > 0) {
        const lastExpandedId = expandedRowIds[expandedRowIds.length - 1];
        newState[lastExpandedId] = true;
      }
      
      setExpandedRows(newState);
    },
    state: {
      columnFilters,
      rowSelection,
      expanded: expandedRows,
    },
  });

  // Custom row sorting function
  const sortedRows = React.useMemo(() => {
    const rows = [...table.getRowModel().rows];
    return rows.sort((a, b) => {
      const aSelected = a.getIsSelected();
      const bSelected = b.getIsSelected();
      
      // If both rows are selected, use the selection order
      if (aSelected && bSelected) {
        return selectionOrder.indexOf(a.id) - selectionOrder.indexOf(b.id);
      }
      
      // If only one is selected, put it first
      return bSelected ? 1 : aSelected ? -1 : 0;
    });
  }, [table.getRowModel().rows, rowSelection, selectionOrder]);

  const handleExpansionChange = (rowId: string) => {
    setExpandedRows(prev => {
      // If clicking on already expanded row, allow it to close
      if (prev[rowId]) {
        return {};
      }
      // Otherwise, expand the clicked row and close others
      return { [rowId]: true };
    });
  };

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
              <Collapsible
                key={row.id}
                asChild
                open={expandedRows[row.id]}
              >
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
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="bg-gray-100">
                          <AssetCollapsibleContent 
                            asset={row.original} 
                            onAmountChange={(amount) => handleAmountChange(row.original.address, amount)}
                            onConfirm={handleConfirm}
                          />
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