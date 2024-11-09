import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AssetName, getAssetIcon, getWalletBalance } from "@/types/asset";

interface Asset {
  label: AssetName;
  address: string;
  wallet_balance: number;
  select_native: number;
  apy: number;
}

interface CollapsibleContentProps {
  asset: Asset;
  onAmountChange: (amount: number) => void;
  onConfirm: () => void;
}

export function AssetCollapsibleContent({ asset, onAmountChange, onConfirm }: CollapsibleContentProps) {
  const [tempAmount, setTempAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset tempAmount when asset changes
  useEffect(() => {
    setTempAmount("");
    setError(null);
  }, [asset.address]);

  const handleAmountChange = (value: string) => {
    setTempAmount(value);
    const amount = parseFloat(value);
    if (isNaN(amount)) {
      setError("Please enter a valid number");
    } else if (amount > getWalletBalance(asset.label)) {
      setError("Amount exceeds wallet balance");
    } else {
      setError(null);
      onAmountChange(amount);
    }
  };

  const handleMaxClick = () => {
    setTempAmount(getWalletBalance(asset.label).toString());
    setError(null);
  };

  const handleConfirm = () => {
    const amount = parseFloat(tempAmount);
    if (!isNaN(amount) && amount > 0) {
      onAmountChange(amount);
      onConfirm();
    }
  };

  return (
    <div className="p-6">
      {/* Asset Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 relative">
          <img
            src={getAssetIcon(asset.label)}
            alt={`${asset.label} icon`}
            className="w-10 h-10 rounded-full"
          />
        </div>
        <span className="text-2xl font-semibold">{asset.label}</span>
      </div>

      {/* Right column - Asset details and input */}
      <div className="space-y-8">
        <div className="space-y-3">
          <span className="text-lg font-semibold block mb-2">Amount</span>
          <div className="space-y-2">
            {/* Input container */}
            <div className="relative">
              <Input
                type="number"
                value={tempAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pr-24 h-12"
                placeholder={asset.label}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMaxClick}
                  className="h-8 px-3 text-sm font-medium hover:bg-transparent"
                >
                  Max
                </Button>
              </div>
            </div>
            
            {/* Value and available balance */}
            <div className="flex justify-between text-sm text-muted-foreground px-1">
              <span>${tempAmount ? Number(tempAmount).toFixed(1) : "0.0"}</span>
              <span>Available {getWalletBalance(asset.label)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 py-2">
          <div className="flex justify-between text-base">
            <span>Borrow APY</span>
            <span>{asset.apy}</span>
          </div>
          <div className="flex justify-between text-base">
            <span>Health Factor</span>
            <span className="text-red-500">-0.5</span>
          </div>
        </div>

        <Button 
          className="w-full h-12 text-base mt-4"
          onClick={handleConfirm}
          disabled={!!error || !tempAmount || parseFloat(tempAmount) <= 0}
        >
          Confirm Amount
        </Button>
      </div>
    </div>
  );
} 