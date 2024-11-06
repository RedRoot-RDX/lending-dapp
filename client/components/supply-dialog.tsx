"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface PreviewAsset {
  symbol: string;
  amount: number;
  health: number;
  color: string;
}

const previewData: PreviewAsset[] = [
  { color: 'bg-green-400', symbol: 'XRD', amount: 123.00123123123, health: 0.401 },
  { color: 'bg-red-400', symbol: 'MEME', amount: 99.00123123123, health: 0.231 },
  { color: 'bg-orange-400', symbol: 'USDT', amount: 5.00123123123, health: 0.123 }
];

const columns: ColumnDef<PreviewAsset>[] = [
  {
    accessorKey: 'symbol',
    header: 'Asset',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full ${row.original.color}`} />
        <span className="font-semibold">{row.getValue('symbol')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="font-semibold">${row.getValue('amount')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'health',
    header: () => <div className="text-right">Effect on health</div>,
    cell: ({ row }) => (
      <div className="text-right text-red-500 font-medium">
        {row.getValue('health')}
      </div>
    ),
  },
];

interface SupplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SupplyDialog: React.FC<SupplyDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const table = useReactTable({
    data: previewData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Preview Supply</DialogTitle>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Supply</div>
              <div className="text-xl font-semibold">$0.0</div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-500">Total Health Factor</div>
              <div className="flex items-center gap-2">
                <div className="text-red-500 font-semibold">1.0</div>
                <ArrowRight className="w-6 h-6" />
                <div className="text-green-500 font-semibold">2.0</div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No assets
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={onConfirm}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Confirm Supply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplyDialog;