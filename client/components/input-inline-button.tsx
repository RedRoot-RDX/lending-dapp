import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  buttonText: string;
  onClick: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, buttonText, onClick, ...props }, ref) => {
    return (
      <div className="flex flex-row h-10 w-full pl-2 pr-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background">
        <input
          type={type}
          className={cn(
            "flex-grow h-full bg-background rounded-sm pl-[1px]",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-blue-400/50 focus-visible:ring-offset-[3px] focus:ring-offset-background/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        />
        <div className="h-full w-[1px] mx-2 bg-input rounded-md" />
        <button
          className="rounded-sm font-semibold opacity-85 hover:opacity-100 focus-visible:outline-none"
          onClick={onClick}
        >
          {buttonText}
        </button>
      </div>
    );
  },
);
Input.displayName = "InputInlineButton";

export { Input as InputIB };
