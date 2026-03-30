"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  Plus,
  Link2,
  Globe,
  Clock,
  IndianRupee,
  DollarSign,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { differenceInDays, isPast } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  status: "scoping" | "active" | "review" | "delivered" | "retainer";
  target_date: string;
  budget: number;
  currency: "USD" | "INR" | string;
  github_url?: string;
  vercel_url?: string;
  milestones?: Milestone[];
}

const STATUS_COLORS: Record<string, string> = {
  scoping: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  active: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  delivered: "bg-green-500/10 text-green-400 border-green-500/30",
  retainer: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formStatus, setFormStatus] = useState("scoping");
  const [formDate, setFormDate] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formCurrency, setFormCurrency] = useState("USD");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res: any = await api.projects.list();
      setProjects(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      console.warn("Could not fetch projects", e);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formClient || !formDate || !formBudget) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await api.projects.create({
        name: formName,
        client_name: formClient,
        status: formStatus,
        target_date: formDate,
        budget: Number(formBudget),
        currency: formCurrency,
      });
      toast.success("Project created successfully");
      setIsAddOpen(false);
      setFormName("");
      setFormClient("");
      setFormDate("");
      setFormBudget("");
      fetchProjects();
    } catch (err: any) {
      console.warn(err);
      toast.error(err.message || "Failed to create project");
    }
  };

  const calculateProgress = (milestones?: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getUrgencySettings = (targetDate: string) => {
    if (!targetDate)
      return { text: "No date", color: "text-zinc-500", bg: "bg-zinc-500/10" };
    const date = new Date(targetDate);

    // Check purely based on start of day logic
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = differenceInDays(date, today);

    if (diffDays < 0)
      return {
        text: "Overdue",
        color: "text-red-500",
        bg: "bg-red-500/10 animate-pulse",
      };
    if (diffDays < 3)
      return {
        text: `${diffDays} days left`,
        color: "text-red-400",
        bg: "bg-red-400/10",
      };
    if (diffDays <= 7)
      return {
        text: `${diffDays} days left`,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
      };
    return {
      text: `${diffDays} days left`,
      color: "text-green-400",
      bg: "bg-green-400/10",
    };
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Projects
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Active engagements, milestone tracking, and deliverables.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full bg-surface-hover/50 rounded-xl" />
            <Skeleton className="h-48 w-full bg-surface-hover/50 rounded-xl" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-xl">
            <FolderKanban className="w-10 h-10 text-border-dim mx-auto mb-4" />
            <p className="text-text-muted">
              No projects found. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const progress = calculateProgress(project.milestones);
              const urgency = getUrgencySettings(project.target_date);
              const isINR = project.currency === "INR";
              const formattedBudget = new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 0,
              }).format(project.budget || 0);

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-surface-hover/50 transition-all group cursor-pointer h-full flex flex-col relative overflow-hidden">
                    {/* Urgency Ribbon Strip */}
                    <div
                      className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        urgency.color.replace("text-", "bg-"),
                      )}
                    />

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors line-clamp-1 break-all">
                          {project.name}
                        </h3>
                        <p className="text-sm font-medium text-text-secondary mt-0.5">
                          {project.client_name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize px-2 py-0.5 whitespace-nowrap",
                          STATUS_COLORS[project.status] ||
                            STATUS_COLORS.scoping,
                        )}
                      >
                        {project.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <div className="flex flex-col justify-end space-y-3">
                        {/* Value */}
                        <div className="flex items-center gap-1.5 font-bold text-text-primary">
                          {isINR ? (
                            <IndianRupee className="w-4 h-4 text-text-muted" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-text-muted" />
                          )}
                          <span className="text-lg">{formattedBudget}</span>
                        </div>

                        {/* Delivery Countdown */}
                        <div
                          className={cn(
                            "flex w-max items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold",
                            urgency.bg,
                            urgency.color,
                          )}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {urgency.text}
                          {urgency.text === "Overdue" && (
                            <AlertCircle className="w-3.5 h-3.5 ml-1 animate-pulse" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        {/* Link Icons */}
                        <div className="flex items-center gap-2 mb-2">
                          {project.github_url && (
                            <div
                              className="p-1.5 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={project.github_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Link2 className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          {project.vercel_url && (
                            <div
                              className="p-1.5 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={project.vercel_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Circular Progress */}
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <svg
                            viewBox="0 0 36 36"
                            className="w-14 h-14 -rotate-90"
                          >
                            <path
                              className="text-surface-active stroke-current"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              strokeWidth="3"
                            />
                            <path
                              className={cn(
                                "stroke-current",
                                progress === 100
                                  ? "text-green-500"
                                  : "text-primary",
                              )}
                              strokeDasharray={`${progress}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-text-primary">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent
          side="right"
          className="bg-surface border-l-border sm:max-w-md overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>New Project</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">
                Project Name
              </label>
              <Input
                placeholder="Agency OS Redesign"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">
                Client Name
              </label>
              <Input
                placeholder="Acme Corp"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">
                Status
              </label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus((v as string) || "scoping")}
              >
                <SelectTrigger className="bg-background border-border">
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

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-text-muted uppercase">
                  Budget
                </label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2 w-[110px]">
                <label className="text-xs font-semibold text-text-muted uppercase">
                  Currency
                </label>
                <Select
                  value={formCurrency}
                  onValueChange={(v) => setFormCurrency((v as string) || "USD")}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">
                Target Date
              </label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="bg-background border-border [color-scheme:dark]"
              />
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
              >
                Create Project
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
