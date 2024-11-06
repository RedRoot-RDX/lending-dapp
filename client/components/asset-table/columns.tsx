"use client";

import React from "react";
import { AssetName } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/types/asset";

export const columns: ColumnDef<Asset, unknown>[] = [
  {
    id: "select",
    header: "Select assets",
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
    cell: ({ row }) => {
      // Define color mapping for different assets
      const colorMap: Record<AssetName, string> = {
        XRD: "bg-blue-500",
        USDT: "bg-green-500",
        USDC: "bg-green-500",
        DAI: "bg-green-500",
        HUG: "bg-purple-500",
        // Add more assets and their colors as needed
      };

      return (
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${colorMap[row.getValue("label") as AssetName] || "bg-gray-400"}`} />
          <span>{row.getValue("label")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "wallet_balance",
    header: "Wallet Balance",
  },
  {
    accessorKey: "select_native",
    header: "Selected Amount",
    cell: ({ row }) => (
      <div>
        {row.original.select_native > 0 ? row.original.select_native : "-"}
      </div>
    ),
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