import { ColumnDef } from "@tanstack/react-table";
import { Asset } from "../asset-table/columns";
import { Button } from "../ui/button";

export const portfolioColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "label",
    header: "Assets",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        {row.getValue("label")}
      </div>
    ),
  },
  {
    accessorKey: "select_native",
    header: "Supplied/Borrowed",
  },
  {
    accessorKey: "select_usd",
    header: "Supply/Debt",
    cell: ({ row }) => (
      <div>${row.getValue("select_usd")}</div>
    ),
  },
  {
    accessorKey: "apy",
    header: "APY",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="secondary">
          {row.original.type === 'supply' ? 'Withdraw' : 'Repay'}
        </Button>
      </div>
    ),
  },
]; 