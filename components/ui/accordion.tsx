"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const AccordionContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

export function Accordion({
  children,
  className,
  type = "single",
  collapsible = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  type?: "single";
  collapsible?: boolean;
}) {
  const [value, setValue] = React.useState<string>("");

  const onValueChange = React.useCallback((val: string) => {
    setValue((prev) => (prev === val && collapsible ? "" : val));
  }, [collapsible]);

  return (
    <AccordionContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<{
  value: string;
}>({ value: "" });

export function AccordionItem({
  children,
  className,
  value,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  value: string;
}) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("border-b border-[#232323] py-2", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { value, onValueChange } = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);
  const isOpen = value === item.value;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium text-white transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      onClick={() => onValueChange?.(item.value)}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200" />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { value } = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);
  const isOpen = value === item.value;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "pb-4 pt-0 text-sm text-[#8A8A8A] transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
