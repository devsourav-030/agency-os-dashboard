"use client";

import { format } from "date-fns";

export default function Topbar() {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header
      id="topbar"
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-dim)] px-6"
      style={{ backgroundColor: "var(--surface)" }}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
          Agency OS
        </h1>
        <span className="hidden sm:inline-block text-xs text-[var(--text-muted)]">
          |
        </span>
        <span className="hidden sm:inline-block text-xs text-[var(--text-secondary)]">
          {today}
        </span>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            All systems online
          </span>
        </div>
      </div>
    </header>
  );
}
