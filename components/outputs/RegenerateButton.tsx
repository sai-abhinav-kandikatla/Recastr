"use client";

import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegenerateButton({
  loading,
  onClick,
}: {
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label="Regenerate" onClick={onClick} disabled={loading}>
      <RefreshCcw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
    </Button>
  );
}
