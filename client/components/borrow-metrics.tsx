import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowRight } from 'lucide-react';

interface BorrowMetricsProps {
  show: boolean;
}

const BorrowMetrics = ({ show }: BorrowMetricsProps) => {
  if (!show) return null;
  
  return (
    <div className="flex items-center w-full justify-center gap-8">
      <div className="flex justify-center h-12 relative">
        <div className="relative h-full flex items-center">
          <ArrowUp
            size={48}
            className="absolute text-gray-400 animate-bounce"
            style={{ animationDelay: '400ms' }}
          />
        </div>
      </div>
      <Card className="bg-gray-100 w-1/2 max-w-md">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-600">Net Debt</div>
              <div className="text-lg font-semibold">$0.0</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600">Health Factor</div>
              <div className="flex items-center gap-1">
                <span className="text-green-500 font-medium">2.0</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-red-500 font-medium">1.0</span>
              </div>
            </div>
          </div>
          <Button className="w-full bg-black text-white hover:bg-gray-800 h-8 text-sm">
            Confirm Borrow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BorrowMetrics; 