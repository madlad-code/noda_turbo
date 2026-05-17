"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * A simple, production-grade theme toggle button that switches
 * directly between light and dark modes using the `next-themes` library.
 */
export function ThemeToggle() {
  // The useTheme hook provides the current theme and the function to change it.
  const { theme, setTheme } = useTheme();

  // This check ensures the component only renders on the client after mounting,
  // preventing hydration mismatch errors.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a disabled placeholder on the server to prevent layout shift.
    return <Button variant="ghost" size="icon" className="h-9 w-9" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 hover:bg-brand-primary/10"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}