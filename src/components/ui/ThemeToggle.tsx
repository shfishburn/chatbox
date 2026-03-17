"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-neutral-600 dark:text-neutral-400",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
        collapsed && "justify-center w-10 h-10",
      )}
      title="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 shrink-0" />
      )}
      {!collapsed && (
        <span>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
      )}
    </button>
  );
}
