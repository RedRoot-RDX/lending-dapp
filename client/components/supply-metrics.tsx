import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUp } from 'lucide-react';

const SupplyMetrics = () => {
  return (
    <div className="flex items-center w-full justify-center gap-16">
      <div className="flex justify-center my-2 h-16 relative">
        <div className="relative h-full flex items-center">
          <ArrowUp
            size={64}
            className="absolute text-gray-400 animate-bounce"
            style={{ animationDelay: '400ms' }}
          />
        </div>
      </div>
      <Card className="bg-gray-100 w-1/2 max-w-md">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">Net Supply</div>
              <div className="text-xl font-semibold">$0.0</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Health Factor</div>
              <div className="flex items-center gap-1">
                <span className="text-red-500 font-medium">1.0</span>
                <ArrowRight size={16} className="text-gray-400" />
                <span className="text-green-500 font-medium">2.0</span>
              </div>
            </div>
          </div>
          <Button className="w-full bg-black text-white hover:bg-gray-800">
            Confirm Supply
          </Button>
        </CardContent>
      </Card>
    </div >
  );
};

export default SupplyMetrics;