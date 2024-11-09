import { ColumnDef } from "@tanstack/react-table";
import { Asset, getAssetIcon } from "@/types/asset";
import { Button } from "../ui/button";

export const portfolioColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "label",
    header: "Assets",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <img 
          src={getAssetIcon(row.getValue("label"))} 
          alt={`${row.getValue("label")} icon`}
          className="w-8 h-8 rounded-full"
        />
        {row.getValue("label")}
      </div>
    ),
  },
  {
    accessorKey: "select_native",
    header: "Supplied",
  },
  {
    accessorKey: "apy",
    header: "APY",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const handleAction = () => {
        const actionType = row.original.type === 'supply' ? 'withdraw' : 'repay';
        console.log(`${actionType} action triggered for:`, {
          asset: row.original.label,
        });
      };

      return (
        <div className="text-right">
          <Button variant="secondary" onClick={handleAction}>
            {row.original.type === 'supply' ? 'Withdraw' : 'Repay'}
          </Button>
        </div>
      );
    },
  },
]; 