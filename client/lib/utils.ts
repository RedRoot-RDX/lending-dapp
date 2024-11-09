/* ------------------ Imports ----------------- */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* ----------------- Functions ---------------- */
export declare function reverse<T extends Record<PropertyKey, PropertyKey>>(obj: T): Reverse<T>;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----------------- Constants ---------------- */
// Util types
type Reverse<T extends Record<PropertyKey, PropertyKey>> = {
  [P in keyof T as T[P]]: P;
};

// Radix Addresses
export const componentAddress: string = process.env.NEXT_PUBLIC_COMPONENT_ADDR || "";
export const definitionAddress: string = process.env.NEXT_PUBLIC_DAPP_DEFINITION_ADDR || "";
export const borrowerBadge_Resource: string = process.env.NEXT_PUBLIC_BORROWER_BADGE_ADDR || "";