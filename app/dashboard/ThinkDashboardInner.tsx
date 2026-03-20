"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Sidebar from "@/components/Sidebar";
import ModePill from "@/components/ModePill";
import Link from "next/link";

// ════════════════════════════════════════════════════════
// CHAT DRAWER — Premium white design
// ════════════════════════════════════════════════════════
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
const CHAT_SUGGESTIONS = [
  "How do I validate this idea?",
  "What's the MVP scope?",
  "Who should I target first?",
  "What are the biggest risks?",
  "How do I get my first 10 users?",
  "What funding should I raise?",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "#9ca3af",
          display: "inline-block",
          animation: `chatDot 1.3s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

function ChatDrawer({ isOpen, onClose, context, projectName }: {
  isOpen: boolean;
  onClose: () => void;
  context: any;
  projectName?: string;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(500);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (messages.length === 0) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `I'm fully briefed on **${projectName ?? "your project"}**. Ask me anything — strategy, validation, tech decisions, go-to-market, or next steps.`,
        }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const history = messages.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: content, context, history }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startH: drawerHeight };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - ev.clientY;
      setDrawerHeight(Math.min(Math.max(320, dragRef.current.startH + delta), window.innerHeight * 0.88));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const renderContent = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:1px 6px;border-radius:4px;font-size:11.5px;color:#374151;font-family:monospace;">$1</code>')
      .replace(/^- (.+)/gm, "• $1")
      .replace(/\n/g, "<br/>");

  return (
    <>
      <style>{`
        @keyframes chatDot { 0%,100%{opacity:0.25;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }
        @keyframes chatMsgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chatFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes chatSpin { to{transform:rotate(360deg)} }
        .chat-msg { animation: chatMsgIn 0.2s ease both; }
        .chat-input-new::placeholder { color: #9ca3af; font-size: 13.5px; }
        .chat-scroll-new::-webkit-scrollbar { width: 4px; }
        .chat-scroll-new::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .chat-chip:hover { background: #f3f4f6 !important; border-color: #d1d5db !important; color: #374151 !important; }
      `}</style>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(0,0,0,0.15)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            animation: "chatFadeIn 0.18s ease both",
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 100,
        height: drawerHeight,
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        borderRadius: "16px 16px 0 0",
        display: "flex", flexDirection: "column",
        transform: isOpen ? "translateY(0)" : "translateY(100%)",
        opacity: isOpen ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease",
        overflow: "hidden",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.08), 0 -1px 0 rgba(99,102,241,0.08)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>

        {/* Drag handle */}
        <div onMouseDown={handleDragStart} style={{ padding: "10px 0 4px", cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "4px 20px 12px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", letterSpacing: "-0.2px" }}>Arteno AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Briefed on {projectName ?? "your project"}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {messages.length > 1 && (
              <button onClick={() => setMessages([])} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 8px", borderRadius: 6, transition: "color 0.12s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#374151"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}>
                Clear
              </button>
            )}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", border: "1px solid #e5e7eb", cursor: "pointer", color: "#6b7280", transition: "all 0.12s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#f3f4f6"; el.style.color = "#111827"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#f9fafb"; el.style.color = "#6b7280"; }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-scroll-new" style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12, background: "#fafafa" }}>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
              {CHAT_SUGGESTIONS.map(s => (
                <button key={s} className="chat-chip" onClick={() => sendMessage(s)} style={{ fontSize: 12, color: "#6b7280", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 100, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className="chat-msg" style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 8, alignItems: "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", marginTop: 2 }}>✦</div>
              )}
              <div style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                background: msg.role === "user" ? "#0b172a" : "#ffffff",
                border: msg.role === "assistant" ? "1px solid #e5e7eb" : "none",
                fontSize: 13.5, color: msg.role === "user" ? "#fff" : "#1f2937",
                lineHeight: 1.65,
                boxShadow: msg.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
              }}
                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
              />
            </div>
          ))}

          {loading && (
            <div className="chat-msg" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✦</div>
              <div style={{ padding: "10px 14px", borderRadius: "4px 14px 14px 14px", background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #f3f4f6", background: "#fff", flexShrink: 0 }}>
          <div
            style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "8px 8px 8px 14px", transition: "border-color 0.15s" }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.45)"}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"}
          >
            <textarea
              ref={inputRef}
              className="chat-input-new"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything about your project..."
              rows={1}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#111827", fontSize: 13.5, fontFamily: "inherit", resize: "none", lineHeight: 1.55, maxHeight: 100, overflowY: "auto" }}
              onInput={e => {
                const el = e.currentTarget as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 100) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: input.trim() && !loading ? "#0b172a" : "#f3f4f6", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", color: input.trim() && !loading ? "#fff" : "#9ca3af", transition: "all 0.15s" }}
              onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.background = "#1a2d4a"; }}
              onMouseLeave={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.background = "#0b172a"; }}
            >
              {loading
                ? <span style={{ width: 12, height: 12, border: "1.5px solid #d1d5db", borderTopColor: "#6366f1", borderRadius: "50%", animation: "chatSpin 0.6s linear infinite", display: "inline-block" }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 10.5, color: "#d1d5db" }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════
// REST OF FILE — unchanged
// ════════════════════════════════════════════════════════
type Tab = "blueprint" | "roadmap" | "prompts" | "feasibility";
type Mode = "think" | "execute";

function useWindowWidth() {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const update = () => setWidth(window.innerWidth);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);
    return width;
}

function useTypewriter(text: string, speed = 60, enabled = true) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    const rafRef = useRef<number | null>(null);
    const indexRef = useRef(0);
    const lastTimeRef = useRef(0);
    useEffect(() => {
        if (!enabled || !text) { setDisplayed(text ?? ""); setDone(true); return; }
        setDisplayed(""); setDone(false); indexRef.current = 0;
        const interval = 1000 / speed;
        const tick = (now: number) => {
            if (now - lastTimeRef.current >= interval) {
                lastTimeRef.current = now;
                indexRef.current = Math.min(indexRef.current + Math.max(1, Math.floor(speed / 40)), text.length);
                setDisplayed(text.slice(0, indexRef.current));
                if (indexRef.current >= text.length) { setDone(true); return; }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [text, speed, enabled]);
    return { displayed, done };
}

function Cursor({ visible }: { visible: boolean }) {
    const [blink, setBlink] = useState(true);
    useEffect(() => {
        if (!visible) return;
        const t = setInterval(() => setBlink(b => !b), 530);
        return () => clearInterval(t);
    }, [visible]);
    if (!visible) return null;
    return <span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--text)", marginLeft: 2, verticalAlign: "text-bottom", opacity: blink ? 1 : 0, transition: "opacity 0.1s" }} />;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
    return <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}>{children}</div>;
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: copied ? "#22c55e" : "var(--text-4)", background: copied ? "rgba(34,197,94,0.08)" : "var(--surface)", border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "all 0.15s", flexShrink: 0, fontFamily: "var(--font)", fontWeight: 500 }}>
            {copied ? "✓ Copied" : "Copy"}
        </button>
    );
}

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: color ?? "var(--text-4)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 16, height: 1, background: color ?? "var(--border)", display: "inline-block", borderRadius: 1 }} />
            {children}
        </div>
    );
}

function GeneratingIndicator({ activeTab }: { activeTab: Tab }) {
    const labels: Record<Tab, string> = { blueprint: "Building blueprint", roadmap: "Planning roadmap", prompts: "Crafting prompt packs", feasibility: "Analysing feasibility" };
    const [dots, setDots] = useState("");
    useEffect(() => { const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400); return () => clearInterval(t); }, []);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)", marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "think-pulse 1.2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{labels[activeTab]}{dots}</span>
        </div>
    );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div style={{ padding: "12px 16px", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#dc2626" }}>⚠ {message}</span>
            <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
        </div>
    );
}

function MobileResultNav({ activeTab, setActiveTab, displayResults, isStreaming }: any) {
    const tabs = [{ key: "blueprint", label: "Blueprint" }, { key: "roadmap", label: "Roadmap" }, { key: "prompts", label: "Prompts" }, { key: "feasibility", label: "Score" }];
    return (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 80, background: "var(--sidebar-bg)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", height: 56 }}>
            {tabs.map(t => {
                const isActive = activeTab === t.key;
                return (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", position: "relative", color: isActive ? "#fff" : "rgba(255,255,255,0.35)", opacity: isStreaming && !displayResults?.[t.key] ? 0.3 : 1 }}>
                        <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 400, letterSpacing: "0.02em" }}>{t.label}</span>
                        {isActive && <div style={{ position: "absolute", bottom: 0, width: 24, height: 2, background: "#6366f1", borderRadius: "2px 2px 0 0" }} />}
                    </button>
                );
            })}
        </div>
    );
}

function StreamingBlueprint({ data, isStreaming, isMobile }: { data: any; isStreaming: boolean; isMobile?: boolean }) {
    const { displayed: tagline, done: taglineDone } = useTypewriter(data?.tagline ?? "", 60, isStreaming);
    const { displayed: problemSolved, done: problemDone } = useTypewriter(data?.problemSolved ?? "", 50, isStreaming && taglineDone);
    const { displayed: coreValue, done: coreDone } = useTypewriter(data?.coreValueProposition ?? "", 45, isStreaming && problemDone);
    const { displayed: competitive, done: competitiveDone } = useTypewriter(data?.competitiveEdge ?? "", 40, isStreaming && coreDone);
    const features = (data?.coreFeatures ?? []).map((f: any) => typeof f === "string" ? { name: f, description: "", priority: "Medium" } : f);
    const techStack = (data?.techStack ?? []).map((t: any) => typeof t === "string" ? t : t?.name ?? JSON.stringify(t));
    const priorityConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
        high: { color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)", dot: "#ef4444" },
        medium: { color: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.2)", dot: "#f59e0b" },
        low: { color: "var(--text-4)", bg: "transparent", border: "var(--border)", dot: "var(--border)" },
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FadeIn>
                <div style={{ padding: isMobile ? "20px 18px 18px" : "32px 32px 28px", borderRadius: "14px 14px 0 0", background: "var(--bg)", border: "1px solid var(--border)", borderBottom: "none", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, transparent)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />Product Blueprint
                        </div>
                        <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, letterSpacing: "-1px", color: "var(--text)", margin: 0, lineHeight: 1.15 }}>{data?.productName}</h1>
                        <p style={{ fontSize: isMobile ? 13 : 15, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>{tagline}<Cursor visible={isStreaming && !taglineDone} /></p>
                        {data?.targetAudience?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                                {data.targetAudience.slice(0, isMobile ? 2 : 4).map((a: any, i: number) => {
                                    const label = typeof a === "string" ? a : a?.name ?? "";
                                    return <span key={i} style={{ fontSize: 11, padding: "3px 10px", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text-4)", background: "var(--surface)", whiteSpace: "nowrap" }}>{label}</span>;
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 2 }}>
                {(taglineDone || !isStreaming) && (<FadeIn delay={80}><div style={{ padding: isMobile ? "16px 18px" : "24px 26px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderRight: isMobile ? "1px solid var(--border)" : "none", minHeight: isMobile ? "auto" : 140 }}><Label>Problem Solved</Label><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>{problemSolved}<Cursor visible={isStreaming && taglineDone && !problemDone} /></p></div></FadeIn>)}
                {(problemDone || !isStreaming) && (<FadeIn delay={140}><div style={{ padding: isMobile ? "16px 18px" : "24px 26px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderLeft: isMobile ? "1px solid var(--border)" : "none", minHeight: isMobile ? "auto" : 140 }}><Label>Value Proposition</Label><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>{coreValue}<Cursor visible={isStreaming && problemDone && !coreDone} /></p></div></FadeIn>)}
            </div>
            {(coreDone || !isStreaming) && features.length > 0 && (<FadeIn delay={180}><div style={{ padding: isMobile ? "16px 18px" : "24px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}><Label>Core Features</Label><div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>{features.map((f: any, i: number) => { const p = (f.priority ?? "medium").toLowerCase(); const pc = priorityConfig[p] ?? priorityConfig.low; return (<FadeIn key={i} delay={i * 60}><div style={{ padding: "14px 16px", border: `1px solid ${pc.border}`, borderRadius: 10, background: pc.bg, display: "flex", flexDirection: "column", gap: 6 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{f.name}</span><span style={{ width: 6, height: 6, borderRadius: "50%", background: pc.dot, flexShrink: 0 }} /></div>{f.description && <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{f.description}</p>}</div></FadeIn>); })}</div><div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>{[["high", "#ef4444"], ["medium", "#f59e0b"], ["low", "var(--border)"]].map(([label, color]) => (<div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-4)" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />{label} priority</div>))}</div></div></FadeIn>)}
            {(coreDone || !isStreaming) && techStack.length > 0 && (<FadeIn delay={220}><div style={{ padding: isMobile ? "16px 18px" : "22px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}><Label>Tech Stack</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{techStack.map((t: string, i: number) => (<FadeIn key={i} delay={i * 40}><span style={{ fontSize: 12, padding: "5px 13px", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, color: "#a5b4fc", background: "rgba(99,102,241,0.07)", fontWeight: 500 }}>{t}</span></FadeIn>))}</div></div></FadeIn>)}
            {(coreDone || !isStreaming) && data?.competitiveEdge && (<FadeIn delay={260}><div style={{ padding: isMobile ? "16px 18px" : "22px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 14px 14px" }}><Label color="#6366f1">Competitive Edge</Label><p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>{competitive}<Cursor visible={isStreaming && coreDone && !competitiveDone} /></p></div></FadeIn>)}
        </div>
    );
}

function StreamingRoadmap({ data, isStreaming, isMobile }: { data: any; isStreaming: boolean; isMobile?: boolean }) {
    const [expandedPhase, setExpandedPhase] = useState<number>(1);
    const phaseColors = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"];
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FadeIn>
                <div style={{ padding: isMobile ? "20px 18px 16px" : "28px 30px 24px", background: "var(--bg)", border: "1px solid var(--border)", borderBottom: "none", borderRadius: "14px 14px 0 0", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #8b5cf6, #6366f1, transparent)" }} />
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b5cf6", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} />Execution Roadmap</div>
                    <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: "-0.6px", color: "var(--text)", margin: 0 }}>{data?.phases?.length ?? 0}-Phase Plan</h2>
                </div>
            </FadeIn>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                {data?.phases?.map((phase: any, i: number) => {
                    const isOpen = expandedPhase === phase.phase;
                    const isLast = i === (data?.phases?.length ?? 0) - 1;
                    const color = phaseColors[i % phaseColors.length];
                    return (
                        <FadeIn key={phase.phase} delay={i * 100}>
                            <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                                <div onClick={() => setExpandedPhase(isOpen ? 0 : phase.phase)} style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, padding: isMobile ? "14px 16px" : "18px 28px", cursor: "pointer", transition: "background 0.15s", background: isOpen ? "rgba(99,102,241,0.03)" : "transparent" }} onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }} onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                    <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: "50%", background: isOpen ? color : "transparent", border: `2px solid ${isOpen ? color : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 11 : 12, fontWeight: 700, color: isOpen ? "#fff" : "var(--text-4)", flexShrink: 0, transition: "all 0.2s" }}>{phase.phase}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: isMobile ? 13 : 14.5, fontWeight: 600, color: isOpen ? "var(--text)" : "var(--text-2)", letterSpacing: "-0.2px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isMobile ? "nowrap" : "normal" }}>{phase.title}</div>
                                        <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{phase.duration}</div>
                                    </div>
                                    {!isMobile && (<div style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: `1px solid ${isOpen ? color + "40" : "var(--border)"}`, color: isOpen ? color : "var(--text-4)", background: isOpen ? color + "12" : "transparent", transition: "all 0.2s", whiteSpace: "nowrap" }}>Phase {phase.phase}</div>)}
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text-4)", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}><path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                {isOpen && (
                                    <div style={{ padding: isMobile ? "4px 16px 20px 16px" : "4px 28px 24px 78px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 16 }}>
                                        {phase.goals?.length > 0 && (<div><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#22c55e", marginBottom: 10 }}>Goals</div><div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{phase.goals.map((g: string, j: number) => (<div key={j} style={{ display: "flex", gap: 9, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}><span style={{ color: "#22c55e", flexShrink: 0, marginTop: 1, fontSize: 11 }}>✓</span>{g}</div>))}</div></div>)}
                                        {phase.milestones?.length > 0 && (<div><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 10 }}>Milestones</div><div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{phase.milestones.map((m: string, j: number) => (<div key={j} style={{ display: "flex", gap: 9, fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}><span style={{ color: color, flexShrink: 0, marginTop: 2, fontSize: 10 }}>→</span>{m}</div>))}</div></div>)}
                                        {phase.deliverables?.length > 0 && (<div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 8 }}>Deliverables</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{phase.deliverables.map((d: string, j: number) => (<span key={j} style={{ fontSize: 11.5, padding: "4px 12px", border: `1px solid ${color}30`, borderRadius: 6, color: color, background: `${color}0d`, fontWeight: 500 }}>{d}</span>))}</div></div>)}
                                        {phase.teamRequired?.length > 0 && (<div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 8 }}>Team</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{phase.teamRequired.map((t: string, j: number) => (<span key={j} style={{ fontSize: 11.5, padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-3)", background: "var(--surface)" }}>{t}</span>))}</div></div>)}
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    );
                })}
            </div>
        </div>
    );
}

const TOOL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    "cursor": { bg: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "rgba(99,102,241,0.25)" },
    "chatgpt": { bg: "rgba(16,185,129,0.08)", color: "#6ee7b7", border: "rgba(16,185,129,0.2)" },
    "claude": { bg: "rgba(251,146,60,0.08)", color: "#fed7aa", border: "rgba(251,146,60,0.2)" },
    "v0": { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.12)" },
    "midjourney": { bg: "rgba(168,85,247,0.08)", color: "#d8b4fe", border: "rgba(168,85,247,0.2)" },
    "perplexity": { bg: "rgba(56,189,248,0.08)", color: "#7dd3fc", border: "rgba(56,189,248,0.2)" },
};
function getToolStyle(tool: string) {
    const key = tool?.toLowerCase?.() ?? "";
    for (const k of Object.keys(TOOL_COLORS)) { if (key.includes(k)) return TOOL_COLORS[k]; }
    return { bg: "rgba(255,255,255,0.04)", color: "var(--text-4)", border: "var(--border)" };
}

function StreamingPrompts({ data, isStreaming, isMobile }: { data: any; isStreaming: boolean; isMobile?: boolean }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FadeIn>
                <div style={{ padding: isMobile ? "20px 18px 16px" : "28px 30px 24px", background: "var(--bg)", border: "1px solid var(--border)", borderBottom: "none", borderRadius: "14px 14px 0 0", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #f59e0b, #fbbf24, transparent)" }} />
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />AI Prompt Packs</div>
                    <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: "-0.6px", color: "var(--text)", margin: 0 }}>{data?.packs?.reduce((acc: number, p: any) => acc + (p.prompts?.length ?? 0), 0) ?? 0} prompts across {data?.packs?.length ?? 0} phases</h2>
                </div>
            </FadeIn>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                {data?.packs?.map((pack: any, i: number) => (
                    <FadeIn key={i} delay={i * 80}>
                        <div style={{ borderBottom: i < (data.packs.length - 1) ? "1px solid var(--border)" : "none" }}>
                            <div style={{ padding: isMobile ? "12px 16px 8px" : "14px 28px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", padding: "3px 9px", borderRadius: 5, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>{pack.phase}</span>
                                <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)" }}>{pack.category}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {pack.prompts?.map((p: any, j: number) => { const toolStyle = getToolStyle(p.tool ?? ""); return (<FadeIn key={j} delay={j * 50}><div style={{ margin: isMobile ? "0 10px 10px" : "0 16px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}><div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--border)", gap: 10, flexDirection: isMobile ? "column" : "row" }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.title}</span><div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}><span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 5, background: toolStyle.bg, color: toolStyle.color, border: `1px solid ${toolStyle.border}` }}>{p.tool}</span><CopyButton text={p.prompt} /></div></div><div style={{ padding: "12px 14px", fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: isMobile ? 11.5 : 12.5, color: "var(--text-3)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{p.prompt}</div></div></FadeIn>); })}
                            </div>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </div>
    );
}

function StreamingFeasibility({ data, isStreaming, isMobile }: { data: any; isStreaming: boolean; isMobile: boolean }) {
    const { displayed: recommendation, done: recDone } = useTypewriter(data?.recommendation ?? "", 45, isStreaming);
    const score = data?.score ?? 0;
    const scoreColor = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
    const scoreLabel = score >= 75 ? "Strong Idea" : score >= 60 ? "Viable Idea" : score >= 45 ? "Needs Work" : "High Risk";
    const circumference = 2 * Math.PI * 52;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FadeIn>
                <div style={{ padding: isMobile ? "20px 18px 18px" : "32px 32px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderBottom: "none", borderRadius: "14px 14px 0 0", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88, transparent)` }} />
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 20 : 32, flexWrap: "wrap" }}>
                        <div style={{ position: "relative", width: isMobile ? 100 : 120, height: isMobile ? 100 : 120, flexShrink: 0 }}>
                            <svg width={isMobile ? 100 : 120} height={isMobile ? 100 : 120} viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="6" />
                                <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                <span style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, letterSpacing: "-1.5px", color: scoreColor, lineHeight: 1 }}>{score}</span>
                                <span style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 500 }}>/100</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: scoreColor, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: scoreColor, display: "inline-block" }} />Feasibility Score</div>
                            <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, letterSpacing: "-1px", color: "var(--text)", marginBottom: 6, lineHeight: 1.1 }}>{scoreLabel}</div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, color: "var(--text-4)", textTransform: "capitalize" }}>{data?.confidence} confidence</span>
                                {data?.timeToMarket && <span style={{ fontSize: 12, color: "var(--text-4)" }}>· ⏱ {data.timeToMarket}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </FadeIn>
            <FadeIn delay={100}><div style={{ padding: isMobile ? "16px 18px" : "22px 30px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}><Label>Recommendation</Label><p style={{ fontSize: isMobile ? 13 : 14, color: "var(--text-2)", lineHeight: 1.8, margin: 0 }}>{recommendation}<Cursor visible={isStreaming && !recDone} /></p></div></FadeIn>
            {(recDone || !isStreaming) && (<FadeIn delay={140}><div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}><div style={{ padding: isMobile ? "16px 18px" : "22px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderRight: isMobile ? "1px solid var(--border)" : "none", borderBottom: isMobile ? "1px solid var(--border)" : "none" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#22c55e", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 1, background: "#22c55e", display: "inline-block" }} /> Strengths</div><div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{data?.strengths?.map((s: string, i: number) => (<FadeIn key={i} delay={i * 60}><div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}><span style={{ flexShrink: 0, color: "#22c55e", marginTop: 1, fontSize: 11 }}>✓</span>{s}</div></FadeIn>))}</div></div><div style={{ padding: isMobile ? "16px 18px" : "22px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderLeft: isMobile ? "1px solid var(--border)" : "none" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#ef4444", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 1, background: "#ef4444", display: "inline-block" }} /> Risks</div><div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{data?.risks?.map((r: string, i: number) => (<FadeIn key={i} delay={i * 60}><div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}><span style={{ flexShrink: 0, color: "#ef4444", marginTop: 1, fontSize: 11 }}>⚠</span>{r}</div></FadeIn>))}</div></div></div></FadeIn>)}
            {(recDone || !isStreaming) && data?.opportunities?.length > 0 && (<FadeIn delay={200}><div style={{ padding: isMobile ? "16px 18px" : "22px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#38bdf8", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 1, background: "#38bdf8", display: "inline-block" }} /> Opportunities</div><div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{data.opportunities.map((o: string, i: number) => (<FadeIn key={i} delay={i * 60}><div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}><span style={{ flexShrink: 0, color: "#38bdf8", marginTop: 1, fontSize: 11 }}>↗</span>{o}</div></FadeIn>))}</div></div></FadeIn>)}
            {(recDone || !isStreaming) && data?.topCompetitors?.length > 0 && (<FadeIn delay={240}><div style={{ padding: isMobile ? "16px 18px" : "20px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 14px 14px" }}><Label>Top Competitors</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{data.topCompetitors.map((c: string, i: number) => (<span key={i} style={{ fontSize: 12, padding: "5px 13px", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-3)", background: "var(--surface)", fontWeight: 500 }}>{c}</span>))}</div></div></FadeIn>)}
        </div>
    );
}

function InsightPanel({ data }: { data: any }) {
    if (!data) return null;
    const score = data.feasibility?.score;
    const revenueModel = data.blueprint?.revenueModel;
    const marketSize = data.blueprint?.marketSize;
    const timeToMarket = data.feasibility?.timeToMarket;
    const topCompetitors = data.feasibility?.topCompetitors;
    const scoreColor = score !== undefined ? (score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444") : "var(--primary)";
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {revenueModel && (<div style={{ borderRadius: 12, border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)", padding: "18px 20px", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} /><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6366f1", marginBottom: 10 }}>Revenue Model</div><p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{revenueModel}</p>{marketSize && (<div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(99,102,241,0.2)" }}><div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 4 }}>Market Size</div><p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>{marketSize}</p></div>)}</div>)}
            {score !== undefined && (<div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", padding: "18px 20px" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 12 }}>Feasibility</div><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}><span style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-2px", lineHeight: 1, color: scoreColor }}>{score}</span><div><div style={{ fontSize: 11, color: scoreColor, fontWeight: 600 }}>/100</div><div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "capitalize", marginTop: 2 }}>{data.feasibility?.confidence}</div></div></div><div style={{ height: 4, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 10, transition: "width 1.2s ease" }} /></div>{timeToMarket && <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-4)" }}>⏱ {timeToMarket}</div>}</div>)}
            {data.blueprint?.techStack?.length > 0 && (<div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", padding: "16px 18px" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 10 }}>Tech Stack</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{data.blueprint.techStack.map((t: any, i: number) => { const label = typeof t === "string" ? t : t?.name ?? ""; return <span key={i} style={{ fontSize: 11, padding: "3px 9px", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 6, color: "#a5b4fc", background: "rgba(99,102,241,0.06)", fontWeight: 500 }}>{label}</span>; })}</div></div>)}
            {topCompetitors?.length > 0 && (<div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", padding: "16px 18px" }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 10 }}>Competitors</div><div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{topCompetitors.map((c: string, i: number) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--text-3)" }}><span style={{ width: 16, height: 16, borderRadius: 5, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--text-4)", flexShrink: 0 }}>{i + 1}</span>{c}</div>))}</div></div>)}
        </div>
    );
}

const OUTPUTS = [
    { key: "blueprint", label: "Blueprint", number: "01", icon: "📐", desc: "Product vision, core features, tech stack & competitive edge.", accent: "#a78bfa", accentBg: "rgba(139,92,246,0.08)", accentBorder: "rgba(139,92,246,0.2)", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
    { key: "roadmap", label: "Roadmap", number: "02", icon: "🗺️", desc: "Phase-by-phase execution plan with milestones & deliverables.", accent: "#38bdf8", accentBg: "rgba(56,189,248,0.06)", accentBorder: "rgba(56,189,248,0.15)", gradient: "linear-gradient(135deg,#0891b2,#38bdf8)" },
    { key: "prompts", label: "Prompt Packs", number: "03", icon: "⚡", desc: "Ready-to-use AI prompts for every stage of your build.", accent: "#fbbf24", accentBg: "rgba(251,191,36,0.06)", accentBorder: "rgba(251,191,36,0.15)", gradient: "linear-gradient(135deg,#f59e0b,#fcd34d)" },
    { key: "feasibility", label: "Feasibility", number: "04", icon: "📊", desc: "Score, strengths, risks, opportunities & competitor landscape.", accent: "#4ade80", accentBg: "rgba(74,222,128,0.06)", accentBorder: "rgba(74,222,128,0.15)", gradient: "linear-gradient(135deg,#16a34a,#4ade80)" },
];

function ThinkDashboardInnerBase({ mode = "think", onSwitchMode }: { mode?: Mode; onSwitchMode?: (m: Mode) => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const w = useWindowWidth();
    const isMobile = w > 0 && w < 768;

    const [activeTab, setActiveTab] = useState<Tab>("blueprint");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [tabErrors, setTabErrors] = useState<Partial<Record<Tab, string>>>({});
    const [results, setResults] = useState<any>(null);
    const [streamingResults, setStreamingResults] = useState<any>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [currentView, setCurrentView] = useState<"home" | "generate" | "project">("home");
    const [limitData, setLimitData] = useState<{ canGenerate: boolean; remaining: number | null; plan: string }>({ canGenerate: true, remaining: 5, plan: "free" });
    const [ideaInput, setIdeaInput] = useState("");
    const [hoveredOutput, setHoveredOutput] = useState<string | null>(null);
    const [inputFocused, setInputFocused] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    const fetchLimit = useCallback(async () => { try { const res = await fetch("/api/check-limit"); setLimitData(await res.json()); } catch { } }, []);
    const fetchProjects = useCallback(async () => {
        setLoadingProjects(true);
        try { const res = await fetch("/api/projects"); const json = await res.json(); setProjects(json.data ?? []); }
        catch { } finally { setLoadingProjects(false); }
    }, []);
    useEffect(() => { fetchLimit(); fetchProjects(); }, [fetchLimit, fetchProjects]);

    useEffect(() => {
        if (searchParams.get("new") === "1") {
            setResults(null); setStreamingResults(null); setIsStreaming(false);
            setCurrentView("home"); setError(""); setTabErrors({});
            setCurrentProjectId(null); setIdeaInput("");
            router.replace("/dashboard");
        }
    }, [searchParams]);

    const goHome = () => {
        setResults(null); setStreamingResults(null); setIsStreaming(false);
        setCurrentView("home"); setError(""); setTabErrors({}); setCurrentProjectId(null);
        setChatOpen(false);
    };

    const saveProject = async (data: any, submittedIdea: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: data.blueprint?.productName ?? submittedIdea.slice(0, 60), description: submittedIdea, blueprint: data.blueprint ?? null, roadmap: data.roadmap ?? null, prompts: data.prompts ?? null, feasibility: data.feasibility ?? null }) });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setCurrentProjectId(json.data.id); fetchProjects(); fetchLimit();
            window.dispatchEvent(new Event("forge:project-saved"));
        } catch (e) { console.error("Save error:", e); }
        finally { setSaving(false); }
    };

    const handleGenerate = async () => {
        if (!ideaInput.trim() || loading) return;
        const res = await fetch("/api/check-limit");
        const limit = await res.json();
        setLimitData(limit);
        if (!limit.canGenerate) return;
        setLoading(true); setIsStreaming(true); setError(""); setTabErrors({});
        setResults(null); setStreamingResults({}); setCurrentProjectId(null);
        setCurrentView("generate"); setActiveTab("blueprint"); setChatOpen(false);
        try {
            const [blueprintRes, roadmapRes, promptsRes, feasibilityRes] = await Promise.all([
                fetch("/api/generate-blueprint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: ideaInput }) }),
                fetch("/api/generate-roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: ideaInput }) }),
                fetch("/api/generate-prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: ideaInput }) }),
                fetch("/api/feasibility-score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: ideaInput }) }),
            ]);
            const [blueprint, roadmap, prompts, feasibility] = await Promise.all([blueprintRes.json(), roadmapRes.json(), promptsRes.json(), feasibilityRes.json()]);
            const newTabErrors: Partial<Record<Tab, string>> = {};
            if (!blueprint.data) newTabErrors.blueprint = blueprint.error ?? "Failed";
            if (!roadmap.data) newTabErrors.roadmap = roadmap.error ?? "Failed";
            if (!prompts.data) newTabErrors.prompts = prompts.error ?? "Failed";
            if (!feasibility.data) newTabErrors.feasibility = feasibility.error ?? "Failed";
            if (Object.keys(newTabErrors).length > 0) setTabErrors(newTabErrors);
            const newResults = { blueprint: blueprint.data ?? null, roadmap: roadmap.data ?? null, prompts: prompts.data ?? null, feasibility: feasibility.data ?? null };
            setStreamingResults({ blueprint: newResults.blueprint });
            setTimeout(() => setStreamingResults((p: any) => ({ ...p, roadmap: newResults.roadmap })), 500);
            setTimeout(() => setStreamingResults((p: any) => ({ ...p, prompts: newResults.prompts })), 1000);
            setTimeout(() => setStreamingResults((p: any) => ({ ...p, feasibility: newResults.feasibility })), 1500);
            setTimeout(() => { setResults(newResults); setIsStreaming(false); }, 2000);
            if (newResults.blueprint) await saveProject(newResults, ideaInput);
        } catch { setError("Something went wrong. Please try again."); setIsStreaming(false); }
        finally { setLoading(false); }
    };

    const handleLoadProject = async (project: any) => {
        setChatOpen(false);
        try {
            const res = await fetch(`/api/projects/${project.id}`);
            const json = await res.json();
            const p = json.data ?? project;
            setResults({ blueprint: p.blueprint, roadmap: p.roadmap, prompts: p.prompts, feasibility: p.feasibility });
            setStreamingResults(null); setIsStreaming(false); setTabErrors({});
            setCurrentProjectId(p.id); setActiveTab("blueprint"); setCurrentView("project");
        } catch {
            setResults({ blueprint: project.blueprint, roadmap: project.roadmap, prompts: project.prompts, feasibility: project.feasibility });
            setStreamingResults(null); setIsStreaming(false); setTabErrors({});
            setCurrentProjectId(project.id); setActiveTab("blueprint"); setCurrentView("project");
        }
    };

    const TAB_CONFIG = [
        { key: "blueprint" as Tab, label: "Blueprint", color: "#6366f1" },
        { key: "roadmap" as Tab, label: "Roadmap", color: "#8b5cf6" },
        { key: "prompts" as Tab, label: "Prompt Packs", color: "#f59e0b" },
        { key: "feasibility" as Tab, label: "Feasibility", color: "#22c55e" },
    ];

    const displayResults = isStreaming ? streamingResults : results;
    const showResults = displayResults && (currentView === "generate" || currentView === "project");

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            <Sidebar onLoadProject={handleLoadProject} />

            <div className="main-area">
                <div className="main-topbar" style={{ padding: isMobile ? "0 12px 0 48px" : "0 26px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, overflow: "hidden" }}>
                        {showResults ? (
                            <>
                                <button onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 13, fontFamily: "var(--font)", padding: 0, transition: "color 0.15s", whiteSpace: "nowrap", flexShrink: 0 }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-4)"}>
                                    {isMobile ? "←" : "Home"}
                                </button>
                                {!isMobile && <span style={{ color: "var(--border)", fontSize: 13 }}>›</span>}
                                <span className="main-topbar-title" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{displayResults?.blueprint?.productName ?? "Generating..."}</span>
                            </>
                        ) : (
                            <span className="main-topbar-title">Project Generator</span>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexShrink: 0 }}>
                        {saving && !isMobile && <span style={{ fontSize: 12, color: "var(--text-4)" }}>Saving...</span>}
                        {currentProjectId && !saving && !isStreaming && !isMobile && (
                            <span style={{ fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> Saved
                            </span>
                        )}
                        {currentProjectId && !saving && !isStreaming && isMobile && (
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} title="Saved" />
                        )}
                        {limitData.plan === "free" && limitData.remaining !== null && !showResults && (
                            <span style={{ fontSize: 12, color: "var(--text-4)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 20, background: "var(--surface)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                {limitData.remaining}/5 left
                            </span>
                        )}
                        {showResults && !isStreaming && (
                            <button
                                onClick={() => setChatOpen(true)}
                                style={{
                                    fontSize: isMobile ? 11 : 12, padding: isMobile ? "5px 10px" : "5px 13px",
                                    background: "#fff", border: "1px solid #e5e7eb",
                                    borderRadius: 8, color: "#374151", cursor: "pointer",
                                    fontFamily: "var(--font)", fontWeight: 500, whiteSpace: "nowrap",
                                    display: "flex", alignItems: "center", gap: 5,
                                    transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(99,102,241,0.4)"; el.style.color = "#6366f1"; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e5e7eb"; el.style.color = "#374151"; }}
                            >
                                <span style={{ fontSize: 13, color: "#6366f1" }}>✦</span>
                                {isMobile ? "AI" : "Ask AI"}
                            </button>
                        )}
                        {showResults && !isMobile && (
                            <button onClick={goHome} style={{ fontSize: 11.5, padding: "5px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-3)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 500, transition: "all 0.15s", whiteSpace: "nowrap" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}>← Back</button>
                        )}
                        {onSwitchMode && !isMobile && <ModePill current={mode} onSwitch={onSwitchMode} />}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? "80px" : "48px" }}>
                    {!showResults && (
                        <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "24px 16px" : "48px 32px", display: "flex", flexDirection: "column", gap: 36 }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "rgba(99,102,241,0.75)" }}>Think Mode</span>
                                </div>
                                <h1 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 700, letterSpacing: "-1px", color: "var(--text)", marginBottom: 10, lineHeight: 1.15 }}>What are we building today?</h1>
                                <p style={{ fontSize: isMobile ? 14 : 15, color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>Describe your idea — get a blueprint, roadmap, prompt pack & feasibility score in one shot.</p>
                            </div>

                            {!limitData.canGenerate ? (
                                <div style={{ padding: "20px 24px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, fontSize: 14, color: "#d97706" }}>
                                    ⚡ You've used all 5 free generations.{" "}<Link href="/upgrade" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Upgrade to Pro →</Link>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ borderRadius: 16, border: `1.5px solid ${inputFocused ? "rgba(99,102,241,0.5)" : "var(--border)"}`, background: "var(--bg)", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: inputFocused ? "0 0 0 3px rgba(99,102,241,0.08)" : "none", overflow: "hidden" }}>
                                        <textarea value={ideaInput} onChange={e => setIdeaInput(e.target.value)} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }} placeholder="e.g. An AI tool that helps solo founders validate product ideas..." rows={isMobile ? 4 : 5} style={{ width: "100%", padding: "18px 18px 12px", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: isMobile ? 14 : 15, lineHeight: 1.7, fontFamily: "var(--font)", resize: "none", boxSizing: "border-box", display: "block" }} />
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 12px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 8 }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {["AI writing tool", "No-code builder", "B2B SaaS", "Health app"].map(ex => (<button key={ex} onClick={() => setIdeaInput(ex)} style={{ padding: "3px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11.5, color: "var(--text-4)", cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; (e.currentTarget as HTMLElement).style.color = "#a5b4fc"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}>{ex}</button>))}
                                            </div>
                                            {!isMobile && <span style={{ fontSize: 11, color: "var(--text-4)", whiteSpace: "nowrap" }}>⌘ + ↵</span>}
                                        </div>
                                    </div>
                                    <button onClick={handleGenerate} disabled={!ideaInput.trim() || loading} style={{ width: "100%", padding: "15px 24px", borderRadius: 13, border: "none", cursor: ideaInput.trim() && !loading ? "pointer" : "not-allowed", background: ideaInput.trim() && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--surface)", color: ideaInput.trim() && !loading ? "#fff" : "var(--text-4)", fontSize: isMobile ? 14 : 15, fontWeight: 700, fontFamily: "var(--font)", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: ideaInput.trim() && !loading ? "0 6px 24px rgba(99,102,241,0.4)" : "none", letterSpacing: "-0.2px" }}>
                                        {loading ? (<><span style={{ width: 15, height: 15, border: "2.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />Generating all 4 outputs...</>) : "Generate All 4 Outputs ✦"}
                                    </button>
                                    {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>}
                                </div>
                            )}

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 14 }}>What You Get</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {OUTPUTS.map(item => (<div key={item.key} onMouseEnter={() => setHoveredOutput(item.key)} onMouseLeave={() => setHoveredOutput(null)} style={{ padding: isMobile ? "14px 14px 12px" : "20px 20px 18px", borderRadius: 14, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)", background: hoveredOutput === item.key ? item.accentBg : "var(--bg)", border: `1px solid ${hoveredOutput === item.key ? item.accentBorder : "var(--border)"}`, transform: hoveredOutput === item.key ? "translateY(-2px)" : "translateY(0)", boxShadow: hoveredOutput === item.key ? `0 8px 28px ${item.accentBorder}` : "none", display: "flex", flexDirection: "column", gap: isMobile ? 8 : 12 }}><div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}><div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: 10, background: item.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 14 : 17 }}>{item.icon}</div>{!isMobile && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "var(--text-4)" }}>{item.number}</span>}</div><div><div style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 700, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.2px" }}>{item.label}</div>{!isMobile && <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>}</div></div>))}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 14 }}>Recent Projects</div>
                                {loadingProjects ? (<div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-4)", fontSize: 13 }}>Loading...</div>) : projects.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {projects.slice(0, 5).map(p => (<div key={p.id} onClick={() => handleLoadProject(p)} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.02)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div><div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div></div><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, flexShrink: 0, marginLeft: 12, background: p.status === "complete" ? "rgba(34,197,94,0.08)" : "rgba(99,102,241,0.07)", color: p.status === "complete" ? "#22c55e" : "#a5b4fc", border: `1px solid ${p.status === "complete" ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.2)"}` }}>{p.status === "complete" ? "Complete" : "In Progress"}</span></div>))}
                                    </div>
                                ) : (<div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-4)", fontSize: 14 }}>No projects yet — generate your first idea above.</div>)}
                            </div>
                        </div>
                    )}

                    {showResults && (
                        <div style={{ padding: isMobile ? "16px 12px" : "28px 32px" }}>
                            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 1200, margin: "0 auto" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {!isMobile && (
                                        <div style={{ display: "flex", gap: 1, marginBottom: 24, background: "var(--surface)", borderRadius: 10, padding: 4, border: "1px solid var(--border)" }}>
                                            {TAB_CONFIG.map(t => (<button key={t.key} onClick={() => setActiveTab(t.key)} style={{ flex: 1, padding: "7px 14px", border: "none", borderRadius: 7, fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, color: activeTab === t.key ? "#fff" : "var(--text-4)", background: activeTab === t.key ? t.color : "transparent", cursor: "pointer", transition: "all 0.18s", opacity: isStreaming && !displayResults?.[t.key] ? 0.35 : 1, boxShadow: activeTab === t.key ? `0 2px 8px ${t.color}40` : "none", whiteSpace: "nowrap" }}>{t.label}</button>))}
                                        </div>
                                    )}
                                    {tabErrors[activeTab] && (<ErrorBanner message={tabErrors[activeTab]!} onDismiss={() => setTabErrors(p => ({ ...p, [activeTab]: undefined }))} />)}
                                    {isStreaming && !displayResults?.[activeTab] && <GeneratingIndicator activeTab={activeTab} />}
                                    {activeTab === "blueprint" && displayResults?.blueprint && <StreamingBlueprint data={displayResults.blueprint} isStreaming={isStreaming} isMobile={isMobile} />}
                                    {activeTab === "roadmap" && displayResults?.roadmap && <StreamingRoadmap data={displayResults.roadmap} isStreaming={isStreaming} isMobile={isMobile} />}
                                    {activeTab === "prompts" && displayResults?.prompts && <StreamingPrompts data={displayResults.prompts} isStreaming={isStreaming} isMobile={isMobile} />}
                                    {activeTab === "feasibility" && displayResults?.feasibility && <StreamingFeasibility data={displayResults.feasibility} isStreaming={isStreaming} isMobile={isMobile} />}
                                </div>
                                {!isMobile && (<div style={{ width: 260, flexShrink: 0, position: "sticky", top: 0 }}><InsightPanel data={displayResults} /></div>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isMobile && showResults && <MobileResultNav activeTab={activeTab} setActiveTab={setActiveTab} displayResults={displayResults} isStreaming={isStreaming} />}

            {/* Mobile Ask AI floating button */}
            {isMobile && showResults && !isStreaming && (
                <button
                    onClick={() => setChatOpen(true)}
                    style={{
                        position: "fixed", bottom: 68, right: 16, zIndex: 79,
                        padding: "9px 16px", borderRadius: 100,
                        background: "#fff", border: "1px solid #e5e7eb",
                        color: "#374151", fontSize: 13, fontWeight: 600,
                        fontFamily: "var(--font)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    }}
                >
                    <span style={{ color: "#6366f1", fontSize: 14 }}>✦</span> Ask AI
                </button>
            )}

            <ChatDrawer
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                context={displayResults}
                projectName={displayResults?.blueprint?.productName}
            />

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes think-pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
                textarea::placeholder { color: var(--text-4); }
            `}</style>
        </div>
    );
}

export default function ThinkDashboardInner({ mode = "think", onSwitchMode }: { mode?: Mode; onSwitchMode?: (m: Mode) => void }) {
    return (
        <Suspense fallback={null}>
            <ThinkDashboardInnerBase mode={mode} onSwitchMode={onSwitchMode} />
        </Suspense>
    );
}