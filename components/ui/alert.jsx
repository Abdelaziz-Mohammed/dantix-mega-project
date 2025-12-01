import * as React from "react";
import { cn } from "@/lib/utils";

function Alert({ className, variant = "default", ...props }) {
  const base =
    "w-full rounded-md border px-4 py-3 text-sm flex items-start gap-2";
  const variants = {
    default: "bg-gray-50 border-gray-200 text-gray-800",
    success: "bg-green-50 border-green-200 text-green-800",
    destructive: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div
      role="alert"
      className={cn(base, variants[variant] || variants.default, className)}
      {...props}
    />
  );
}

export { Alert };
