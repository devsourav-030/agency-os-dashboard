"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Send,
  FileText,
  FolderKanban,
  DollarSign,
  Bot,
  MessageCircle,
  Palette,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Mission Control", href: "/", icon: LayoutDashboard },
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Outreach", href: "/outreach", icon: Send },
  { label: "Proposals", href: "/proposals", icon: FileText },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Finance", href: "/finance", icon: DollarSign },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Arjun Chat", href: "/chat", icon: MessageCircle },
  { label: "Brand Studio", href: "/brand", icon: Palette },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      id="sidebar"
      className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-[var(--border-dim)]"
      style={{ backgroundColor: "var(--navy)" }}
    >
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-[var(--border-dim)]">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--blue), #3B82F6)" }}
        >
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
            Swarg
          </p>
          <p className="text-[10px] text-[var(--text-muted)] leading-tight tracking-wider uppercase">
            Agency OS
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${href === "/" ? "home" : href.slice(1)}`}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                active
                  ? "bg-[var(--accent-glow)] text-white font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              {/* Active indicator: blue left border */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full"
                  style={{ backgroundColor: "var(--blue)" }}
                />
              )}
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-[var(--blue)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-[var(--border-dim)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--text-secondary)]">
            S
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--text-primary)]">
              Sourav
            </p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">
              Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
