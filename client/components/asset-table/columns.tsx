"use client";

import React from "react";
import { AssetName, getAssetIcon } from "@/types/asset";
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
        onCheckedChange={(checked) => {
          row.toggleSelected(!!checked);
        }}
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
      const iconUrl = getAssetIcon(row.getValue("label") as AssetName);
      return (
        <div className="flex items-center gap-2">
          <img src={iconUrl} className="w-6 h-6 rounded-full" alt="" />
          <span>{row.getValue("label")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "wallet_balance",
    header: "Wallet Balance",
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      return isExpanded ? null : row.getValue("wallet_balance");
    },
  },
  {
    accessorKey: "select_native",
    header: "Selected Amount",
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      const isSelected = row.getIsSelected();
      if (isExpanded) return null;
      return (
        <div>
          {isSelected && row.original.select_native > 0 ? row.original.select_native : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "apy",
    header: "APY",
    cell: ({ row }) => {
      const apy = row.getValue("apy");
      return `${apy}%`;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      return (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => row.toggleExpanded()}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      );
    },
  },
];