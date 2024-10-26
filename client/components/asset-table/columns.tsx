"use client";

import { AssetName } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Asset = {
  address: string;
  label: AssetName;
  wallet_balance: number;
  select_native: number;
  select_usd: number;
  apy: string;
  whitespace: string;
};

export const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: "label",
    header: "Assets",
  },
  {
    accessorKey: "wallet_balance",
    header: "Wallet Balance",
  },
  {
    accessorKey: "select_native",
    header: "Selected (Native)",
  },
  {
    accessorKey: "select_usd",
    header: "Selected (USD)",
  },
  {
    accessorKey: "apy",
    header: "APY",
  },
  {
    accessorKey: "whitespace",
    header: () => <div className="w-32 h-10 bg-red-500"></div>,
    cell: ({ row }) => {
      return <div className="w-32 h-10 bg-blue-500"></div>;
    },
  },
];
