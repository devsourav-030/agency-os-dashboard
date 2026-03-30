"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Settings,
  Cpu,
  Database,
  Globe,
  Mail,
  CreditCard,
  Code,
  Triangle,
  Send,
  Save,
  Clock,
  Briefcase,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusData {
  claude?: boolean;
  supabase?: boolean;
  telegram?: boolean;
  apify?: boolean;
  gmail?: boolean;
  github?: boolean;
  vercel?: boolean;
  razorpay?: boolean;
  [key: string]: boolean | undefined;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // Status State
  const [status, setStatus] = useState<StatusData>({});

  // Scraper State
  const [scraperMarkets, setScraperMarkets] = useState<string[]>(["India", "USA"]);
  const [scraperMinScore, setScraperMinScore] = useState(65);
  const [scraperMaxPerDay, setScraperMaxPerDay] = useState(50);
  const [savingScraper, setSavingScraper] = useState(false);

  // Outreach State
  const [outreachLimit, setOutreachLimit] = useState(20);
  const [outreachFromName, setOutreachFromName] = useState("");
  const [outreachFollowUp, setOutreachFollowUp] = useState(3);
  const [savingOutreach, setSavingOutreach] = useState(false);

  // Schedules State
  const [scheduleSaraswati, setScheduleSaraswati] = useState("09:00");
  const [scheduleChanakya, setScheduleChanakya] = useState("10:00");
  const [scheduleLakshmi, setScheduleLakshmi] = useState("17:00");
  const [savingSchedules, setSavingSchedules] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch status
        try {
          const statusRes: any = await api.agents.status();
          setStatus(statusRes.keys || statusRes || {});
        } catch (e) {
          console.warn("Status fetch failed", e);
        }

        // Fetch settings configs
        try {
          const sRes: any = await api.settings.get("scraper");
          if (sRes) {
            if (sRes.markets) setScraperMarkets(sRes.markets);
            if (sRes.min_score) setScraperMinScore(sRes.min_score);
            if (sRes.max_per_day) setScraperMaxPerDay(sRes.max_per_day);
          }
        } catch (e) {}

        try {
          const oRes: any = await api.settings.get("outreach");
          if (oRes) {
            if (oRes.daily_limit) setOutreachLimit(oRes.daily_limit);
            if (oRes.from_name) setOutreachFromName(oRes.from_name);
            if (oRes.follow_up_days) setOutreachFollowUp(oRes.follow_up_days);
          }
        } catch (e) {}

        try {
          const schRes: any = await api.settings.get("schedules");
          if (schRes) {
            if (schRes.saraswati) setScheduleSaraswati(schRes.saraswati);
            if (schRes.chanakya) setScheduleChanakya(schRes.chanakya);
            if (schRes.lakshmi) setScheduleLakshmi(schRes.lakshmi);
          }
        } catch (e) {}

      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveScraper = async () => {
    setSavingScraper(true);
    try {
      await api.settings.update("scraper", {
        markets: scraperMarkets,
        min_score: scraperMinScore,
        max_per_day: scraperMaxPerDay
      });
      toast.success("Scraper config saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save scraper config");
    } finally {
      setSavingScraper(false);
    }
  };

  const handleSaveOutreach = async () => {
    setSavingOutreach(true);
    try {
      await api.settings.update("outreach", {
        daily_limit: outreachLimit,
        from_name: outreachFromName,
        follow_up_days: outreachFollowUp
      });
      toast.success("Outreach config saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save outreach config");
    } finally {
      setSavingOutreach(false);
    }
  };

  const handleSaveSchedules = async () => {
    setSavingSchedules(true);
    try {
      await api.settings.update("schedules", {
        saraswati: scheduleSaraswati,
        chanakya: scheduleChanakya,
        lakshmi: scheduleLakshmi
      });
      toast.success("Schedules saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save schedules");
    } finally {
      setSavingSchedules(false);
    }
  };

  const toggleMarket = (market: string) => {
    setScraperMarkets(prev => 
      prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]
    );
  };

  const services = [
    { name: "Claude API", key: "claude", icon: Cpu },
    { name: "Supabase", key: "supabase", icon: Database },
    { name: "Telegram", key: "telegram", icon: Send },
    { name: "Apify", key: "apify", icon: Globe },
    { name: "Gmail", key: "gmail", icon: Mail },
    { name: "GitHub", key: "github", icon: Code },
    { name: "Vercel", key: "vercel", icon: Triangle },
    { name: "Razorpay", key: "razorpay", icon: CreditCard },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-400 flex items-center gap-2">
           <Settings className="w-6 h-6 text-zinc-300" />
           Settings & Configuration
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Manage system API keys, agent schedules, and operational parameters.
        </p>
      </div>

      {/* System Status Section */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          System Status 
          <span className="text-xs font-normal text-text-muted bg-surface-active px-2 py-0.5 rounded-full ml-2">API Keys</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const isOk = status[service.key] || status[service.key.toLowerCase()] || false;
            const Icon = service.icon;
            return (
              <Card key={service.key} className="bg-surface border-border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${isOk ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary text-sm">{service.name}</div>
                      <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        {isOk ? <><CheckCircle2 className="w-3 h-3 text-green-400"/> Connected</> : <><XCircle className="w-3 h-3 text-red-400"/> Missing</>}
                      </div>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isOk ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50 animate-pulse'}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Scraper Config */}
        <Card className="bg-surface border-border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
              <Search className="w-5 h-5 text-purple-400" />
              Saraswati (Scraper)
            </CardTitle>
            <CardDescription>Configure lead generation targets and limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Target Markets</label>
              <div className="flex flex-wrap gap-2">
                {["India", "USA", "UAE", "Europe"].map(m => (
                  <Button 
                    key={m} 
                    variant="outline" 
                    size="sm"
                    className={`h-7 text-xs border ${scraperMarkets.includes(m) ? 'bg-primary/20 text-primary border-primary/50' : 'bg-surface border-border text-text-muted hover:text-text-primary'}`}
                    onClick={() => toggleMarket(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Min AI Score</label>
                <span className="text-xs font-bold text-primary">{scraperMinScore}</span>
              </div>
              <input 
                type="range" 
                min="50" max="95" 
                value={scraperMinScore} 
                onChange={(e) => setScraperMinScore(parseInt(e.target.value))}
                className="w-full accent-primary h-2 bg-background rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Max Leads / Day</label>
              <Input 
                type="number"
                value={scraperMaxPerDay} 
                onChange={(e) => setScraperMaxPerDay(parseInt(e.target.value))} 
                className="bg-background border-border"
              />
            </div>

            <Button 
              onClick={handleSaveScraper} 
              disabled={savingScraper}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              <Save className="w-4 h-4" /> Save Scraper Config
            </Button>
          </CardContent>
        </Card>

        {/* Outreach Config */}
        <Card className="bg-surface border-border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
              <Send className="w-5 h-5 text-blue-400" />
              Chanakya (Outreach)
            </CardTitle>
            <CardDescription>Configure email limits and persona settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Daily Send Limit</label>
                <span className="text-xs font-bold text-primary">{outreachLimit}</span>
              </div>
              <input 
                type="range" 
                min="10" max="200" step="10"
                value={outreachLimit} 
                onChange={(e) => setOutreachLimit(parseInt(e.target.value))}
                className="w-full accent-primary h-2 bg-background rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">From Name (Persona)</label>
              <Input 
                value={outreachFromName} 
                onChange={(e) => setOutreachFromName(e.target.value)} 
                placeholder="Arjun @ Swarg Agency"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Follow-Up Delay (Days)</label>
              <Input 
                type="number"
                min="1" max="14"
                value={outreachFollowUp} 
                onChange={(e) => setOutreachFollowUp(parseInt(e.target.value))} 
                className="bg-background border-border"
              />
            </div>

            <Button 
              onClick={handleSaveOutreach} 
              disabled={savingOutreach}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              <Save className="w-4 h-4" /> Save Outreach Config
            </Button>
          </CardContent>
        </Card>

        {/* Schedule Config */}
        <Card className="bg-surface border-border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
              <Clock className="w-5 h-5 text-emerald-400" />
              Agent Schedules
            </CardTitle>
            <CardDescription>Daily automated trigger times per agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex justify-between">
                <span>Saraswati (Scraper)</span>
                <span className="text-xs font-normal text-text-muted">Local Time</span>
              </label>
              <Input 
                type="time"
                value={scheduleSaraswati} 
                onChange={(e) => setScheduleSaraswati(e.target.value)} 
                className="bg-background border-border [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex justify-between">
                <span>Chanakya (Outreach)</span>
                <span className="text-xs font-normal text-text-muted">Local Time</span>
              </label>
              <Input 
                type="time"
                value={scheduleChanakya} 
                onChange={(e) => setScheduleChanakya(e.target.value)} 
                className="bg-background border-border [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex justify-between">
                <span>Lakshmi (Finance)</span>
                <span className="text-xs font-normal text-text-muted">Local Time</span>
              </label>
              <Input 
                type="time"
                value={scheduleLakshmi} 
                onChange={(e) => setScheduleLakshmi(e.target.value)} 
                className="bg-background border-border [color-scheme:dark]"
              />
            </div>

            <Button 
              onClick={handleSaveSchedules} 
              disabled={savingSchedules}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              <Save className="w-4 h-4" /> Save Schedules
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
