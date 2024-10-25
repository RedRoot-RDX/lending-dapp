"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface IComboBox {
  value: string;
  onValueChange: (arg0: string) => void;
  selection: { value: string; label: string }[];
  selectLabel: string;
  searchLabel: string;
  invalidSearchLabel: string;
}

export function Comobobox({
  value,
  onValueChange,
  selection,
  searchLabel,
  selectLabel,
  invalidSearchLabel,
}: IComboBox) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {value ? selection.find((_obj) => _obj.value === value)?.label : selectLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchLabel} />
          <CommandList>
            <CommandEmpty>{invalidSearchLabel}</CommandEmpty>
            <CommandGroup>
              {selection.map((_obj) => (
                <CommandItem
                  key={_obj.value}
                  value={_obj.value}
                  onSelect={(currentValue) => {
                    // setValue(currentValue === value ? "" : currentValue);
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === _obj.value ? "opacity-100" : "opacity-0")} />
                  {_obj.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
