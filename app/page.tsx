"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { api } from "@/lib/api";
import { useRealtimeTable } from "@/lib/supabase";
import { formatDistanceToNow, isToday, startOfMonth, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  UserPlus,
  Send,
  FileText,
  FolderKanban,
  IndianRupee,
  Clock,
  SendHorizontal,
  Bot,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface Lead {
  id: string;
  status: string;
  created_at: string;
}

interface OutreachEntry {
  id: string;
  created_at: string;
}

interface Invoice {
  id: string;
  status: string;
  amount: number;
  paid_at?: string;
  created_at: string;
}

interface Project {
  id: string;
  status: string;
}

interface AgentLog {
  id: string;
  agent: string;
  action: string;
  created_at: string;
}

/* ──────────────────────────────────────────────
   Agent colour map
   ────────────────────────────────────────────── */

const AGENT_COLORS: Record<string, string> = {
  saraswati: "#14B8A6",
  chanakya: "#1A56DB",
  vishwakarma: "#F97316",
  lakshmi: "#10B981",
  vyasa: "#8B5CF6",
  arjun: "#F59E0B",
};

/* ──────────────────────────────────────────────
   Skeleton component
   ────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 ${className}`}
    />
  );
}

/* ──────────────────────────────────────────────
   KPI Card
   ────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  loading: boolean;
}) {
  return (
    <div
      id={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--border-dim)] p-5 transition-all duration-200 hover:border-[var(--border-subtle)] hover:shadow-lg hover:shadow-black/20"
      style={{ backgroundColor: "#111827" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <span className="text-3xl font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
          {value}
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Dark chart tooltip
   ────────────────────────────────────────────── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs shadow-xl" style={{ backgroundColor: "#1F2937" }}>
      <p className="font-medium text-[var(--text-primary)]">{label}</p>
      <p className="text-[var(--text-secondary)] tabular-nums">
        {typeof payload[0].value === "number" && payload[0].value > 999
          ? `₹${payload[0].value.toLocaleString("en-IN")}`
          : payload[0].value}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main: Mission Control
   ────────────────────────────────────────────── */

const LEAD_STAGES = ["new", "contacted", "replied", "demo", "proposal", "closed"] as const;

export default function MissionControl() {
  /* ── Data state ── */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [outreachData, setOutreachData] = useState<OutreachEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /* Chat state */
  const [chatMsg, setChatMsg] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  /* Realtime agent logs */
  const { data: agentLogs, loading: logsLoading } =
    useRealtimeTable<AgentLog>("agent_logs");

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async () => {
    try {
      const [leadsRes, invoicesRes, projectsRes, outreachRes] =
        await Promise.allSettled([
          api.leads.list() as Promise<Lead[]>,
          api.invoices.list() as Promise<Invoice[]>,
          api.projects.list() as Promise<Project[]>,
          api.outreach.list() as Promise<OutreachEntry[]>,
        ]);

      if (leadsRes.status === "fulfilled") setLeads(leadsRes.value);
      if (invoicesRes.status === "fulfilled") setInvoices(invoicesRes.value);
      if (projectsRes.status === "fulfilled") setProjects(projectsRes.value);
      if (outreachRes.status === "fulfilled") setOutreachData(outreachRes.value);
    } catch {
      /* silently fail — KPIs show 0 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  /* ── Computed KPIs ── */
  const newLeadsToday = leads.filter(
    (l) => l.status === "new" && safeIsToday(l.created_at)
  ).length;

  const outreachToday = outreachData.filter((o) =>
    safeIsToday(o.created_at)
  ).length;

  const openProposals = leads.filter((l) => l.status === "proposal").length;

  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "in_progress"
  ).length;

  const thisMonthStart = startOfMonth(new Date());
  const revenueThisMonth = invoices
    .filter((inv) => {
      if (inv.status !== "paid") return false;
      const d = safeParseDate(inv.paid_at || inv.created_at);
      return d && d >= thisMonthStart;
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "sent"
  ).length;

  /* ── Chart data: Lead Pipeline ── */
  const pipelineData = LEAD_STAGES.map((stage) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: leads.filter((l) => l.status === stage).length,
  }));

  /* ── Chart data: Revenue Trend (last 30 days) ── */
  const revenueTrend = buildRevenueTrend(invoices);

  /* ── Chat handler ── */
  async function handleChat(e: FormEvent) {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    setChatLoading(true);
    setChatReply("");
    try {
      const { reply } = await api.chat.send(chatMsg.trim());
      setChatReply(reply);
      setChatMsg("");
    } catch (err: unknown) {
      setChatReply(
        `Error: ${err instanceof Error ? err.message : "Could not reach Arjun"}`
      );
    } finally {
      setChatLoading(false);
    }
  }

  /* ── Render ── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
          Mission Control
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Live overview of leads, projects, revenue & agent activity
        </p>
      </div>

      {/* ══════════════════════════════════════════
          Section 1 — KPI cards
          ══════════════════════════════════════════ */}
      <div
        id="kpi-grid"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <KpiCard
          label="New Leads Today"
          value={newLeadsToday}
          icon={UserPlus}
          iconColor="#3B82F6"
          loading={loading}
        />
        <KpiCard
          label="Outreach Sent Today"
          value={outreachToday}
          icon={Send}
          iconColor="#10B981"
          loading={loading}
        />
        <KpiCard
          label="Open Proposals"
          value={openProposals}
          icon={FileText}
          iconColor="#8B5CF6"
          loading={loading}
        />
        <KpiCard
          label="Active Projects"
          value={activeProjects}
          icon={FolderKanban}
          iconColor="#F59E0B"
          loading={loading}
        />
        <KpiCard
          label="Revenue This Month"
          value={formatINR(revenueThisMonth)}
          icon={IndianRupee}
          iconColor="#10B981"
          loading={loading}
        />
        <KpiCard
          label="Pending Invoices"
          value={pendingInvoices}
          icon={Clock}
          iconColor="#EF4444"
          loading={loading}
        />
      </div>

      {/* ══════════════════════════════════════════
          Section 2 — Charts + Activity feed
          ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
        {/* ── Charts column (70%) ── */}
        <div className="xl:col-span-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Lead Pipeline — Horizontal Bar */}
          <div
            id="chart-pipeline"
            className="rounded-xl border border-[var(--border-dim)] p-5"
            style={{ backgroundColor: "#111827" }}
          >
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
              Lead Pipeline
            </h2>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={pipelineData}
                  layout="vertical"
                  margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#1A56DB"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue Trend — Line */}
          <div
            id="chart-revenue"
            className="rounded-xl border border-[var(--border-dim)] p-5"
            style={{ backgroundColor: "#111827" }}
          >
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
              Revenue Trend
              <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                Last 30 days
              </span>
            </h2>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart
                  data={revenueTrend}
                  margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#1A56DB"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#1A56DB" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Activity feed column (30%) ── */}
        <div
          id="activity-feed"
          className="xl:col-span-3 rounded-xl border border-[var(--border-dim)] p-5 flex flex-col"
          style={{ backgroundColor: "#111827" }}
        >
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
            Agent Activity
          </h2>

          <div className="flex-1 overflow-y-auto max-h-[340px] space-y-1 pr-1">
            {logsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="mb-2 h-12 w-full" />
              ))
            ) : agentLogs.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                No agent activity yet
              </p>
            ) : (
              agentLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  {/* Coloured dot */}
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        AGENT_COLORS[log.agent?.toLowerCase()] ?? "#6B7280",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] leading-snug">
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            AGENT_COLORS[log.agent?.toLowerCase()] ?? "#9CA3AF",
                        }}
                      >
                        {log.agent}
                      </span>{" "}
                      {log.action}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      {safeTimeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Section 3 — Quick Arjun chat
          ══════════════════════════════════════════ */}
      <div
        id="arjun-chat"
        className="rounded-xl border border-[var(--border-dim)] p-5"
        style={{ backgroundColor: "#111827" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Bot size={18} className="text-[#F59E0B]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Ask Arjun
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            — your AI co‑founder
          </span>
        </div>

        <form onSubmit={handleChat} className="flex gap-3">
          <input
            id="arjun-input"
            type="text"
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            placeholder="Ask anything about the agency..."
            suppressHydrationWarning
            className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--navy)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)]"
          />
          <button
            id="arjun-send"
            type="submit"
            disabled={chatLoading || !chatMsg.trim()}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--blue)" }}
          >
            <SendHorizontal size={15} />
            {chatLoading ? "Thinking..." : "Send"}
          </button>
        </form>

        {chatReply && (
          <div className="mt-4 animate-fade-in rounded-lg border border-[var(--border-dim)] bg-[var(--navy)] p-4">
            <p className="text-xs font-medium text-[#F59E0B] mb-1.5">
              Arjun
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
              {chatReply}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function safeParseDate(d: string | undefined | null): Date | null {
  if (!d) return null;
  try {
    return parseISO(d);
  } catch {
    return null;
  }
}

function safeIsToday(d: string | undefined | null): boolean {
  const parsed = safeParseDate(d);
  return parsed ? isToday(parsed) : false;
}

function safeTimeAgo(d: string | undefined | null): string {
  const parsed = safeParseDate(d);
  if (!parsed) return "";
  try {
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return "";
  }
}

function formatINR(amount: number): string {
  if (amount === 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function buildRevenueTrend(invoices: Invoice[]) {
  const now = new Date();
  const days: Record<string, number> = {};

  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    days[key] = 0;
  }

  // Sum paid invoices
  invoices
    .filter((inv) => inv.status === "paid")
    .forEach((inv) => {
      const d = safeParseDate(inv.paid_at || inv.created_at);
      if (!d) return;
      const diff = Math.floor(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff >= 0 && diff < 30) {
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (key in days) days[key] += inv.amount || 0;
      }
    });

  return Object.entries(days).map(([date, amount]) => ({ date, amount }));
}
