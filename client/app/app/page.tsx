"use client";
import { useEffect, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetTable } from "@/components/asset-table/asset-table";
import { Asset, columns } from "@/components/asset-table/columns";
import SupplyDialog from "@/components/supply-dialog";
import { useRadixContext } from "@/contexts/provider";
import { gatewayApi, rdt } from "@/lib/radix";
import { assetAddrRecord } from "@/lib/utils";
import { PortfolioTable } from "@/components/portfolio-table/portfolio-table";
import { portfolioColumns } from "@/components/portfolio-table/portfolio-columns";

const data: Asset[] = [
  {
    address: assetAddrRecord["XRD"],
    label: "XRD",
    wallet_balance: 100.5,
    select_native: 0.00,
    apy: "10.3%",
  },
  {
    address: assetAddrRecord["USDT"],
    label: "USDT",
    wallet_balance: 87,
    select_native: 0.00,
    apy: "5.5%",
  },
  {
    address: assetAddrRecord["HUG"],
    label: "HUG",
    wallet_balance: 12,
    select_native: 0.00,
    apy: "23.1%",
  },
];

const supplyData = data;
const borrowData = data;

export default function App() {
  const { accounts } = useRadixContext();
  const [supplyRowSelection, setSupplyRowSelection] = React.useState<RowSelectionState>({});
  const [borrowRowSelection, setBorrowRowSelection] = React.useState<RowSelectionState>({});
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

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
                data={supplyData.map(asset => ({ ...asset, type: 'supply' }))}
              />
            </CardContent>
          </Card>

          {/* Available Collateral Card */}
          <Card>
            <CardHeader>
              <div className="grid grid-cols-2 gap-4">
                <CardTitle>Available Collateral</CardTitle>
                {hasSelectedSupplyAssets && (
                  <Button onClick={previewSupply}>Preview Supply</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AssetTable
                columns={columns}
                data={supplyData}
                rowSelection={supplyRowSelection}
                onRowSelectionChange={setSupplyRowSelection}
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
                data={borrowData.map(asset => ({ ...asset, type: 'borrow' }))}
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
                data={borrowData}
                rowSelection={borrowRowSelection}
                onRowSelectionChange={setBorrowRowSelection}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <SupplyDialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        onConfirm={handleSupplyConfirm}
      />
    </main>
  );
}