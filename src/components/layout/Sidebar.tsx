"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { ChatSession } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSidebarStore } from "@/components/layout/sidebarStore";
import {
  MessageSquare,
  Plus,
  Trash2,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  user: User;
  initialSessions: ChatSession[];
  mobile?: boolean;
}

export default function Sidebar({
  user,
  initialSessions,
  mobile = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessions, setSessionsOptimistic] = useOptimistic(initialSessions);
  const [collapsed, setCollapsed] = useState(false);
  const [, startTransition] = useTransition();
  const { open: mobileOpen, setOpen: setMobileOpen } = useSidebarStore();

  // On mobile, nav links close the drawer
  function handleNavClick() {
    if (mobile) setMobileOpen(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      setSessionsOptimistic((prev) => prev.filter((s) => s.id !== id));
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Refresh to re-sync state
        router.refresh();
        return;
      }
      if (pathname === `/chat/${id}`) {
        router.push("/chat");
      }
    });
  }

  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground">ChatBox</span>
        )}
      </div>

      {/* New Chat */}
      <div className={cn("px-2 py-2", collapsed && "flex justify-center")}>
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
            collapsed && "justify-center w-10 h-10",
          )}
          title="New Chat"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </Link>
      </div>

      {/* Sessions list */}
      {!collapsed && (
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-xs text-neutral-400 px-2 py-4 text-center">
              No conversations yet
            </p>
          )}
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/chat/${session.id}`}
              className={cn(
                "group flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors",
                activeId === session.id
                  ? "bg-neutral-100 dark:bg-neutral-800 text-foreground"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
              )}
            >
              <span className="truncate flex-1 min-w-0">{session.title}</span>
              <button
                onClick={(e) => handleDelete(session.id, e)}
                className={cn(
                  "ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500",
                )}
                title="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Link>
          ))}
        </nav>
      )}

      {collapsed && <div className="flex-1" />}

      {/* Footer */}
      <div
        className={cn(
          "border-t border-neutral-200 dark:border-neutral-800 px-2 py-3 space-y-1",
          collapsed && "flex flex-col items-center",
        )}
      >
        <ThemeToggle collapsed={collapsed} />
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-500 truncate">
            <span className="truncate">{user.email}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-neutral-600 dark:text-neutral-400",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
            collapsed && "justify-center w-10 h-10",
          )}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 z-10",
          "w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
          "flex items-center justify-center shadow-sm text-neutral-500",
          "hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors",
        )}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
