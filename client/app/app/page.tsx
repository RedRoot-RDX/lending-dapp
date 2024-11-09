"use client";
import { useEffect, useState } from "react";
import { RowSelectionState, Updater } from "@tanstack/react-table";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AssetTable } from "@/components/asset-table/asset-table";
import { columns } from "@/components/asset-table/columns";
import SupplyDialog from "@/components/supply-dialog";
import { useRadixContext } from "@/contexts/provider";
import { gatewayApi, rdt } from "@/lib/radix";
import { getAssetAddrRecord, Asset, AssetName } from "@/types/asset";
import { PortfolioTable } from "@/components/portfolio-table/portfolio-table";
import { portfolioColumns } from "@/components/portfolio-table/portfolio-columns";
import { useToast } from "@/components/ui/use-toast";

export default function App() {
  const { accounts } = useRadixContext();
  const [supplyRowSelection, setSupplyRowSelection] = React.useState<RowSelectionState>({});
  const [borrowRowSelection, setBorrowRowSelection] = React.useState<RowSelectionState>({});
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const { toast } = useToast();
  const [supplyData, setSupplyData] = useState<Asset[]>(
    Object.entries(getAssetAddrRecord()).map(([label, address]) => ({
      address,
      label: label as AssetName,
      wallet_balance: 0,
      select_native: 0,
      apy: 0,
    }))
  );

  const hasSelectedSupplyAssets = Object.keys(supplyRowSelection).length > 0;
  const hasSelectedBorrowAssets = Object.keys(borrowRowSelection).length > 0;

  useEffect(() => {
    console.log("Account", accounts);
    console.log("RDT", rdt);
    console.log("GatewayApi", gatewayApi);
  }, [accounts]);

  const getSelectedAssets = () => {
    return Object.keys(supplyRowSelection).map(index => supplyData[Number(index)]);
  };

  const previewSupply = () => {
    setIsPreviewDialogOpen(true);
  };

  const handleSupplyConfirm = () => {
    // Handle supply confirmation logic here
    console.log("Supply confirmed for assets:", getSelectedAssets());
    setIsPreviewDialogOpen(false);
  };

  const validateSelectedAssets = () => {
    const selectedAssets = Object.keys(supplyRowSelection).filter(
      (key) => supplyRowSelection[key]
    );
    
    console.log("Selected assets:", selectedAssets);
    console.log("Supply data:", supplyData);
    
    // Check if any selected assets have amount <= 0
    const hasInvalidAmount = selectedAssets.some((key) => {
      const asset = supplyData[parseInt(key)];
      console.log(`Checking asset ${key}:`, asset);
      return !asset || asset.select_native <= 0;
    });

    return !hasInvalidAmount;
  };

  const handlePreviewSupply = () => {
    if (!validateSelectedAssets()) {
      toast({
        variant: "destructive",
        title: "Invalid Selection",
        description: "Please ensure all selected assets have an amount greater than 0",
      });
      return;
    }
    setIsPreviewDialogOpen(true);
  };

  const handleAmountChange = (address: string, amount: number) => {
    setSupplyData(current =>
      current.map(row =>
        row.address === address
          ? { ...row, select_native: amount }
          : row
      )
    );
  };

  const handleSupplyRowSelectionChange = (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
    setSupplyRowSelection(updaterOrValue);
  };

  return (
    <main className="container py-4 flex-grow">
      <div className="grid grid-cols-2 gap-4">
        {/* Statistics Header */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row gap-8 [&>*]:flex [&>*]:flex-col [&>*>h1]:font-semibold">
            <div>
              <h1>Net Worth</h1>
              <p>-</p>
            </div>
            <div>
              <h1>Net APY</h1>
              <p>-</p>
            </div>
            <div>
              <h1>Health</h1>
              <p>-</p>
            </div>
          </CardContent>
        </Card>

        {/* Collateral Column */}
        <div className="space-y-8">
          {/* Your Collateral Card */}
          <Card>
            <CardHeader>
              <div className="grid grid-cols-2">
                <CardTitle>Your Collateral</CardTitle>
                <div className="flex justify-end">
                  <div className="space-y-0 text-left min-h-[60px]">
                    <div className="grid grid-cols-[auto,1fr] gap-x-6 items-center">
                      <CardDescription className="text-left">Total Supply:</CardDescription>
                      <CardDescription className="text-right mr-4">$0.0</CardDescription>
                      <CardDescription className="text-left">Total APY:</CardDescription>
                      <CardDescription className="text-right mr-4">10.3%</CardDescription>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PortfolioTable
                columns={portfolioColumns}
                data={supplyData.map(asset => ({ ...asset, type: 'supply' as const }))}
              />
            </CardContent>
          </Card>

          {/* Available Collateral Card */}
          <Card>
            <CardHeader>
              <div className="grid grid-cols-2 gap-4">
                <CardTitle>Available Collateral</CardTitle>
                {hasSelectedSupplyAssets && (
                  <Button onClick={handlePreviewSupply}>Preview Supply</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AssetTable
                columns={columns}
                data={supplyData}
                rowSelection={supplyRowSelection}
                onRowSelectionChange={handleSupplyRowSelectionChange}
                onAmountChange={handleAmountChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Borrow Column */}
        <div className="space-y-8">
          {/* Your Borrows Card */}
          <Card>
            <CardHeader>
              <div className="grid grid-cols-2">
                <CardTitle>Your Borrows</CardTitle>
                <div className="flex justify-end">
                  <div className="grid grid-cols-[auto,1fr] gap-x-6 items-center">
                    <CardDescription className="text-left">Total Debt:</CardDescription>
                    <CardDescription className="text-right">$0.0</CardDescription>
                    <CardDescription className="text-left">Total APY:</CardDescription>
                    <CardDescription className="text-right">10.3%</CardDescription>
                    <CardDescription className="text-left">Borrow Power Used:</CardDescription>
                    <CardDescription className="text-right">51.4%</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PortfolioTable
                columns={portfolioColumns}
                data={supplyData.map(asset => ({ ...asset, type: 'borrow' as const }))}
              />
            </CardContent>
          </Card>

          {/* Available Borrows Card */}
          <Card>
            <CardHeader>
              <CardTitle>Available Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetTable
                columns={columns}
                data={supplyData}
                rowSelection={borrowRowSelection}
                onRowSelectionChange={setBorrowRowSelection}
                onAmountChange={handleAmountChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <SupplyDialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        onConfirm={handleSupplyConfirm}
        selectedAssets={getSelectedAssets()}
      />
    </main>
  );
}