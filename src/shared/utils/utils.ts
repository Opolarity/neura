import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export all utilities
export * from "./query";
export * from "./date";
export * from "./currency";
export * from "./pagination";
export * from "./hierarchy";
export * from "./api";
