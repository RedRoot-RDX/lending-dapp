"use client";
/* ------------------ Imports ----------------- */
import { AssetForm } from "@/components/asset-form";
import { AssetTable } from "@/components/asset-table/asset-table";
import { Asset, columns } from "@/components/asset-table/columns";
import SupplyMetrics from '@/components/supply-metrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRadixContext } from "@/contexts/provider";
import { gatewayApi, rdt } from "@/lib/radix";
import { assetAddrRecord } from "@/lib/utils";
import { useEffect, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import React from "react";

/* ----------------- Constants ---------------- */
const data: Asset[] = [
  {
    address: assetAddrRecord["XRD"],
    label: "XRD",
    wallet_balance: 100.5,
    select_native: 10,
    select_usd: 0,
    apy: "10.3%",
  },
  {
    address: assetAddrRecord["USDT"],
    label: "USDT",
    wallet_balance: 87,
    select_native: 87,
    select_usd: 87,
    apy: "5.5%",
  },
  {
    address: assetAddrRecord["HUG"],
    label: "HUG",
    wallet_balance: 12,
    select_native: 109401,
    select_usd: 12,
    apy: "23.1%",
  },
];

/* ------------------- Page ------------------- */
export default function App() {
  const { accounts } = useRadixContext();
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const hasSelectedAssets = Object.keys(rowSelection).length > 0;

  console.log("env", process.env);

  useEffect(() => {
    console.log("Account", accounts);
    console.log("RDT", rdt);
    console.log("GatewayApi", gatewayApi);
  }, [accounts]);

  return (
    <main className="container py-4 flex-grow">
      {/* <Card className="bg-amber-200 p-4 mb-6">
        <h1 className="text-xl font-bold mb-2">DEV STUFF</h1>
        Wallet Address [0]: {accounts != null && accounts.length > 0 ? accounts[0].address : "none connected"}
      </Card> */}
      <div className="grid grid-cols-2 gap-4">
        {/* ------------- Statistics Header ------------ */}
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

        {/* ------------- Collateral Column ------------ */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Collateral</CardTitle>
              <CardDescription>
                Total supply: $0.0
              </CardDescription>
              <CardDescription>
                Total APY: 10.3%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>No Collateral</div>
            </CardContent>
          </Card>
          <div className="h-20">
            <SupplyMetrics show={hasSelectedAssets} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Available Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetTable 
                columns={columns} 
                data={data} 
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </CardContent>
          </Card>
        </div>
        {/* --------------- Borrow Column -------------- */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Borrows</CardTitle>
              <CardDescription>
                Total debt: $0.0
              </CardDescription>
              <CardDescription>
                Borrowing power used: 10.3%
              </CardDescription>
              <CardDescription>
                APY: 20.1%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>No Assets Borrowed</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
              {/* <AssetForm /> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
