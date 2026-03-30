"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Brain,
  SendHorizontal,
  Trash2,
  FileText,
  X,
  AlertCircle,
  Command,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const QUICK_COMMANDS = [
  "/briefing",
  "/leads",
  "proposal for...",
  "build demo for...",
  "finance update",
  "write linkedin post about...",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingBanner, setBriefingBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const res: any = await api.chat.history();
      // Assume res is an array of messages or { messages: [] }
      const history = Array.isArray(res) ? res : res?.messages || [];
      if (history.length > 0) {
        setMessages(
          history.map((m: any) => ({
            role: m.role || "assistant",
            content: m.content || m.message || m.reply || "",
          }))
        );
      } else {
        // Default welcome message 
        setMessages([
          {
            role: "assistant",
            content: "Hello. I am Arjun, your AI co-founder. How can I assist the agency today?",
          },
        ]);
      }
    } catch (e) {
      console.warn("Could not fetch chat history", e);
      setMessages([
        {
          role: "assistant",
          content: "Hello. I am Arjun, your AI co-founder. (Offline Mode)",
        },
      ]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, briefingBanner]);

  const handleSend = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? input).trim();
    if (!text) return;
    
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res: any = await api.chat.send(text);
      if (res?.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      } else {
        toast.error("Invalid response format from Arjun");
      }
    } catch (err: any) {
      console.warn("Chat error", err);
      toast.error(err.message || "Failed to communicate with Arjun");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error processing your request. Please ensure the backend is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Memory cleared. How can I help you?",
      },
    ]);
    setBriefingBanner(null);
    toast.success("Chat history cleared locally");
  };

  const handleGetBriefing = async () => {
    setIsBriefingLoading(true);
    setBriefingBanner(null);
    try {
      const res: any = await api.chat.briefing();
      if (res?.briefing) {
        setBriefingBanner(res.briefing);
      } else {
        toast.error("Briefing data is empty");
      }
    } catch (err: any) {
      console.warn("Briefing error", err);
      toast.error(err.message || "Could not fetch briefing");
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const applyQuickCommand = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full bg-background relative overflow-hidden">
      {/* Top Bar */}
      <div className="flex-none flex items-center justify-between p-4 border-b border-border bg-surface-hover/30 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            🧠
          </div>
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-tight">Arjun</h1>
            <p className="text-xs text-amber-500/80 font-medium">AI Brain & Co-founder</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleGetBriefing}
            disabled={isBriefingLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isBriefingLoading ? "Fetching..." : "Get Briefing"}</span>
          </button>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Briefing Banner Overlay */}
      {briefingBanner && (
        <div className="flex-none w-full bg-amber-500/10 border-b border-amber-500/30 p-4 relative z-0 origin-top animate-in slide-in-from-top-4 fade-in">
          <button 
            onClick={() => setBriefingBanner(null)}
            className="absolute top-3 right-3 text-amber-500/60 hover:text-amber-500 bg-black/20 hover:bg-black/40 rounded-sm p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="pr-6">
              <h3 className="text-sm font-bold text-amber-500 mb-1">End-of-Day Briefing</h3>
              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {briefingBanner}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={cn("flex items-end gap-3", isUser ? "justify-end" : "justify-start")}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-sm shrink-0 shadow-sm border border-amber-500/20">
                  🧠
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-[#1E3A5F] text-zinc-100 rounded-bl-none border border-blue-400/20"
                )}
              >
                {isUser ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="text-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg max-w-none prose-a:text-blue-300">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-end gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-sm shrink-0 shadow-sm border border-amber-500/20">
              🧠
            </div>
            <div className="max-w-[75%] rounded-2xl rounded-bl-none p-4 bg-[#1E3A5F] border border-blue-400/20 shadow-md">
              <div className="flex items-center gap-1.5 h-4">
                <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="flex-none border-t border-border bg-surface p-4 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {/* Quick Commands Chips */}
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar mask-edges">
            <Command className="w-3.5 h-3.5 text-text-muted shrink-0 my-auto mr-1" />
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => applyQuickCommand(cmd)}
                className="shrink-0 text-xs px-3 py-1.5 bg-surface-hover/50 hover:bg-surface-active text-text-secondary hover:text-text-primary rounded-full transition-colors border border-border"
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Arjun..."
              className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 shadow-inner"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary transition-all shadow-sm"
              title="Send Message"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center">
             <span className="text-[10px] text-text-muted font-medium">Arjun can execute agency workflows contextually via API integrations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
