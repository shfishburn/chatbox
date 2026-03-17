"use client";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/components/layout/sidebarStore";

export default function MobileSidebarBackdrop() {
  const { open, setOpen } = useSidebarStore();

  return (
    <button
      aria-label="Close menu"
      onClick={() => setOpen(false)}
      className={cn(
        "fixed inset-0 z-30 bg-black/30 transition-opacity",
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      )}
    />
  );
}
