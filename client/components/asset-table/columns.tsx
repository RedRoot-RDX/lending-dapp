"use client";

import { AssetName } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Asset = {
  address: string;
  label: AssetName;
  wallet_balance: number;
  select_native: number;
  select_usd: number;
  apy: string;
};

export const columns: ColumnDef<Asset>[] = [
  {
    id: "select",
    header: "Select assets", // Changed from checkbox to text header
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
];