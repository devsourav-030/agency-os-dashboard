"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useRealtimeTable } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Brain,
  Search,
  PenTool,
  Settings,
  Coins,
  PenSquare,
  ChevronDown,
  ChevronUp,
  Play,
  Copy,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDistanceToNow, differenceInHours } from "date-fns";

const AGENTS = [
  {
    id: "arjun",
    name: "Arjun",
    emoji: "🧠",
    role: "Agency Mastermind",
    icon: Brain,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "saraswati",
    name: "Saraswati",
    emoji: "🔍",
    role: "Lead Researcher",
    icon: Search,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    id: "chanakya",
    name: "Chanakya",
    emoji: "📝",
    role: "Outreach Strategist",
    icon: PenTool,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "vishwakarma",
    name: "Vishwakarma",
    emoji: "⚙️",
    role: "Demo Engineer",
    icon: Settings,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "lakshmi",
    name: "Lakshmi",
    emoji: "💰",
    role: "Finance Director",
    icon: Coins,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "vyasa",
    name: "Vyasa",
    emoji: "✍️",
    role: "Content Creator",
    icon: PenSquare,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

interface AgentStatus {
  last_run: string | null;
  last_action: string | null;
}

interface AgentLog {
  id: string;
  agent: string;
  action: string;
  created_at: string;
}

export default function AgentsCommandCentre() {
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({});
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [running, setRunning] = useState<Record<string, boolean>>({});

  const { data: rawLogs } = useRealtimeTable<AgentLog>("agent_logs");
  const agentLogs = Array.isArray(rawLogs) ? rawLogs : [];

  // Saraswati Form
  const [market, setMarket] = useState("India");
  const [maxResults, setMaxResults] = useState(20);

  // Chanakya Form
  const [limit, setLimit] = useState(20);
  const [minScore, setMinScore] = useState(65);

  // Vishwakarma Form
  const [industry, setIndustry] = useState("");
  const [clientName, setClientName] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  // Vyasa Form
  const [topic, setTopic] = useState("");
  const [recentWork, setRecentWork] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");

  // Arjun & Lakshmi Form
  const [briefing, setBriefing] = useState("");
  const [financeSummary, setFinanceSummary] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);

  const fetchStatus = async () => {
    try {
      const res: any = await api.agents.status();
      setStatuses(res || {});
    } catch (e) {
      console.warn("Could not fetch agent status. Is the backend running?", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 60000);
    return () => clearInterval(iv);
  }, []);

  const getStatusDot = (lastRun: string | null) => {
    if (!lastRun) return "bg-zinc-600 shadow-[0_0_8px_rgba(82,82,91,0.5)]";
    const hrs = differenceInHours(new Date(), new Date(lastRun));
    if (hrs < 1) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]";
    if (hrs < 24) return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]";
    return "bg-zinc-600 shadow-[0_0_8px_rgba(82,82,91,0.5)]";
  };

  const handleRun = async (agentId: string, fn: () => Promise<any>) => {
    setRunning((prev) => ({ ...prev, [agentId]: true }));
    const t = toast.loading(`${AGENTS.find((a) => a.id === agentId)?.name} is running...`);
    try {
      const result = await fn();
      toast.success(`${AGENTS.find((a) => a.id === agentId)?.name} completed task!`, { id: t });
      fetchStatus();
      return result;
    } catch (error: any) {
      toast.error(error.message || `Task failed for ${agentId}`, { id: t });
      return null;
    } finally {
      setRunning((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const renderInlinePanel = (agentId: string) => {
    const isRunning = running[agentId];

    switch (agentId) {
      case "saraswati":
        return (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Market</label>
                <Select value={market} onValueChange={(v) => setMarket(v as string)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">
                  Max Results ({maxResults})
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
              </div>
            </div>
            <Button
              disabled={isRunning}
              onClick={() => handleRun("saraswati", () => api.agents.scrape(market.toLowerCase(), maxResults))}
              className="w-full bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 border border-teal-500/30 transition-all font-semibold"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {isRunning ? "Scraping..." : "Launch Search"}
            </Button>
          </div>
        );

      case "chanakya":
        return (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Batch Limit ({limit})</label>
                <div className="flex items-center h-10">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Min Score ({minScore})</label>
                <div className="flex items-center h-10">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
            <Button
              disabled={isRunning}
              onClick={() => handleRun("chanakya", () => api.agents.outreach(limit, minScore))}
              className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30 transition-all font-semibold"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {isRunning ? "Drafting..." : "Run Outreach Batch"}
            </Button>
          </div>
        );

      case "vishwakarma":
        return (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Client Name</label>
                <Input
                  placeholder="Acme Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Industry</label>
                <Input
                  placeholder="SaaS / Real Estate"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <Button
              disabled={isRunning || !clientName || !industry}
              onClick={async () => {
                const res = await handleRun("vishwakarma", () => api.agents.demo(industry, clientName));
                if (res?.vercel_url || res?.url) setDemoUrl(res.vercel_url || res.url);
              }}
              className="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/30 transition-all font-semibold"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {isRunning ? "Building Demo..." : "Build Demo Instance"}
            </Button>
            {demoUrl && (
              <div className="flex items-center gap-2 p-3 mt-3 bg-orange-500/5 border border-orange-500/20 rounded-md">
                <ExternalLink className="w-4 h-4 text-orange-400" />
                <a href={demoUrl} target="_blank" rel="noreferrer" className="text-sm text-orange-400 hover:underline truncate">
                  {demoUrl}
                </a>
              </div>
            )}
          </div>
        );

      case "lakshmi":
        return (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
             <Button
              disabled={isRunning}
              onClick={async () => {
                const res = await handleRun("lakshmi", () => api.agents.finance());
                if (res) {
                  setFinanceSummary(res);
                  setModalContent({
                    title: "Lakshmi Finance Report",
                    content: <pre className="whitespace-pre-wrap text-sm text-emerald-400 font-mono">{JSON.stringify(res, null, 2)}</pre>,
                  });
                  setIsModalOpen(true);
                }
              }}
              className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all font-semibold"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {isRunning ? "Analyzing..." : "Run Global Finance Check"}
            </Button>
          </div>
        );

      case "vyasa":
        return (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted">Content Topic</label>
              <Input
                placeholder="The Future of AI in Real Estate"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted">Recent Work Context (Optional)</label>
              <Textarea
                placeholder="We just launched a 3D visualizer feature..."
                value={recentWork}
                onChange={(e) => setRecentWork(e.target.value)}
                className="bg-background border-border min-h-[60px]"
              />
            </div>
            <Button
              disabled={isRunning || !topic}
              onClick={async () => {
                const res = await handleRun("vyasa", () => api.agents.post(topic, recentWork));
                if (res?.post) setGeneratedPost(res.post);
              }}
              className="w-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/30 transition-all font-semibold"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {isRunning ? "Writing..." : "Generate LinkedIn Post"}
            </Button>
            {generatedPost && (
              <div className="relative mt-3">
                <Textarea 
                  value={generatedPost} 
                  readOnly 
                  className="bg-purple-500/5 text-sm p-4 h-[150px] border-purple-500/30 text-purple-200"
                />
                <Button 
                  size="icon-sm"
                  variant="ghost" 
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPost);
                    toast.success("Post copied!");
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case "arjun":
        return (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            <p className="text-sm text-text-muted">
              Sends an immediate end-of-day digest to your configured Slack/Discord or email summarizing all agency activity.
            </p>
             <Button
              disabled={isRunning}
              onClick={async () => {
                const res = await handleRun("arjun", () => api.chat.briefing());
                if (res?.briefing) {
                  setBriefing(res.briefing);
                  setModalContent({
                    title: "Arjun Briefing Report",
                    content: <div className="text-amber-100/90 whitespace-pre-wrap text-sm leading-relaxed">{res.briefing}</div>,
                  });
                  setIsModalOpen(true);
                }
              }}
              className="w-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 transition-all font-semibold"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {isRunning ? "Compiling Brief..." : "Send End-of-Day Briefing"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 md:px-6 py-6 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Agent Command Centre
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Monitor, coordinate, and command your AI workforce.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {AGENTS.map((agent) => {
          const status = statuses[agent.id] || { last_run: null, last_action: null };
          const isExpanded = expandedAgent === agent.id;
          
          return (
            <div
              key={agent.id}
              className={cn(
                "bg-surface border rounded-xl p-5 transition-all duration-300",
                isExpanded ? `border-${agent.color.split("-")[1]}-500/50 shadow-md` : "border-border hover:border-border-subtle"
              )}
            >
              <div 
                className="flex items-start justify-between cursor-pointer group"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-2xl", agent.bg)}>
                    {agent.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary flex items-center gap-2">
                      {agent.name}
                      <span className={cn("inline-block w-2.5 h-2.5 rounded-full", getStatusDot(status.last_run))} />
                    </h3>
                    <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                      {agent.role}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" className="opacity-60 group-hover:opacity-100">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="bg-surface-active/30 p-2.5 rounded-md border border-border">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Last Run</span>
                  <div className="text-text-primary">
                    {status.last_run ? formatDistanceToNow(new Date(status.last_run), { addSuffix: true }) : "Never"}
                  </div>
                </div>
                <div className="bg-surface-active/30 p-2.5 rounded-md border border-border">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Last Action</span>
                  <div className="text-text-primary truncate" title={status.last_action || "Idle"}>
                    {status.last_action || "Idle"}
                  </div>
                </div>
              </div>

              {isExpanded && renderInlinePanel(agent.id)}
            </div>
          );
        })}
      </div>

      <div className="bg-surface border border-border rounded-xl p-0 overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-border bg-surface-hover/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            Activity Terminal
          </h2>
        </div>
        
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <div className="bg-[#111827] border-b border-white/5 overflow-x-auto">
            <TabsList className="bg-transparent h-12 p-1 border-none justify-start min-w-max">
              <TabsTrigger value="all" className="data-active:bg-white/10 data-active:text-white px-4">All Logs</TabsTrigger>
              {AGENTS.map(a => (
                <TabsTrigger key={a.id} value={a.id} className="data-active:bg-white/10 data-active:text-white px-4 capitalize">
                  {a.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 bg-[#09090B] font-mono text-[11px] p-4 text-zinc-400 overflow-y-auto max-h-[300px]">
             <TabsContent value="all" className="m-0 space-y-1.5 focus-visible:outline-none">
               {agentLogs.length > 0 ? agentLogs.map((log) => (
                 <LogLine key={log.id} log={log} />
               )) : <div className="text-zinc-600">No activity recorded.</div>}
             </TabsContent>
             
             {AGENTS.map(a => (
                <TabsContent key={a.id} value={a.id} className="m-0 space-y-1.5 focus-visible:outline-none">
                  {agentLogs.filter(l => l.agent.toLowerCase() === a.id.toLowerCase()).length > 0 ? 
                    agentLogs.filter(l => l.agent.toLowerCase() === a.id.toLowerCase()).map((log) => (
                      <LogLine key={log.id} log={log} />
                  )) : <div className="text-zinc-600">No activity recorded for {a.name}.</div>}
                </TabsContent>
             ))}
          </div>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-black/40 rounded-lg border border-white/5 mt-4">
            {modalContent?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogLine({ log }: { log: AgentLog }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, []); // Auto-scroll on new log element mount

  const agentObj = AGENTS.find(a => a.id === log.agent.toLowerCase());
  const agentColor = agentObj ? agentObj.color.replace("text-", "") : "zinc-400";
  
  return (
    <div ref={ref} className="flex gap-4 font-mono hover:bg-white/5 px-2 py-1 -mx-2 rounded transition-colors break-words">
      <span className="text-zinc-600 shrink-0 select-none">[{new Date(log.created_at).toLocaleTimeString()}]</span>
      <span className={`shrink-0 font-semibold w-24 text-${agentColor}`}>{log.agent}</span>
      <span className="text-zinc-300">{log.action}</span>
    </div>
  );
}
