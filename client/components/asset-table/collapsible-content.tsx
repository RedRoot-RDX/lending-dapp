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
  onAmountChange: (amount: number) => void;
  onConfirm: () => void;
}

export function AssetCollapsibleContent({ asset, onAmountChange, onConfirm }: CollapsibleContentProps) {
  const [tempAmount, setTempAmount] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const handleAmountChange = (value: string) => {
    setTempAmount(value);
    if (error) setError("");
  };

  const handleMaxClick = () => {
    const maxAmount = asset.wallet_balance.toString();
    setTempAmount(maxAmount);
    setError("");
  };

  const handleConfirm = () => {
    const numericValue = parseFloat(tempAmount) || 0;
    
    if (numericValue <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (numericValue > asset.wallet_balance) {
      setError("Amount cannot exceed wallet balance");
      return;
    }

    onAmountChange(numericValue);
    onConfirm();
    setTempAmount("");
    setError("");
  };

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
              className={`pr-16 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={tempAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min={0}
              max={asset.wallet_balance}
            />
            <Button 
              variant="ghost" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
              onClick={handleMaxClick}
            >
              MAX
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium">
              {error}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            ≈ ${(parseFloat(tempAmount) || 0).toFixed(2)} USD
          </p>
          <Button 
            onClick={handleConfirm}
            className="w-full"
            disabled={!!error || !tempAmount || parseFloat(tempAmount) <= 0}
          >
            Confirm Amount
          </Button>
        </div>
      </div>
    </div>
  );
} 