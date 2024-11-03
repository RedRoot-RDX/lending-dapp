import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface SupplyConfirmationProps {
  show: boolean;
}

const SupplyConfirmation = ({ show }: SupplyConfirmationProps) => {
  if (!show) return null;
  
  return (
    <div className={`
      fixed top-0 left-0 h-full w-40 
      bg-white dark:bg-gray-800 
      shadow-lg transform transition-transform duration-300 ease-in-out
      ${show ? 'translate-x-0' : '-translate-x-full'}
      border-r
    `}>
      <div className="p-6 flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-6">Confirm Supply</h2>
        
        <div className="space-y-4 flex-grow">
          <div>
            <div className="text-sm text-gray-600">Net Supply</div>
            <div className="text-xl font-semibold">$0.0</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600">Health Factor</div>
            <div className="flex items-center gap-1">
              <span className="text-red-500 font-medium">1.0</span>
              <ArrowRight size={14} className="text-gray-400" />
              <span className="text-green-500 font-medium">2.0</span>
            </div>
          </div>
        </div>

        <Button className="w-full bg-black text-white hover:bg-gray-800">
          Confirm Supply
        </Button>
      </div>
    </div>
  );
};

export default SupplyConfirmation; 