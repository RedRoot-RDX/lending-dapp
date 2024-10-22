"use client";
/* ------------------ Imports ----------------- */
import { AssetForm } from "@/components/asset-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRadixContext } from "@/contexts/provider";
import { gatewayApi, rdt } from "@/lib/radix";
import { useEffect } from "react";

/* ----------------- Constants ---------------- */

/* ------------------- Page ------------------- */
export default function App() {
  const { accounts } = useRadixContext();

  console.log("env", process.env);

  useEffect(() => {
    console.log("Account", accounts);
    console.log("RDT", rdt);
    console.log("GatewayApi", gatewayApi);
  }, [accounts]);

  return (
    <main className="container py-4 flex-grow">
      {accounts != null && accounts.length > 0 ? accounts[0].address : "none connected"}
      <div className="grid grid-cols-2 gap-4">
        {/* ------------- Collateral Column ------------ */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <div>Card Content</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetForm />
            </CardContent>
          </Card>
        </div>
        {/* --------------- Borrow Column -------------- */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              <div>Card Content</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              <div>Card Content</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
