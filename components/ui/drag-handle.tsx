import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function DragHandle({ className }: { className?: string }) {
  return (
    <span
      aria-label="Drag to reorder"
      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground", className)}
      role="button"
      tabIndex={0}
    >
      <GripVertical className="h-4 w-4" />
    </span>
  );
}
