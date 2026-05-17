"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// FIXED: The ThemeProviderProps type is imported directly from the package.
import { type ThemeProviderProps } from "next-themes";

/**
 * A wrapper around the `next-themes` ThemeProvider.
 * This client component provides theme management capabilities (light/dark mode)
 * to the entire application. It's applied in the root layout.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
