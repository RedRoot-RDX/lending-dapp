import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const dummyData = [
  { timestamp: "00:00", price: 100 },
  { timestamp: "04:00", price: 120 },
  { timestamp: "08:00", price: 110 },
  { timestamp: "12:00", price: 130 },
  { timestamp: "16:00", price: 125 },
  { timestamp: "20:00", price: 140 },
  { timestamp: "24:00", price: 135 },
];

interface Asset {
  label: string;
  amount: number;
}

interface CollapsibleContentProps {
  asset: Asset;
}

export function AssetCollapsibleContent({ asset }: CollapsibleContentProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="h-[200px] w-full">
        <ChartContainer config={{}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dummyData}>
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#000000" 
                strokeWidth={1} 
              />
              <Tooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <div className="h-[200px] w-full">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Amount to deposit
          </label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="0.0" 
              className="pr-16"
            />
            <Button 
              variant="ghost" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
              onClick={() => {
                // Handle setting max amount
                // You can set this to asset.amount
              }}
            >
              MAX
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ≈ $0.00 USD
          </p>
        </div>
      </div>
    </div>
  );
} 