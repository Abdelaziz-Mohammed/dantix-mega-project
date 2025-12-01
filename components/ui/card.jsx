import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("mb-6 text-center", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return (
    <h1
      className={cn(
        "text-2xl font-semibold tracking-tight text-black",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p className={cn("mt-1 text-sm text-gray-600", className)} {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return <div className={cn("mt-6", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardFooter };
