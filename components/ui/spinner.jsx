import * as React from "react";
import { cn } from "@/lib/utils";

export function Spinner({ size = 32, className, label = "Loading..." }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)} role="status" aria-live="polite">
      <div
        className="animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        style={{ width: size, height: size }}
      />
      {label ? <span className="text-xs text-gray-600">{label}</span> : null}
    </div>
  );
}
