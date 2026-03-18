"use client";

import { Menu, MessageSquare } from "lucide-react";
import { useSidebarStore } from "@/components/layout/sidebarStore";

export default function MobileHeader() {
  const { open, setOpen } = useSidebarStore();

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-foreground text-sm">ChatBox</span>
      </div>
    </header>
  );
}
