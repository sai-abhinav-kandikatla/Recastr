import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-[#232323] bg-[#111111] px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
