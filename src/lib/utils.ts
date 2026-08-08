import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// standard shadcn cn() — merges conditional classNames, then resolves
// conflicting tailwind utilities (e.g. a later "p-4" wins over an earlier "p-2")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
