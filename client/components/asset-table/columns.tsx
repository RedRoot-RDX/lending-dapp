"use client";

import React from "react";
import { AssetName } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AssetCollapsibleContent } from "./collapsible-content";
import { ChartContainer } from "@/components/ui/chart";

export type Asset = {
  address: string;
  label: AssetName;
  wallet_balance: number;
  select_native: number;
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
    header: "Selected Amount",
    cell: ({ row }) => {
      const amount = row.getValue("select_native");
      return amount ? Number(amount).toFixed(2) : "0.00";
    }
  },
  {
    accessorKey: "apy",
    header: "APY",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      
      return (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            row.toggleExpanded();
          }}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      );
    },
  },
];