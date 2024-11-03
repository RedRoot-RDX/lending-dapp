"use client";
/* ------------------ Imports ----------------- */
import { AssetForm } from "@/components/asset-form";
import { AssetTable } from "@/components/asset-table/asset-table";
import { Asset, columns } from "@/components/asset-table/columns";
import SupplyConfirmation from '@/components/supply-confirmation';
import BorrowMetrics from '@/components/borrow-metrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRadixContext } from "@/contexts/provider";
import { gatewayApi, rdt } from "@/lib/radix";
import { assetAddrRecord } from "@/lib/utils";
import { useEffect, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import React from "react";
import { Button } from "@/components/ui/button";

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

const supplyData = data;
const borrowData = data;

/* ------------------- Page ------------------- */
export default function App() {
  const { accounts } = useRadixContext();
  const [supplyRowSelection, setSupplyRowSelection] = React.useState<RowSelectionState>({});
  const [borrowRowSelection, setBorrowRowSelection] = React.useState<RowSelectionState>({});

  const hasSelectedSupplyAssets = Object.keys(supplyRowSelection).length > 0;
  const hasSelectedBorrowAssets = Object.keys(borrowRowSelection).length > 0;

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
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Collateral</CardTitle>
              <div className="flex justify-between items-center mt-2">
                <div className="space-y-1">
                  <CardDescription>Total Supply: $0.0</CardDescription>
                  <CardDescription>Total APY: 10.3%</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Assets</th>
                    <th className="text-left py-2">Supplied</th>
                    <th className="text-left py-2">Supply</th>
                    <th className="text-left py-2">APY</th>
                    <th className="text-right py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {supplyData.map((asset) => (
                    <tr key={asset.label} className="border-b">
                      <td className="py-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" /> {/* Asset icon */}
                        {asset.label}
                      </td>
                      <td>{asset.select_native}</td>
                      <td>${asset.select_usd}</td>
                      <td>{asset.apy}</td>
                      <td className="text-right">
                        <Button variant="secondary">Withdraw</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <SupplyConfirmation show={hasSelectedSupplyAssets} />
          <Card>
            <CardHeader>
              <CardTitle>Available Collateral</CardTitle>
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
        {/* --------------- Borrow Column -------------- */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Borrows</CardTitle>
              <div className="flex justify-between items-center mt-2">
                <div className="space-y-1">
                  <CardDescription>Total Debt: $0.0</CardDescription>
                  <CardDescription>Total APY: 0%</CardDescription>
                </div>
                <CardDescription>Borrowing Power Used: 51.4%</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Assets</th>
                    <th className="text-left py-2">Borrowed</th>
                    <th className="text-left py-2">Debt</th>
                    <th className="text-left py-2">APY</th>
                    <th className="text-right py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {borrowData.map((asset) => (
                    <tr key={asset.label} className="border-b">
                      <td className="py-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" /> {/* Asset icon */}
                        {asset.label}
                      </td>
                      <td>{asset.select_native}</td>
                      <td>${asset.select_usd}</td>
                      <td>{asset.apy}</td>
                      <td className="text-right">
                        <Button variant="secondary">Repay</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                Available Borrows
                <BorrowMetrics show={hasSelectedBorrowAssets} />
              </CardTitle>
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
    </main>
  );
}
