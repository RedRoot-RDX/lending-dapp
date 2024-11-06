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
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <Input 
            type="number" 
            placeholder="0.0"
            className="bg-transparent border-none flex-1"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Wallet balance 0.0</span>
            <Button variant="ghost" size="sm" className="font-medium">
              Max
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 