"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asset</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Effect on health</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Asset rows */}
                            {[
                                { color: 'bg-green-400', symbol: 'XRD', amount: 123.00123123123, health: 0.401 },
                                { color: 'bg-red-400', symbol: 'MEME', amount: 99.00123123123, health: 0.231 },
                                { color: 'bg-orange-400', symbol: 'USDT', amount: 5.00123123123, health: 0.123 }
                            ].map((asset) => (
                                <TableRow key={asset.symbol}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full ${asset.color}`} />
                                            <span className="font-semibold">{asset.symbol}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold">${asset.amount}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-red-500 font-medium">
                                        {asset.health}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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