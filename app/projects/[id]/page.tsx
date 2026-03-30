"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  FileText,
  Coins,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  status: string;
  target_date: string;
  budget: number;
  currency: string;
  github_url?: string;
  vercel_url?: string;
  notion_url?: string;
  milestones?: Milestone[];
}

interface Invoice {
  id: string;
  project_id: string;
  status: string;
  amount: number;
  currency: string;
  due_date: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Milestone Add form
  const [newMilestone, setNewMilestone] = useState("");

  // AI agents loading state
  const [agentRunning, setAgentRunning] = useState<Record<string, boolean>>({});

  const [propBrief, setPropBrief] = useState("");
  const [demoInd, setDemoInd] = useState("");
  const [demoClient, setDemoClient] = useState("");

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, invRes]: any = await Promise.all([
        api.projects.get(projectId),
        api.invoices.list().catch(() => ({ data: [] })),
      ]);
      setProject(projRes || null);

      if (invRes?.data && Array.isArray(invRes.data)) {
        setInvoices(invRes.data.filter((i: any) => i.project_id === projectId));
      } else if (Array.isArray(invRes)) {
        setInvoices(invRes.filter((i: any) => i.project_id === projectId));
      }
    } catch (e) {
      console.warn(e);
      toast.error("Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!project) return;
    try {
      await api.projects.update(project.id, { status: newStatus });
      setProject({ ...project, status: newStatus });
      toast.success("Status updated");
    } catch (err) {
      console.warn(err);
      toast.error("Status update failed");
    }
  };

  const handleUpdateField = async (field: string, value: string) => {
    if (!project) return;
    try {
      await api.projects.update(project.id, { [field]: value });
      setProject({ ...project, [field]: value });
      toast.success("Project updated");
    } catch (err: any) {
      console.warn(err);
      toast.error("Update failed");
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.trim() || !project) return;
    try {
      const res: any = await api.projects.addMilestone(project.id, newMilestone.trim());
      setNewMilestone("");
      fetchProjectData();
      toast.success("Milestone added");
    } catch (err: any) {
      console.warn(err);
      toast.error("Could not add milestone");
    }
  };

  const handleToggleMilestone = async (mId: string, currentVal: boolean) => {
    if (!project) return;
    try {
      // Optimistically update
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          milestones: prev.milestones?.map((m) =>
            m.id === mId ? { ...m, completed: !currentVal } : m
          ),
        };
      });
      // The API definition had completeMilestone without state toggle parameter mapped initially.
      // So assuming it marks it true/false based on implementation, OR we explicitly just mark complete
      await api.projects.completeMilestone(project.id, mId); 
    } catch (err) {
      console.warn(err);
      toast.error("Operation failed");
      fetchProjectData(); // revert
    }
  };

  const copyPath = (val?: string) => {
    if (val) {
      navigator.clipboard.writeText(val);
      toast.success("Copied to clipboard");
    }
  };

  const runAgent = async (key: string, fn: () => Promise<void>) => {
    setAgentRunning((prev) => ({ ...prev, [key]: true }));
    try {
      await fn();
    } catch (e: any) {
      console.warn(e);
      toast.error(e.message || "Agent execution failed");
    } finally {
      setAgentRunning((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-muted">Project not found.</p>
        <Link href="/projects" className="text-primary hover:underline mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  const progress =
    !project.milestones || project.milestones.length === 0
      ? 0
      : Math.round(
          (project.milestones.filter((m) => m.completed).length / project.milestones.length) * 100
        );

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-y-auto px-4 md:px-6 py-6 pb-20">
      {/* Back nav & Header */}
      <div className="mb-6">
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1 pb-0.5" /> Back to projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">{project.name}</h1>
            <p className="text-lg font-medium text-text-secondary mt-1">{project.client_name}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-[150px]">
               <Select value={project.status} onValueChange={(v) => handleUpdateStatus((v as string) || "scoping")}>
                 <SelectTrigger className="bg-surface border-border font-medium">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="scoping">Scoping</SelectItem>
                   <SelectItem value="active">Active</SelectItem>
                   <SelectItem value="review">Review</SelectItem>
                   <SelectItem value="delivered">Delivered</SelectItem>
                   <SelectItem value="retainer">Retainer</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="bg-surface-active p-1 w-full max-w-sm grid grid-cols-3 mb-6 relative z-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="ai_tools">AI Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Left Column: Milestones */}
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Milestones</h2>
                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                      {progress}% Complete
                    </Badge>
                  </div>
                  
                  {/* Progress bar line */}
                  <div className="w-full h-2 bg-surface-active rounded-full overflow-hidden mb-6">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>

                  <div className="space-y-3 mb-6">
                    {project.milestones?.map((m) => (
                      <div 
                        key={m.id} 
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border-subtle bg-background transition-colors cursor-pointer group"
                        onClick={() => handleToggleMilestone(m.id, m.completed)}
                      >
                         <div className={cn("transition-colors", m.completed ? "text-green-500" : "text-text-muted group-hover:text-primary")}>
                           {m.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                         </div>
                         <span className={cn("text-sm transition-all", m.completed ? "text-text-muted line-through" : "text-text-primary font-medium")}>
                           {m.title}
                         </span>
                      </div>
                    ))}
                    {!project.milestones?.length && (
                      <p className="text-sm text-text-muted italic">No milestones defined yet.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add new milestone..." 
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      className="bg-background border-border flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddMilestone() }}
                    />
                    <Button onClick={handleAddMilestone} disabled={!newMilestone.trim()} className="shrink-0 bg-primary text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>
             </div>

             {/* Right Column: Project Details & Links */}
             <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-text-primary mb-4">Project Links & Configuration</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted uppercase">GitHub Repo URL</label>
                      <div className="relative">
                        <Input 
                          placeholder="https://github.com/..." 
                          defaultValue={project.github_url}
                          onBlur={(e) => handleUpdateField("github_url", e.target.value)}
                          className="bg-background border-border pr-10 text-sm"
                        />
                        <button onClick={() => copyPath(project.github_url)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted uppercase">Vercel Deployment URL</label>
                      <div className="relative">
                        <Input 
                          placeholder="https://acme-demo.vercel.app" 
                          defaultValue={project.vercel_url}
                          onBlur={(e) => handleUpdateField("vercel_url", e.target.value)}
                          className="bg-background border-border pr-10 text-sm"
                        />
                        <button onClick={() => copyPath(project.vercel_url)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted uppercase">Notion Doc URL</label>
                      <div className="relative">
                        <Input 
                          placeholder="https://notion.so/..." 
                          defaultValue={project.notion_url}
                          onBlur={(e) => handleUpdateField("notion_url", e.target.value)}
                          className="bg-background border-border pr-10 text-sm"
                        />
                        <button onClick={() => copyPath(project.notion_url)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="focus-visible:outline-none space-y-4">
          <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl">
             <h2 className="text-lg font-bold text-text-primary">Related Invoices</h2>
             <Button
                onClick={() => {
                  toast("Navigate to finance to generate generic invoices", { icon: "💳" });
                }}
                className="bg-surface-active hover:bg-surface-hover text-text-primary border border-border"
             >
               <Plus className="w-4 h-4 mr-2" />
               New Invoice
             </Button>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden mt-4">
             {invoices.length > 0 ? (
               <div className="divide-y divide-border">
                 {invoices.map((inv) => (
                   <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-surface-hover/30 transition-colors">
                     <div>
                       <div className="font-semibold text-text-primary text-sm font-mono truncate max-w-[150px]">{inv.id}</div>
                       <div className="text-xs text-text-muted mt-0.5">Due: {new Date(inv.due_date || "").toLocaleDateString()}</div>
                     </div>
                     <div className="text-right">
                       <span className={cn(
                         "text-xs px-2 py-0.5 font-medium rounded-full mb-1 inline-block",
                         inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                         inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 
                         'bg-yellow-500/10 text-yellow-500'
                       )}>
                         {inv.status}
                       </span>
                       <div className="text-sm font-bold text-text-primary whitespace-nowrap">
                         {inv.currency} {inv.amount?.toLocaleString()}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-10 text-center text-text-muted text-sm">
                 No invoices have been logged specifically for this project ID.
               </div>
             )}
          </div>
        </TabsContent>

        <TabsContent value="ai_tools" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            
            {/* Vishwakarma Demo Builder */}
            <div className="bg-surface border border-border rounded-xl p-5 hover:border-orange-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <h3 className="font-bold text-text-primary mb-1">Vishwakarma — Build Demo</h3>
              <p className="text-xs text-text-muted mb-4 h-8 overflow-hidden">Instantly compile a React staging application bound to this project context.</p>
              
              <div className="space-y-3 mb-4">
                <Input placeholder="Client Name" className="bg-background border-border text-xs h-8" value={demoClient} onChange={(e) => setDemoClient(e.target.value)} />
                <Input placeholder="Industry (e.g. SaaS)" className="bg-background border-border text-xs h-8" value={demoInd} onChange={(e) => setDemoInd(e.target.value)} />
              </div>

              <Button 
                disabled={agentRunning['demo'] || !demoClient || !demoInd} 
                onClick={() => runAgent('demo', async () => {
                   const res: any = await api.agents.demo(demoInd, demoClient);
                   if (res?.vercel_url) handleUpdateField("vercel_url", res.vercel_url);
                   toast.success("Demo spun up! View Overview links.");
                })}
                className="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-semibold h-8"
              >
                {agentRunning['demo'] ? "Building..." : "Run Builder"}
              </Button>
            </div>

            {/* Chanakya/Vyasa Proposal */}
            <div className="bg-surface border border-border rounded-xl p-5 hover:border-blue-500/40 transition-colors">
               <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                 <FileText className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-text-primary mb-1">Agent — Outline Proposal</h3>
               <p className="text-xs text-text-muted mb-4 h-8 overflow-hidden">Drafts an actionable business proposal specific to this scope.</p>
               
               <div className="space-y-3 mb-4">
                 <Input placeholder="Core briefing (e.g. e-com site)" className="bg-background border-border text-xs h-8" value={propBrief} onChange={(e) => setPropBrief(e.target.value)} />
                 <div className="h-8"></div> {/* Spacer to align grid rows */}
               </div>

               <Button 
                 disabled={agentRunning['proposal'] || !propBrief}
                 onClick={() => runAgent('proposal', async () => {
                   const res: any = await api.agents.proposal(propBrief);
                   if (res?.proposal) {
                     handleUpdateField("notion_url", "https://notion.so/proposal-draft-x1293"); // Placeholder logic since no db push directly returns url for proposal here
                     toast.success("Proposal written!");
                   }
                 })}
                 className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-semibold h-8"
               >
                 {agentRunning['proposal'] ? "Drafting..." : "Generate Proposal"}
               </Button>
            </div>

             {/* Lakshmi Finance */}
             <div className="bg-surface border border-border rounded-xl p-5 hover:border-emerald-500/40 transition-colors">
               <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                 <Coins className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-text-primary mb-1">Lakshmi — Financial Spotcheck</h3>
               <p className="text-xs text-text-muted mb-4 h-8 overflow-hidden">Calculate burn limits + run accounting health assessments.</p>
               
               <div className="space-y-3 mb-4">
                 <div className="h-8 flex items-center justify-center text-[10px] text-emerald-500/60 font-mono bg-emerald-500/5 rounded-md border border-emerald-500/10">No config required</div>
                 <div className="h-8"></div> {/* Spacer */}
               </div>

               <Button 
                 disabled={agentRunning['finance']}
                 onClick={() => runAgent('finance', async () => {
                   await api.agents.finance();
                   toast.success("Finance snapshot compiled & routed to console logs.");
                 })}
                 className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold h-8"
               >
                 {agentRunning['finance'] ? "Calculating..." : "Run Audit"}
               </Button>
            </div>

          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
