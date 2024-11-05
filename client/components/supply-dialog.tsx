"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';

interface SupplyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const SupplyDialog: React.FC<SupplyDialogProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Preview Supply</DialogTitle>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-500">Total Supply</div>
                            <div className="text-xl font-semibold">$0.0</div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-sm text-gray-500">Total Health Factor</div>
                            <div className="flex items-center gap-2">
                                <div className="text-red-500 font-semibold">1.0</div>
                                <ArrowRight className="w-6 h-6" />
                                <div className="text-green-500 font-semibold">2.0</div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-6">
                    <div className="grid grid-cols-3 gap-4 mb-2 text-sm text-gray-500">
                        <div>Asset</div>
                        <div>Amount</div>
                        <div className="text-right">Effect on health</div>
                    </div>

                    {/* Asset rows */}
                    {[
                        { color: 'bg-green-400', symbol: 'XRD', health: 0.4 },
                        { color: 'bg-red-400', symbol: 'MEME', health: 0.4 },
                        { color: 'bg-orange-400', symbol: 'USDT', health: 0.4 }
                    ].map((asset) => (
                        <div key={asset.symbol} className="grid grid-cols-3 gap-4 items-center py-3 border-t">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full ${asset.color}`} />
                                <span className="font-semibold">{asset.symbol}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="relative">
                                    <Input
                                        placeholder="0.0"
                                        className="pl-2"
                                    />
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>$23.5152</span>
                                    <Button variant="ghost" size="sm" className="h-auto p-0">Max</Button>
                                </div>
                            </div>

                            <div className="text-right text-red-500 font-medium">
                                {asset.health}
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-6">
                    <Button
                        onClick={onConfirm}
                        className="w-full bg-black text-white hover:bg-gray-800"
                    >
                        Confirm Supply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SupplyDialog;