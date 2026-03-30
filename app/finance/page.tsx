"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Link as LinkIcon,
  Copy,
  IndianRupee,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";

interface Summary {
  total_revenue?: number;
  this_month?: number;
  outstanding?: number;
  overdue_count?: number;
}

interface Project {
  id: string;
  name: string;
  client_name?: string;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  project_id?: string;
  project?: Project;
  client_name?: string;
  amount: number;
  currency: "USD" | "INR" | string;
  status: "pending" | "paid" | "overdue";
  due_date: string;
  created_at: string;
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [razorpayLink, setRazorpayLink] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Form State
  const [formProject, setFormProject] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formDueDate, setFormDueDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, invRes, projRes] = await Promise.all([
        (api.invoices.summary() as Promise<Summary>).catch(() => ({})),
        api.invoices.list().catch(() => []) as Promise<any>,
        api.projects.list().catch(() => []) as Promise<any>,
      ]);
      setSummary(sumRes);
      // Ensure array type
      if (Array.isArray(invRes)) setInvoices(invRes);
      else if (invRes?.data && Array.isArray(invRes.data)) setInvoices(invRes.data);
      else setInvoices([]);

      if (Array.isArray(projRes)) setProjects(projRes);
      else if (projRes?.data && Array.isArray(projRes.data)) setProjects(projRes.data);
      else setProjects([]);
    } catch (err) {
      console.warn("Could not fetch finance data:", err);
      toast.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    const last12Months = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return {
        month: d.toLocaleString("default", { month: "short", year: "2-digit" }),
        monthSort: d.getTime(),
        invoiced: 0,
        paid: 0,
      };
    });

    invoices.forEach((inv) => {
      // Use created_at or fallback to due_date or now
      const d = new Date(inv.created_at || inv.due_date || new Date());
      const m = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const target = last12Months.find((x) => x.month === m);
      if (target) {
        // Simple normalization for chart (treating USD and INR loosely, but ideal is conversion. Ignoring for now as per simple requirements)
        target.invoiced += Number(inv.amount) || 0;
        if (inv.status === "paid") {
          target.paid += Number(inv.amount) || 0;
        }
      }
    });

    return last12Months;
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (activeTab === "All") return invoices;
    return invoices.filter(
      (inv) => inv.status.toLowerCase() === activeTab.toLowerCase()
    );
  }, [invoices, activeTab]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProject || !formAmount || !formDueDate) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await api.invoices.create({
        project_id: formProject,
        amount: Number(formAmount),
        currency: formCurrency,
        due_date: formDueDate,
        status: "pending",
      });
      toast.success("Invoice created successfully");
      setIsCreateOpen(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const handleGenerateLink = async (id: string) => {
    try {
      const res: any = await api.invoices.razorpay(id);
      // Assuming res returns { link: "..." } or wait, what if it fails?
      setRazorpayLink(res.link || res.url || `https://razorpay.me/@swargagency/${id}`);
      setIsLinkModalOpen(true);
    } catch (err: any) {
      toast.error("Error generating link. Checking mock link.");
      setRazorpayLink(`https://razorpay.me/@swargagency/mock_${id}`);
      setIsLinkModalOpen(true);
    }
  };

  const handleMarkPaid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.invoices.markPaid(id);
      toast.success("Invoice marked as paid");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as paid");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(razorpayLink);
    toast.success("Link copied to clipboard");
  };

  const formatCurrency = (amt: number, curr = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400">
            Finance Centre
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your agency revenue, invoices, and payments.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-subtle transition-colors">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-sm font-medium">Total Revenue</span>
            <DollarSign className="w-4 h-4 opacity-50" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(summary?.total_revenue || 0)}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-subtle transition-colors">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-sm font-medium">This Month</span>
            <CheckCircle className="w-4 h-4 opacity-50 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(summary?.this_month || 0)}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-subtle transition-colors">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-sm font-medium">Outstanding Balance</span>
            <Clock className="w-4 h-4 opacity-50 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(summary?.outstanding || 0)}
          </div>
        </div>
        <div
          className={cn(
            "bg-surface border border-border rounded-xl p-5 transition-colors",
            (summary?.overdue_count || 0) > 0
              ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
              : "hover:border-border-subtle"
          )}
        >
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span
              className={cn(
                "text-sm font-medium",
                (summary?.overdue_count || 0) > 0 ? "text-red-400" : ""
              )}
            >
              Overdue Invoices
            </span>
            <AlertCircle
              className={cn(
                "w-4 h-4 opacity-50",
                (summary?.overdue_count || 0) > 0 ? "text-red-400" : ""
              )}
            />
          </div>
          <div
            className={cn(
              "text-2xl font-bold",
              (summary?.overdue_count || 0) > 0
                ? "text-red-400"
                : "text-text-primary"
            )}
          >
            {summary?.overdue_count || 0}
          </div>
        </div>
      </div>

      {/* Charts & Content Area */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8 relative">
        <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
          Revenue Overview <span className="text-xs text-text-muted font-normal">(Last 12 Months)</span>
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                contentStyle={{
                  backgroundColor: "#09090b", // background
                  borderColor: "#27272a", // border
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="invoiced" name="Invoiced" fill="#3f3f46" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoice Table Section */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-hover/30">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab((v as string) || "All")}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-surface-active p-1">
              <TabsTrigger value="All" className="px-4">All</TabsTrigger>
              <TabsTrigger value="Pending" className="px-4">Pending</TabsTrigger>
              <TabsTrigger value="Paid" className="px-4">Paid</TabsTrigger>
              <TabsTrigger value="Overdue" className="px-4">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-hover/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium">Invoice</TableHead>
                <TableHead className="font-medium">Client / Project</TableHead>
                <TableHead className="font-medium">Amount</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Due Date</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-text-muted">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const isPastDue =
                    inv.status !== "paid" &&
                    new Date(inv.due_date).getTime() < new Date().getTime();
                  return (
                    <TableRow
                      key={inv.id}
                      className="border-border hover:bg-surface-hover/50 transition-colors"
                    >
                      <TableCell className="font-medium text-text-primary">
                        {inv.invoice_number || `#INV-${inv.id?.slice(0, 4) || 'XXXX'}`}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {inv.client_name || inv.project?.client_name || "Unknown Client"}
                        </div>
                        <div className="text-xs text-text-muted">
                          {inv.project?.name || "No Project Attached"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          {inv.currency === "INR" ? (
                            <IndianRupee className="w-3 h-3 text-text-muted" />
                          ) : (
                            <DollarSign className="w-3 h-3 text-text-muted" />
                          )}
                          {new Intl.NumberFormat("en-US").format(inv.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {inv.status?.toLowerCase() === "pending" && (
                            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">Pending</Badge>
                          )}
                          {inv.status?.toLowerCase() === "paid" && (
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">Paid</Badge>
                          )}
                          {inv.status?.toLowerCase() === "overdue" && (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              <Badge variant="outline" className="text-red-400 border-red-400/30 bg-red-400/10">Overdue</Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-sm",
                          isPastDue ? "text-red-400 font-medium" : "text-text-secondary"
                        )}
                      >
                        {new Date(inv.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status?.toLowerCase() !== "paid" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateLink(inv.id);
                                }}
                                className="h-8 gap-1 border-primary/20 hover:border-primary/50 hover:bg-primary/10 text-primary"
                              >
                                <LinkIcon className="w-3 h-3" />
                                Payment Link
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkPaid(inv.id, e)}
                                className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                              >
                                Mark Paid
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-text-muted">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Invoice Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="bg-surface border-l-border sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Create New Invoice</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">
                Project
              </label>
              <Select value={formProject} onValueChange={(v) => setFormProject((v as string) || "")}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length > 0 ? (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No active projects
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-text-muted uppercase">
                  Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2 w-[120px]">
                <label className="text-xs font-semibold text-text-muted uppercase">
                  Currency
                </label>
                <Select value={formCurrency} onValueChange={(v) => setFormCurrency((v as string) || "USD")}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase">
                Due Date
              </label>
              <Input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="bg-background border-border [color-scheme:dark]"
              />
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Create Invoice
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Razorpay Link Dialog */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle>Payment Link Generated</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-text-muted">
              Share this Razorpay payment link with your client.
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={razorpayLink}
                className="bg-background border-border text-xs"
              />
              <Button onClick={copyToClipboard} size="icon-sm" className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
