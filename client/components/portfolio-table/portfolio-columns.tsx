import { ColumnDef } from "@tanstack/react-table";
import { Asset, getAssetIcon } from "@/types/asset";
import { Button } from "../ui/button";
import { useState } from "react";
import { WithdrawDialog } from "./withdraw-dialog";
import { useToast } from "../ui/use-toast";
import { RepayDialog } from "./repay-dialog";

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
    header: "Debt",
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

      const handleRepay = (amount: number) => {
        console.log(`Repay action triggered for:`, {
          asset: row.original.label,
          amount: amount,
        });
        
        toast({
          title: "Repayment Initiated",
          description: `Repaying ${amount} ${row.original.label}`,
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

          {row.original.type === 'supply' ? (
            <WithdrawDialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onConfirm={handleWithdraw}
              asset={row.original}
            />
          ) : (
            <RepayDialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onConfirm={handleRepay}
              asset={row.original}
            />
          )}
        </>
      );
    },
  },
]; 