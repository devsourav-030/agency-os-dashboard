// Prevent double slashes when NEXT_PUBLIC_API_URL ends with `/`.
const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
// This module is used by client components, so auth must come from a NEXT_PUBLIC var.
const KEY = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || "";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
      ...(KEY ? { "X-API-Key": KEY } : {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
const j = JSON.stringify;

export const api = {
  agents: {
    scrape: (market = "india", max_results = 20) =>
      req("/api/agents/saraswati/run", {
        method: "POST",
        body: j({ market, max_results }),
      }),
    outreach: (limit = 20, min_score = 65) =>
      req("/api/agents/chanakya/outreach", {
        method: "POST",
        body: j({ limit, min_score }),
      }),
    proposal: (brief: string) =>
      req<{ proposal: string }>("/api/agents/chanakya/proposal", {
        method: "POST",
        body: j({ brief }),
      }),
    demo: (industry: string, client_name: string) =>
      req("/api/agents/vishwakarma/demo", {
        method: "POST",
        body: j({ industry, client_name }),
      }),
    finance: () =>
      req("/api/agents/lakshmi/finance", { method: "POST", body: "{}" }),
    post: (topic = "", recent_work = "") =>
      req<{ post: string; topic: string }>("/api/agents/vyasa/post", {
        method: "POST",
        body: j({ topic, recent_work }),
      }),
    caseStudy: (project_name: string, industry: string, outcome: string) =>
      req("/api/agents/vyasa/case-study", {
        method: "POST",
        body: j({ project_name, industry, outcome }),
      }),
    status: () => req("/api/agents/status"),
  },
  leads: {
    list: (p = "") => req(`/api/leads${p}`),
    get: (id: string) => req(`/api/leads/${id}`),
    create: (d: any) => req("/api/leads", { method: "POST", body: j(d) }),
    update: (id: string, d: any) =>
      req(`/api/leads/${id}`, { method: "PATCH", body: j(d) }),
    archive: (id: string) => req(`/api/leads/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: (s?: string) => req(`/api/projects${s ? `?status=${s}` : ""}`),
    get: (id: string) => req(`/api/projects/${id}`),
    create: (d: any) => req("/api/projects", { method: "POST", body: j(d) }),
    update: (id: string, d: any) =>
      req(`/api/projects/${id}`, { method: "PATCH", body: j(d) }),
    addMilestone: (pid: string, title: string) =>
      req(`/api/projects/${pid}/milestone`, {
        method: "POST",
        body: j({ title }),
      }),
    completeMilestone: (pid: string, mid: string) =>
      req(`/api/projects/${pid}/milestone/${mid}/complete`, {
        method: "PATCH",
        body: "{}",
      }),
  },
  invoices: {
    list: (s?: string) => req(`/api/invoices${s ? `?status=${s}` : ""}`),
    create: (d: any) => req("/api/invoices", { method: "POST", body: j(d) }),
    razorpay: (id: string) =>
      req(`/api/invoices/${id}/razorpay`, { method: "POST", body: "{}" }),
    markPaid: (id: string) =>
      req(`/api/invoices/${id}/paid`, { method: "PATCH", body: "{}" }),
    summary: () => req("/api/invoices/summary"),
  },
  chat: {
    send: (message: string) =>
      req<{ reply: string }>("/api/chat", {
        method: "POST",
        body: j({ message }),
      }),
    history: () => req("/api/chat/history"),
    briefing: () => req<{ briefing: string }>("/api/chat/briefing"),
  },
  outreach: { list: (p = "") => req(`/api/outreach${p}`) },
  settings: {
    get: (key: string) => req(`/api/settings/${key}`),
    update: (key: string, value: any) =>
      req("/api/settings", { method: "POST", body: j({ key, value }) }),
  },
};
