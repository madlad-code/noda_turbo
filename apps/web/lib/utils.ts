import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to be a valid HTML ID.
 * Replaces spaces and invalid characters with a hyphen.
 * @param input The string to sanitize.
 * @returns A URL-friendly and HTML-ID-safe string.
 */
export function sanitizeForId(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^a-z0-9-]/g, ''); // Remove all non-alphanumeric characters except hyphens
}
