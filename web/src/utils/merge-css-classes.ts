import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple CSS class names into a single string with Tailwind CSS conflict resolution.
 *
 * This utility function combines the functionality of:
 * - clsx: Conditionally constructs className strings from various input types (strings, objects, arrays)
 * - twMerge: Intelligently merges Tailwind CSS classes, removing conflicts (e.g., if both 'p-4' and 'p-2'
 *   are provided, only the last one is kept)
 *
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A single merged className string optimized for Tailwind CSS
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4' (px-2 is overridden)
 * cn('text-black', condition && 'font-bold') // Conditionally adds classes
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
