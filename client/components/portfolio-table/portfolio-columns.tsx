import { ColumnDef } from "@tanstack/react-table";
import { Asset, getAssetIcon } from "@/types/asset";
import { Button } from "../ui/button";
import { useState } from "react";
import { WithdrawDialog } from "./withdraw-dialog";
import { useToast } from "../ui/use-toast";

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
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const { toast } = useToast();

      const handleWithdraw = (amount: number) => {
        // TODO: Call backend to withdraw
        console.log(`Withdraw action triggered for:`, {
          asset: row.original.label,
          amount: amount,
        });
        
        toast({
          title: "Withdrawal Initiated",
          description: `Withdrawing ${amount} ${row.original.label}`,
        });
        
        setIsDialogOpen(false);
      };

      return (
        <>
          <div className="text-right">
            <Button 
              variant="secondary" 
              onClick={() => setIsDialogOpen(true)}
            >
              {row.original.type === 'supply' ? 'Withdraw' : 'Repay'}
            </Button>
          </div>

          <WithdrawDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onConfirm={handleWithdraw}
            asset={row.original}
          />
        </>
      );
    },
  },
]; 