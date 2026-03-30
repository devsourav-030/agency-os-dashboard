"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { supabase, useRealtimeTable } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  Sparkles,
  FileText,
  Copy,
  Save,
  Trash2,
  RefreshCw,
  Search,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const LinkedinIcon = ({ className }: { className?: string }) => (
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

interface BrandContent {
  id: string;
  type: string;
  topic: string;
  content: string;
  created_at: string;
}

export default function BrandStudioPage() {
  const { data: history, loading } = useRealtimeTable<BrandContent>("brand_content");

  // Post Generator State
  const [topic, setTopic] = useState("");
  const [recentWork, setRecentWork] = useState("");
  const [postResult, setPostResult] = useState("");
  const [generatingPost, setGeneratingPost] = useState(false);

  // Case Study Generator State
  const [csProject, setCsProject] = useState("");
  const [csIndustry, setCsIndustry] = useState("");
  const [csOutcome, setCsOutcome] = useState("");
  const [csResult, setCsResult] = useState("");
  const [generatingCs, setGeneratingCs] = useState(false);

  const RANDOM_TOPICS = [
    "ai automation case study",
    "how I built an AI agent for a client",
    "what AI can do for your business in 2026",
  ];

  const handleRandomTopic = () => {
    const random = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setTopic(random);
  };

  const handleGeneratePost = async () => {
    if (!topic) {
      toast.error("Please provide a topic");
      return;
    }
    setGeneratingPost(true);
    setPostResult("");
    try {
      const res = await api.agents.post(topic, recentWork);
      setPostResult(res.post || (res as any).content || "");
      toast.success("Post generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate post");
    } finally {
      setGeneratingPost(false);
    }
  };

  const handleGenerateCS = async () => {
    if (!csProject || !csIndustry || !csOutcome) {
      toast.error("Please fill all case study fields");
      return;
    }
    setGeneratingCs(true);
    setCsResult("");
    try {
      const res: any = await api.agents.caseStudy(csProject, csIndustry, csOutcome);
      setCsResult(res.case_study || res.content || res.post || JSON.stringify(res));
      toast.success("Case study generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate case study");
    } finally {
      setGeneratingCs(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSave = async (type: string, currentTopic: string, content: string) => {
    if (!content) return;
    try {
      const { error } = await supabase.from("brand_content").insert({
        type,
        topic: currentTopic || "Case Study",
        content,
      });
      if (error) throw error;
      toast.success("Saved to brand content library");
      if (type === "post") setPostResult("");
      if (type === "case_study") setCsResult("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save content");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("brand_content").delete().eq("id", id);
      if (error) throw error;
      toast.success("Content deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete content");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-2">
           <Wand2 className="w-6 h-6 text-violet-400" />
           Brand Studio
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Automate agency authority building with AI-generated content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* LinkedIn Post Generator */}
        <Card className="bg-surface border-border shadow-md h-full flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
              <LinkedinIcon className="w-5 h-5 text-blue-500" />
              LinkedIn Post Generator
            </CardTitle>
            <CardDescription>Draft viral hooks and insightful posts in seconds.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Topical Context</label>
                <Button variant="ghost" size="sm" onClick={handleRandomTopic} className="h-6 text-[10px] px-2 text-text-muted hover:text-primary">
                  <RefreshCw className="w-3 h-3 mr-1" /> Random
                </Button>
              </div>
              <Input 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                placeholder="e.g. why auto-GPTs are failing" 
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recent Work / Insights</label>
              <textarea 
                value={recentWork} 
                onChange={(e) => setRecentWork(e.target.value)} 
                placeholder="We just deployed an agent that cut support tickets by 40%..."
                className="w-full flex-1 min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
              />
            </div>

            <Button 
              onClick={handleGeneratePost} 
              disabled={generatingPost}
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              {generatingPost ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generatingPost ? "Writing Post..." : "Generate LinkedIn Post"}
            </Button>

            {postResult && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-zinc-200">
                   <div className="flex items-start gap-3 mb-3">
                     <div className="w-10 h-10 rounded-full bg-zinc-200" />
                     <div>
                       <div className="h-3 w-24 bg-zinc-200 rounded mb-1" />
                       <div className="h-2 w-16 bg-zinc-100 rounded" />
                     </div>
                   </div>
                   <div className="text-zinc-800 text-sm whitespace-pre-wrap leading-relaxed">
                     {postResult}
                   </div>
                   <div className="text-[10px] text-zinc-400 mt-3 text-right">
                     {postResult.length} characters
                   </div>
                </div>
                <div className="flex items-center gap-2 mt-3 w-full">
                  <Button variant="outline" className="flex-1 bg-surface border-border hover:bg-surface-hover h-9" onClick={() => handleCopy(postResult)}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9" onClick={() => handleSave("post", topic, postResult)}>
                    <Save className="w-4 h-4 mr-2" /> Save to Library
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Study Generator */}
        <Card className="bg-surface border-border shadow-md h-full flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
              <FileText className="w-5 h-5 text-emerald-500" />
              Case Study Generator
            </CardTitle>
            <CardDescription>Synthesize agency wins into compelling PDF-ready copy.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Project / Client Name</label>
                <Input 
                  value={csProject} 
                  onChange={(e) => setCsProject(e.target.value)} 
                  placeholder="Acme Corp" 
                  className="bg-background border-border"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Industry / Vertical</label>
                <Input 
                  value={csIndustry} 
                  onChange={(e) => setCsIndustry(e.target.value)} 
                  placeholder="B2B SaaS" 
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Measurable Outcome</label>
                <textarea 
                  value={csOutcome} 
                  onChange={(e) => setCsOutcome(e.target.value)} 
                  placeholder="Saved 40h/week by automating lead qualification..."
                  className="w-full flex-1 min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 resize-none"
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerateCS} 
              disabled={generatingCs}
              className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
            >
              {generatingCs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generatingCs ? "Drafting..." : "Generate Case Study"}
            </Button>

            {csResult && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col">
                <div className="p-4 rounded-lg bg-background border border-border/50 text-sm text-text-secondary whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                  {csResult}
                </div>
                <div className="flex items-center gap-2 mt-3 w-full">
                  <Button variant="outline" className="flex-1 bg-surface border-border hover:bg-surface-hover h-9" onClick={() => handleCopy(csResult)}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                  <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-9" onClick={() => handleSave("case_study", `CS: ${csProject}`, csResult)}>
                    <Save className="w-4 h-4 mr-2" /> Save to Library
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Library Table */}
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Content Library
      </h2>
      
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-surface-hover/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold w-32">Type</th>
              <th className="px-4 py-3 font-semibold">Topic / Context</th>
              <th className="px-4 py-3 font-semibold">Preview</th>
              <th className="px-4 py-3 font-semibold w-40">Created</th>
              <th className="px-4 py-3 font-semibold text-right w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No saved content. Generate something above!
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
                  <td className="px-4 py-3 border-r border-border/10">
                    {row.type === "post" ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1"><MessageSquare className="w-3 h-3"/> Post</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1"><FileText className="w-3 h-3"/> Case Study</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-border/10 font-medium text-text-primary">
                    {row.topic}
                  </td>
                  <td className="px-4 py-3 border-r border-border/10 text-text-secondary truncate max-w-xs">
                    {row.content?.substring(0, 50)}...
                  </td>
                  <td className="px-4 py-3 border-r border-border/10 text-text-muted whitespace-nowrap">
                    {format(new Date(row.created_at), "MMM d, h:mm a")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-text-muted hover:text-text-primary hover:bg-surface-active" onClick={() => handleCopy(row.content)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
