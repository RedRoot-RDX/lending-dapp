import { ColumnDef } from "@tanstack/react-table";
import { Asset, getAssetIcon } from "@/types/asset";
import { Button } from "../ui/button";
import { useState } from "react";
import { WithdrawDialog } from "./withdraw-dialog";
import { useToast } from "../ui/use-toast";
import { RepayDialog } from "./repay-dialog";
import position_withdraw_rtm from "@/lib/manifests/position_withdraw";
import { gatewayApi, rdt } from "@/lib/radix";
import { useRadixContext } from "@/contexts/provider";
import config from "@/lib/config.json";

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
    header: ({ table }) => {
      const firstRow = table.getRowModel().rows[0];
      return firstRow?.original.type === 'supply' ? "Supplied" : "Debt";
    },
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
      const { accounts } = useRadixContext();

      const handleWithdraw = async (amount: number) => {
        try {
          if (!accounts || !gatewayApi) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Wallet not connected",
            });
            return;
          }

          const borrowerBadgeAddr = config.borrowerBadgeAddr;
          const marketComponent = config.marketComponent;

          if (!borrowerBadgeAddr || !marketComponent) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Contract addresses not configured",
            });
            return;
          }

          // Get NFT ID from account state
          const accountState = await gatewayApi.state.getEntityDetailsVaultAggregated(accounts[0].address);
          const getNFTBalance = accountState.non_fungible_resources.items.find(
            (fr: { resource_address: string }) => fr.resource_address === borrowerBadgeAddr
          )?.vaults.items[0];

          if (!getNFTBalance?.items?.[0]) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "No position NFT found",
            });
            return;
          }

          const manifest = position_withdraw_rtm({
            component: marketComponent,
            account: accounts[0].address,
            position_badge_address: borrowerBadgeAddr,
            position_badge_local_id: getNFTBalance.items[0],
            asset: {
              address: row.original.address,
              amount: amount
            }
          });

          console.log("Manifest: ", manifest);

          const result = await rdt?.walletApi.sendTransaction({
            transactionManifest: manifest,
            version: 1,
          });

          if (result) {
            toast({
              title: "Withdrawal Successful",
              description: `Withdrew ${amount} ${row.original.label}`,
            });
          }
        } catch (error) {
          console.error("Withdrawal error:", error);
          toast({
            variant: "destructive",
            title: "Withdrawal Failed",
            description: error instanceof Error ? error.message : "Unknown error occurred",
          });
        } finally {
          setIsDialogOpen(false);
        }
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
