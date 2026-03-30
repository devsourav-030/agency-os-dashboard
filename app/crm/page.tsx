"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRealtimeTable } from "@/lib/supabase";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Kanban,
  Table as TableIcon,
  Search,
  MoreVertical,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

// Types
type LeadStatus = "new" | "contacted" | "replied" | "demo" | "proposal" | "closed";
type Market = "All" | "India" | "UAE" | "USA";

interface Lead {
  id: string;
  created_at: string;
  company: string;
  name: string;
  market: string;
  score: number;
  status: LeadStatus;
  source: string;
  last_contacted: string | null;
  email?: string;
  phone?: string;
  notes?: string;
}

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-surface-hover border-border text-text-primary" },
  { id: "contacted", label: "Contacted", color: "bg-[#1A56DB]/10 border-[#1A56DB]/30 text-[#1A56DB]" },
  { id: "replied", label: "Replied", color: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
  { id: "demo", label: "Demo", color: "bg-orange-500/10 border-orange-500/30 text-orange-400" },
  { id: "proposal", label: "Proposal", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  { id: "closed", label: "Closed", color: "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]" },
];

const MARKET_FLAGS: Record<string, string> = {
  India: "🇮🇳",
  UAE: "🇦🇪",
  USA: "🇺🇸",
  All: "🌐",
};

const getScoreColor = (score: number) => {
  if (score < 50) return "text-danger border-danger/30 bg-danger/10";
  if (score < 70) return "text-warning border-warning/30 bg-warning/10";
  return "text-success border-success/30 bg-success/10";
};

// --- Kanban Column & Card Components ---

function DraggableCard({ lead, onClick }: { lead: Lead; onClick: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: "Lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-surface border border-border p-3 rounded-md mb-3 cursor-grab hover:border-border-subtle hover:bg-surface-hover transition-colors text-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-text-primary truncate mr-2">{lead.company}</div>
        <div title={lead.market} className="shrink-0">{MARKET_FLAGS[lead.market] || "🌍"}</div>
      </div>
      <div className="text-text-secondary text-xs mb-3">{lead.name}</div>
      <div className="flex flex-wrap gap-2 items-center justify-between mt-auto pt-2 border-t border-border-dim">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 rounded", getScoreColor(lead.score))}>
            {lead.score}
          </Badge>
          <span className="text-[10px] text-text-muted bg-surface-active px-1.5 py-0.5 rounded">
            {lead.source || "Organic"}
          </span>
        </div>
        {lead.last_contacted && (
          <div className="text-[10px] text-text-muted flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(lead.last_contacted).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  leads,
  onLeadClick,
}: {
  column: typeof COLUMNS[0];
  leads: Lead[];
  onLeadClick: (l: Lead) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const leadIds = leads.map((l) => l.id);

  return (
    <div className="flex flex-col w-[280px] shrink-0">
      <div className={cn("px-3 py-2 rounded-t-lg border-t border-x text-sm font-medium flex items-center justify-between", column.color)}>
        <span className="capitalize">{column.label}</span>
        <span className="bg-surface/50 px-2 py-0.5 rounded-full text-xs">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="bg-surface-active/20 border-x border-b border-border p-2 rounded-b-lg flex-1 min-h-[500px]"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <DraggableCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center text-text-muted text-xs py-10 border-2 border-dashed border-border-dim rounded-md">
            No leads here
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function CRMPage() {
  const { data: dbLeads, loading } = useRealtimeTable<Lead>("leads");
  
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [market, setMarket] = useState<Market>("All");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: "asc" | "desc" } | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (dbLeads) {
      setLeads(dbLeads);
    }
  }, [dbLeads]);

  useEffect(() => {
    if (selectedLead && isDetailOpen) {
      api.leads.get(selectedLead.id).then((data: any) => {
        if (data && data.timeline) setTimeline(data.timeline);
      }).catch(console.error);
    }
  }, [selectedLead, isDetailOpen]);

  let filteredLeads = leads.filter((l) => market === "All" || l.market === market);
  if (sortConfig) {
    filteredLeads = [...filteredLeads].sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key: keyof Lead) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "Lead") {
      setActiveLead(active.data.current.lead);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLeadData = leads.find((l) => l.id === activeId);
    if (!activeLeadData) return;

    // Finding destination column
    let destColumnId = activeLeadData.status;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    if (isOverColumn) {
      destColumnId = overId as LeadStatus;
    } else {
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) {
        destColumnId = overLead.status;
      }
    }

    if (activeLeadData.status === destColumnId) return;

    // Optimistic Update
    setLeads((prev) =>
      prev.map((l) => (l.id === activeId ? { ...l, status: destColumnId } : l))
    );

    try {
      await api.leads.update(activeId, { status: destColumnId });
      toast.success(`Moved to ${destColumnId}`);
    } catch (e: any) {
      // Revert on error
      toast.error(`Failed to move lead: ${e.message}`);
      setLeads(dbLeads); 
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const handleArchive = async (id: string) => {
    try {
      await api.leads.archive(id);
      toast.success("Lead archived");
      setIsDetailOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      company: fd.get("company"),
      name: fd.get("name"),
      market: fd.get("market"),
      source: "Manual",
      status: "new",
      score: Math.floor(Math.random() * 40) + 40, // Mock score
    };
    try {
      await api.leads.create(data);
      toast.success("Lead created!");
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      company: fd.get("company"),
      name: fd.get("name"),
      market: fd.get("market"),
      status: fd.get("status"),
    };
    try {
      await api.leads.update(selectedLead.id, data);
      toast.success("Lead updated");
      setIsDetailOpen(false);
      // Data will refresh via Supabase realtime
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between shrink-0 mb-6 gap-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          CRM
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex bg-surface-hover rounded-md p-1 border border-border">
            <button
              onClick={() => setView("kanban")}
              className={cn(
                "p-1.5 rounded text-text-muted hover:text-text-primary transition-all",
                view === "kanban" && "bg-surface text-text-primary shadow-sm"
              )}
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "p-1.5 rounded text-text-muted hover:text-text-primary transition-all",
                view === "table" && "bg-surface text-text-primary shadow-sm"
              )}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <Select value={market} onValueChange={(v) => setMarket((v as Market) || "All")}>
            <SelectTrigger className="w-[120px] bg-surface border-border">
              <SelectValue placeholder="Market" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(MARKET_FLAGS).map((m) => (
                <SelectItem key={m} value={m}>
                  {MARKET_FLAGS[m]} {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 w-full">
        {loading ? (
          <div className="flex gap-4 p-4">
            <Skeleton className="w-[280px] h-[500px] bg-surface-hover/50" />
            <Skeleton className="w-[280px] h-[500px] bg-surface-hover/50" />
            <Skeleton className="w-[280px] h-[500px] bg-surface-hover/50" />
          </div>
        ) : view === "kanban" ? (
          <div className="flex gap-4 h-full overflow-x-auto pb-4 items-start w-full">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  leads={filteredLeads.filter((l) => l.status === col.id)}
                  onLeadClick={handleLeadClick}
                />
              ))}
              <DragOverlay>
                {activeLead ? (
                  <div className="opacity-80 rotate-3 scale-105 transition-transform shadow-xl">
                    <DraggableCard lead={activeLead} onClick={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-surface overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-hover">
                <TableRow className="border-border">
                  <TableHead className="cursor-pointer hover:text-text-primary" onClick={() => handleSort("company")}>Company & Name</TableHead>
                  <TableHead className="cursor-pointer hover:text-text-primary" onClick={() => handleSort("market")}>Market</TableHead>
                  <TableHead className="cursor-pointer hover:text-text-primary" onClick={() => handleSort("score")}>Score</TableHead>
                  <TableHead className="cursor-pointer hover:text-text-primary" onClick={() => handleSort("status")}>Status</TableHead>
                  <TableHead className="cursor-pointer hover:text-text-primary" onClick={() => handleSort("created_at")}>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-border cursor-pointer hover:bg-surface-hover/50" onClick={() => handleLeadClick(lead)}>
                      <TableCell>
                        <div className="font-bold text-text-primary">{lead.company}</div>
                        <div className="text-xs text-text-muted">{lead.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {MARKET_FLAGS[lead.market] || "🌍"} {lead.market}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs w-8 justify-center", getScoreColor(lead.score))}>
                          {lead.score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-surface-active text-text-secondary capitalize">
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLeadClick(lead); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-text-muted">
                      No leads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Lead Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="bg-surface border-l-border sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl flex items-center justify-between">
              Lead Details
            </SheetTitle>
          </SheetHeader>
          
          {selectedLead && (
            <form onSubmit={handleUpdateLead} className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-text-muted uppercase">Company</label>
                    <Input name="company" defaultValue={selectedLead.company} className="bg-background border-border" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-text-muted uppercase">Contact Name</label>
                    <Input name="name" defaultValue={selectedLead.name} className="bg-background border-border" />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-text-muted uppercase">Market</label>
                    <Input name="market" defaultValue={selectedLead.market} className="bg-background border-border" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-text-muted uppercase">Status</label>
                    <Select name="status" defaultValue={selectedLead.status}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-hover rounded-lg border border-border shadow-inner">
                <h3 className="text-sm font-semibold mb-3 flex justify-between items-center">
                  Saraswati AI Analysis
                  <Badge variant="outline" className={getScoreColor(selectedLead.score)}>Score: {selectedLead.score}/100</Badge>
                </h3>
                <p className="text-sm text-text-secondary">
                  Detected via {selectedLead.source || "Organic Outreach"}. High intent signal. 
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Outreach Timeline</h3>
                <div className="border-l-2 border-border-dim pl-4 space-y-4 relative">
                  {timeline.length > 0 ? (
                    timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[23px] top-1"></div>
                        <p className="text-xs text-text-muted">{new Date(event.date || event.created_at).toLocaleDateString()}</p>
                        <p className="text-sm text-text-primary">{event.description || event.message}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute w-3 h-3 bg-surface-active rounded-full -left-[23px] top-1"></div>
                        <p className="text-xs text-text-muted">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
                        <p className="text-sm text-text-primary">Lead detected and added to CRM</p>
                      </div>
                      {selectedLead.last_contacted && (
                        <div className="relative">
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[23px] top-1"></div>
                          <p className="text-xs text-text-muted">{new Date(selectedLead.last_contacted).toLocaleDateString()}</p>
                          <p className="text-sm text-text-primary">Outreach message sent via Chanakya AI</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-border flex gap-3 justify-end items-center">
                <Button type="button" variant="destructive" onClick={() => handleArchive(selectedLead.id)}>Archive</Button>
                <div className="flex-1" />
                <Button type="button" variant="outline" onClick={() => {toast.success("Ready for generation"); window.location.href="/proposals"}}>
                  Generate Proposal
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Lead Drawer / Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="right" className="bg-surface border-l-border">
          <SheetHeader className="mb-6">
            <SheetTitle>Add New Lead</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">Company</label>
              <Input name="company" placeholder="E.g. Acme Corp" required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">Contact Name</label>
              <Input name="name" placeholder="E.g. John Doe" required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">Market</label>
              <Select name="market" defaultValue="India">
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="India">🇮🇳 India</SelectItem>
                  <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                  <SelectItem value="USA">🇺🇸 USA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6 flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">Create Lead</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
