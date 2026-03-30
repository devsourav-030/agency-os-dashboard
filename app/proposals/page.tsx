"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { supabase, useRealtimeTable } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import { toast } from "react-hot-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Save, Copy, Download, Trash2, Send, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Components
const StatusBadge = ({ status }: { status: string }) => {
  let color = "bg-surface-active text-text-secondary border-transparent";
  if (status === "sent") color = "bg-[#1A56DB]/10 text-[#1A56DB] border-[#1A56DB]/30";
  if (status === "accepted") color = "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30";
  if (status === "rejected") color = "bg-red-500/10 text-red-400 border-red-500/30";

  return <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-[10px] tracking-wide font-semibold", color)}>{status}</Badge>;
};

const FollowUpDate = ({ createdAt }: { createdAt: string }) => {
  if (!createdAt) return <span className="text-xs text-text-secondary">-</span>;
  const created = new Date(createdAt);
  const due = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  const isPast = due < new Date();
  return (
    <span className={cn("text-xs", isPast ? "text-danger font-semibold" : "text-text-secondary")}>
      {due.toLocaleDateString()}
    </span>
  );
};

export default function ProposalsPage() {
  const { data: leads } = useRealtimeTable<any>("leads");
  const [clientId, setClientId] = useState("");
  const [brief, setBrief] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: proposals, loading: loadingProposals } = useRealtimeTable<any>("proposals", "*, leads(company)");

  const handleGenerate = async () => {
    if (!clientId) {
      toast.error("Please select a client first.");
      return;
    }
    if (!brief) {
      toast.error("Please provide a project brief.");
      return;
    }

    setIsGenerating(true);
    try {
      const fullBriefContext = `Budget Parameter: ${budget} ${currency}\nTimeline: ${timeline} weeks\n\nProject Requirements:\n${brief}`;
      const res = await api.agents.proposal(fullBriefContext);
      if (res && res.proposal) {
        setGeneratedProposal(res.proposal);
        toast.success("Proposal generated successfully!");
      } else {
         toast.error("No proposal data received.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong generating the proposal.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!clientId) return toast.error("Client not selected. Cannot save.");
    if (!generatedProposal) return toast.error("No generated content to save.");

    setIsSaving(true);
    try {
      const res = await supabase.from('proposals').insert({
        lead_id: clientId,
        content: generatedProposal,
        value: Number(budget) || 0,
        currency,
        status: 'draft'
      });
      if (res.error) throw res.error;
      toast.success("Proposal saved to tracker");
    } catch (err: any) {
      toast.error(err.message || "Failed to save proposal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedProposal);
    toast.success("Copied to clipboard!");
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await supabase.from("proposals").update({ status }).eq("id", id);
      if (res.error) throw res.error;
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const deleteProposal = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this proposal?")) return;
    try {
      const res = await supabase.from("proposals").delete().eq("id", id);
      if (res.error) throw res.error;
      toast.success("Deleted proposal");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 w-full overflow-y-auto space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Proposals Studio
        </h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 shrink-0 xl:min-h-[550px]">
        {/* Left Pane - Form */}
        <div className="w-full xl:w-[40%] 2xl:w-[35%] bg-surface border border-border rounded-lg p-6 flex flex-col space-y-5 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Proposal Parameters
          </h2>

          <div className="space-y-5 flex-1 mt-2">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Client</label>
              <Select value={clientId} onValueChange={(val) => setClientId(val || "")}>
                <SelectTrigger className="bg-background border-border shadow-none">
                  <SelectValue placeholder="Select Client (Lead)..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>{lead.company || lead.name || 'Unknown'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-1.5 flex-[2] flex flex-col">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Budget</label>
                <div className="flex items-center gap-2 border border-border bg-background rounded-md overflow-hidden p-1 shadow-sm">
                  <input 
                    type="number" 
                    value={budget} 
                    onChange={e => setBudget(e.target.value)} 
                    placeholder="E.g. 5000" 
                    className="bg-transparent border-none outline-none text-sm px-2 w-full text-text-primary"
                  />
                  <div className="flex bg-surface rounded p-0.5 items-center shrink-0">
                    {['INR', 'USD', 'AED'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded transition-colors duration-200",
                          currency === c ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:text-text-primary"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 flex-[1] flex flex-col">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Timeline</label>
                <div className="relative h-10 border border-border bg-background rounded-md flex items-center px-3 shadow-sm">
                  <input 
                    type="number" 
                    value={timeline} 
                    onChange={e => setTimeline(e.target.value)} 
                    placeholder="4" 
                    className="bg-transparent border-none outline-none w-full text-sm text-text-primary placeholder:text-text-muted"
                  />
                  <span className="text-[10px] font-bold text-text-muted uppercase">wks</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col min-h-[150px]">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Project Brief</label>
              <Textarea 
                value={brief} 
                onChange={e => setBrief(e.target.value)} 
                placeholder="Include scope, key deliverables, and specific pain points to address..." 
                className="bg-background border-border resize-none flex-1 min-h-[180px] text-sm shadow-sm"
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4 py-5 text-sm font-semibold tracking-wide shadow-md"
          >
            {isGenerating ? "Processing Context..." : "Generate AI Proposal"}
          </Button>
        </div>

        {/* Right Pane - Preview */}
        <div className="w-full xl:w-[60%] 2xl:w-[65%] bg-surface border border-border rounded-lg flex flex-col relative shadow-sm overflow-hidden">
          <div className="bg-surface-hover/50 border-b border-border py-3 px-6 shrink-0 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              Preview
            </h2>
            {generatedProposal && (
              <Badge variant="secondary" className="bg-surface border-border-subtle text-text-secondary text-[10px] font-medium tracking-wide">
                ~{generatedProposal.split(/\s+/).filter(Boolean).length} words
              </Badge>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-8 relative bg-background/30">
            {isGenerating && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-6 text-center space-y-4">
                <div className="w-12 h-12 border-[3px] border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
                <div className="animate-pulse flex flex-col items-center gap-1.5 mt-2">
                  <span className="text-lg font-bold text-text-primary">Chanakya is writing...</span>
                  <span className="text-xs text-text-secondary">Drafting personalized proposal based on your brief</span>
                </div>
              </div>
            )}
            
            {!generatedProposal && !isGenerating && (
              <div className="h-full w-full flex flex-col items-center justify-center text-text-muted text-sm border-2 border-dashed border-border-dim rounded-lg p-6 bg-surface/20">
                <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-border-dim" />
                </div>
                <p className="font-medium text-text-primary mb-1">No Proposal Generated</p>
                <p className="text-xs max-w-xs text-center leading-relaxed">Fill out the parameters on the left and click "Generate AI Proposal" to see the output here.</p>
              </div>
            )}

            {generatedProposal && (
              <div className="prose prose-invert prose-blue max-w-none text-sm text-text-primary leading-relaxed print:text-black">
                <ReactMarkdown>{generatedProposal}</ReactMarkdown>
              </div>
            )}
          </div>
          
          {generatedProposal && (
            <div className="border-t border-border p-4 px-6 flex items-center justify-between bg-surface-hover/80 shrink-0 print:hidden shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)] z-20">
              <p className="text-xs text-text-muted hidden sm:block">Review before saving to tracker or sending to client.</p>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 h-9 bg-background">
                  <Save className="w-4 h-4 text-text-secondary" /> <span className="hidden xs:inline">Save</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 h-9 bg-background">
                  <Copy className="w-4 h-4 text-text-secondary" /> <span className="hidden xs:inline">Copy</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 h-9 bg-background">
                  <Download className="w-4 h-4 text-text-secondary" /> <span className="hidden xs:inline">Download</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracker Table */}
      <div className="bg-surface border border-border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 min-h-[400px]">
        <div className="bg-surface-hover border-b border-border py-4 px-6 shrink-0 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary tracking-wide">Proposals Tracker</h2>
          <Badge className="bg-surface-active text-text-secondary border-none">{proposals.length} active</Badge>
        </div>
        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-active/20">
              <TableRow className="border-border">
                <TableHead className="font-semibold px-6 py-3 h-11 text-xs uppercase tracking-wider">Client</TableHead>
                <TableHead className="font-semibold py-3 h-11 text-xs uppercase tracking-wider">Value</TableHead>
                <TableHead className="font-semibold py-3 h-11 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell py-3 h-11 text-xs uppercase tracking-wider">Created</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell py-3 h-11 text-xs uppercase tracking-wider">Follow-up Due</TableHead>
                <TableHead className="text-right font-semibold px-6 py-3 h-11 text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingProposals ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                       <span className="text-sm">Loading tracker...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <FileText className="w-8 h-8 text-border-dim" />
                       <span className="text-sm font-medium">No proposals found in tracking</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((p) => (
                  <TableRow key={p.id} className="border-border hover:bg-surface-hover/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                        {p.leads?.company || p.leads?.name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm font-medium text-text-secondary tabular-nums">
                        {p.value.toLocaleString()} {p.currency}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="py-4 hidden sm:table-cell text-sm text-text-secondary tabular-nums font-medium">
                      {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="py-4 hidden sm:table-cell">
                      <FollowUpDate createdAt={p.created_at} />
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-90 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8 rounded-md hover:bg-surface border border-transparent hover:border-border text-text-secondary hover:text-text-primary flex-shrink-0"
                          title="Load to Preview"
                          onClick={() => {
                            setGeneratedProposal(p.content);
                            setClientId(p.lead_id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8 rounded-md hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 text-[#1A56DB] flex-shrink-0"
                          title="Mark Sent"
                          onClick={() => updateStatus(p.id, 'sent')}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8 rounded-md hover:bg-green-500/10 border border-transparent hover:border-green-500/30 text-[#10B981] flex-shrink-0"
                          title="Mark Accepted"
                          onClick={() => updateStatus(p.id, 'accepted')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <div className="w-[1px] h-4 bg-border mx-1"></div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-400 flex-shrink-0"
                          title="Delete"
                          onClick={() => deleteProposal(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
