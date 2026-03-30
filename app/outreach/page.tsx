"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useRealtimeTable } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Send,
  PieChart,
  Inbox,
  ThumbsUp,
  Mail,
  MessageSquare,
  Activity,
  Building,
  CheckCircle2,
  XCircle,
  PlayCircle,
  User
} from "lucide-react";

const Linkedin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface OutreachRow {
  id: string;
  lead_id?: string;
  lead_name: string;
  company: string;
  market_flag: string;
  channel: "email" | "linkedin" | "dm" | string;
  message_type: string;
  sent_at: string;
  reply_received: boolean;
  reply_intent: "interested" | "more_info" | "not_now" | "not_interested" | string;
  message_content: string;
  reply_content?: string;
}

export default function OutreachPage() {
  const { data, loading } = useRealtimeTable<OutreachRow>("outreach");
  
  // Panel States
  const [market, setMarket] = useState("India");
  const [limit, setLimit] = useState(20);
  const [minScore, setMinScore] = useState(65);
  const [triggering, setTriggering] = useState(false);

  // Dialog State
  const [selectedRow, setSelectedRow] = useState<OutreachRow | null>(null);

  // Computed Stats
  const totalSent = data.length;
  const sentToday = data.filter((d) => {
    try {
      return new Date(d.sent_at).toDateString() === new Date().toDateString();
    } catch { return false; }
  }).length;
  const replyRate = totalSent > 0 ? ((data.filter((d) => d.reply_received).length / totalSent) * 100).toFixed(1) : "0.0";
  const positiveReplies = data.filter((d) => d.reply_intent === "interested").length;

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      toast.loading("Running outreach campaign...", { id: "outreach" });
      await api.agents.outreach(limit, minScore);
      toast.success(`Outreach campaign triggered for ${limit} leads.`, { id: "outreach" });
    } catch (err: any) {
      toast.error(err.message || "Failed to run campaign", { id: "outreach" });
    } finally {
      setTriggering(false);
    }
  };

  const handleAction = async (e: React.MouseEvent, row: OutreachRow, action: "demo" | "proposal" | "archive") => {
    e.stopPropagation();
    const targetId = row.lead_id || row.id;
    try {
      const loadingId = toast.loading(`Moving to ${action}...`);
      if (action === "archive") {
        await api.leads.archive(targetId);
      } else {
        await api.leads.update(targetId, { status: action });
      }
      toast.success(`Moved to ${action}`, { id: loadingId });
    } catch (err: any) {
      toast.error(`Action failed: ${err.message}`);
    }
  };

  const renderTable = (rows: OutreachRow[], isInbox = false) => (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-text-muted uppercase bg-surface-hover/30 border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold">Lead</th>
            <th className="px-4 py-3 font-semibold">Channel</th>
            <th className="px-4 py-3 font-semibold">Message Type</th>
            <th className="px-4 py-3 font-semibold">Sent At</th>
            <th className="px-4 py-3 font-semibold">Reply Status</th>
            <th className="px-4 py-3 font-semibold">Intent</th>
            {isInbox && <th className="px-4 py-3 font-semibold text-right">Take Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={isInbox ? 7 : 6} className="px-4 py-8 text-center text-text-muted">
                No outreach logs found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr 
                key={row.id} 
                className="border-b border-border/50 hover:bg-surface-hover/30 cursor-pointer transition-colors"
                onClick={() => setSelectedRow(row)}
              >
                <td className="px-4 py-3 border-r border-border/10">
                  <div className="font-semibold text-text-primary flex items-center gap-2">
                    <span className="text-lg">{row.market_flag || "🌐"}</span>
                    {row.lead_name}
                  </div>
                  <div className="text-xs text-text-muted flex items-center mt-1">
                    <Building className="w-3 h-3 mr-1" />
                    {row.company}
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-border/10">
                  {row.channel === "email" ? (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1"><Mail className="w-3 h-3" /> Email</Badge>
                  ) : row.channel === "linkedin" ? (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30 gap-1"><MessageSquare className="w-3 h-3" /> DM</Badge>
                  )}
                </td>
                <td className="px-4 py-3 border-r border-border/10">
                  <span className="text-text-secondary capitalize">{row.message_type?.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3 border-r border-border/10 whitespace-nowrap text-text-secondary">
                  {row.sent_at ? format(new Date(row.sent_at), "MMM d, h:mm a") : "-"}
                </td>
                <td className="px-4 py-3 border-r border-border/10">
                  {row.reply_received ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">No</Badge>
                  )}
                </td>
                <td className="px-4 py-3 border-r border-border/10">
                  {row.reply_intent === "interested" ? (
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1"/> Interested</Badge>
                  ) : row.reply_intent === "more_info" ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"><Activity className="w-3 h-3 mr-1"/> More Info</Badge>
                  ) : row.reply_intent === "not_now" ? (
                    <Badge className="bg-slate-500/20 text-slate-300 hover:bg-slate-500/30">Not Now</Badge>
                  ) : row.reply_intent === "not_interested" ? (
                    <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30"><XCircle className="w-3 h-3 mr-1"/> Not Interested</Badge>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
                {isInbox && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button size="sm" variant="outline" className="text-xs h-7 bg-surface border-border hover:bg-surface-hover" onClick={(e) => handleAction(e, row, "demo")}>To Demo</Button>
                       <Button size="sm" variant="outline" className="text-xs h-7 bg-surface border-border hover:bg-surface-hover" onClick={(e) => handleAction(e, row, "proposal")}>To Proposal</Button>
                       <Button size="sm" variant="outline" className="text-xs h-7 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" onClick={(e) => handleAction(e, row, "archive")}>Archive</Button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400 flex items-center gap-2">
          <Send className="w-6 h-6 text-green-400" />
          Outreach
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Monitor automated campaigns and manage responses across channels.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-surface border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-1">
               <Send className="w-4 h-4 text-blue-400" />
               Total Sent
             </div>
             {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <div className="text-3xl font-bold text-text-primary">{totalSent}</div>}
          </CardContent>
        </Card>
        
        <Card className="bg-surface border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-1">
               <Activity className="w-4 h-4 text-purple-400" />
               Sent Today
             </div>
             {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <div className="text-3xl font-bold text-text-primary">{sentToday}</div>}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-1">
               <PieChart className="w-4 h-4 text-yellow-400" />
               Reply Rate
             </div>
             {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <div className="text-3xl font-bold text-text-primary">{replyRate}%</div>}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-1">
               <ThumbsUp className="w-4 h-4 text-green-400" />
               Positive Replies
             </div>
             {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <div className="text-3xl font-bold text-green-400">{positiveReplies}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 flex-1">
        
        {/* Main Tabs */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Tabs defaultValue="log" className="w-full flex-1 flex flex-col">
            <TabsList className="bg-surface border border-border w-max mb-4">
              <TabsTrigger value="log" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <Send className="w-4 h-4" /> Global Log
              </TabsTrigger>
              <TabsTrigger value="inbox" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <Inbox className="w-4 h-4" /> Reply Inbox
                {positiveReplies > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-green-500 text-white rounded-full px-1.5 py-0 min-w-4 h-4 flex items-center justify-center text-[10px]">
                    {positiveReplies}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="log" className="flex-1 mt-0 outline-none">
              {loading ? (
                 <Skeleton className="w-full h-[400px] rounded-xl bg-surface-hover/30" />
              ) : (
                 renderTable(data)
              )}
            </TabsContent>

            <TabsContent value="inbox" className="flex-1 mt-0 outline-none">
              {loading ? (
                 <Skeleton className="w-full h-[400px] rounded-xl bg-surface-hover/30" />
              ) : (
                 renderTable(data.filter(r => r.reply_received), true)
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="sticky top-6">
             <Card className="bg-surface border-border shadow-lg overflow-hidden">
               <div className="h-1 w-full bg-gradient-to-r from-primary to-indigo-500" />
               <CardHeader className="pb-4">
                 <CardTitle className="text-lg flex items-center gap-2">
                   <PlayCircle className="w-5 h-5 text-primary" />
                   Trigger Campaign
                 </CardTitle>
                 <CardDescription>
                   Manually instruct Chanakya AI to execute outreach targeting.
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-5">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Target Market</label>
                   <Select value={market} onValueChange={(val) => val && setMarket(val)}>
                     <SelectTrigger className="w-full bg-background border-border">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="India">🇮🇳 India</SelectItem>
                       <SelectItem value="USA">🇺🇸 USA</SelectItem>
                       <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                       <SelectItem value="Europe">🇪🇺 Europe</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-4">
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Limit (Leads)</label>
                       <span className="text-xs font-bold text-primary">{limit}</span>
                     </div>
                     <input 
                       type="range" 
                       min="5" 
                       max="50" 
                       value={limit} 
                       onChange={(e) => setLimit(parseInt(e.target.value))}
                       className="w-full accent-primary h-2 bg-background rounded-lg appearance-none cursor-pointer"
                     />
                   </div>

                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Min Score threshold</label>
                       <span className="text-xs font-bold text-primary">{minScore}</span>
                     </div>
                     <input 
                       type="range" 
                       min="50" 
                       max="90" 
                       value={minScore} 
                       onChange={(e) => setMinScore(parseInt(e.target.value))}
                       className="w-full accent-primary h-2 bg-background rounded-lg appearance-none cursor-pointer"
                     />
                     <p className="text-[10px] text-text-muted">Only reach out to leads rated {minScore} or higher by the AI.</p>
                   </div>
                 </div>

                 <Button 
                   onClick={handleTrigger} 
                   disabled={triggering}
                   className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-2 shadow-lg shadow-primary/20"
                 >
                   <Send className="w-4 h-4" />
                   {triggering ? "Running..." : "Run Outreach Now"}
                 </Button>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>

      {/* Row Detail Dialog */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="bg-surface border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-primary" />
              {selectedRow?.lead_name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                  <div className="text-text-muted mb-1 text-xs uppercase font-semibold">Company</div>
                  <div className="font-medium text-text-primary flex items-center gap-2">
                    <Building className="w-4 h-4 text-border-dim" /> {selectedRow?.company}
                  </div>
               </div>
               <div>
                  <div className="text-text-muted mb-1 text-xs uppercase font-semibold">Sent At</div>
                  <div className="font-medium text-text-primary">
                    {selectedRow?.sent_at ? format(new Date(selectedRow.sent_at), "PPp") : "-"}
                  </div>
               </div>
             </div>

             <div className="space-y-2">
               <div className="text-text-muted text-xs uppercase font-semibold flex items-center gap-2">
                 <Send className="w-4 h-4 text-blue-400" /> Outbound Message
               </div>
               <div className="p-4 rounded-lg bg-background border border-border/50 text-sm text-text-secondary whitespace-pre-wrap">
                 {selectedRow?.message_content || "No message content recorded."}
               </div>
             </div>

             {selectedRow?.reply_received && (
               <div className="space-y-2">
                 <div className="text-text-muted text-xs uppercase font-semibold flex items-center gap-2">
                   <Inbox className="w-4 h-4 text-purple-400" /> Reply Received
                   {selectedRow.reply_intent === "interested" && <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20 ml-2 py-0">Interested</Badge>}
                 </div>
                 <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-text-primary whitespace-pre-wrap">
                   {selectedRow?.reply_content || "No reply content recorded."}
                 </div>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
