"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  context: {
    blueprint?: any;
    roadmap?: any;
    prompts?: any;
    feasibility?: any;
  } | null;
  projectName?: string;
};

const SUGGESTIONS = [
  "How do I validate this?",
  "What's the MVP scope?",
  "Who should I target first?",
  "Biggest risks?",
  "How to get first 10 users?",
  "What funding to raise?",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "#9ca3af",
          display: "inline-block",
          animation: `cdot 1.3s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

function ChatDrawer({ isOpen, onClose, context, projectName }: ChatDrawerProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [messages, setMessages] = useState<Message[]>([]);
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
      setTimeout(() => inputRef.current?.focus(), 320);
      if (messages.length === 0) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `I'm fully briefed on **${projectName ?? "your project"}**. Ask me anything about strategy, validation, tech, or go-to-market.`,
        }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
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
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: content, context, history }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
        @keyframes cdot {
          0%,100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes cmsg {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cspin { to { transform: rotate(360deg); } }
        @keyframes cfadein { from { opacity:0; } to { opacity:1; } }
        .cmsg { animation: cmsg 0.2s ease both; }
        .cinput::placeholder { color: #9ca3af; font-size: 13.5px; }
        .cscroll::-webkit-scrollbar { width: 4px; }
        .cscroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .cchip:hover { background: #f3f4f6 !important; border-color: #d1d5db !important; color: #374151 !important; }
      `}</style>

      {/* Backdrop */}
      {isOpen && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,0.18)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          animation: "cfadein 0.18s ease both",
        }} />
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
        boxShadow: "0 -4px 40px rgba(0,0,0,0.08)",
        fontFamily: "'Inter',-apple-system,sans-serif",
      }}>

        {/* Drag handle */}
        <div onMouseDown={handleDragStart} style={{ padding: "10px 0 4px", cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "6px 20px 12px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* AI Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", flexShrink: 0,
            }}>✦</div>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="cscroll" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, background: "#fafafa" }}>

          {/* Suggestion chips — only on welcome */}
          {messages.length <= 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="cchip" onClick={() => sendMessage(s)} style={{
                  fontSize: 12, color: "#6b7280",
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 100, padding: "5px 12px",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.12s", whiteSpace: "nowrap",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className="cmsg" style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 8, alignItems: "flex-start",
            }}>
              {/* AI avatar on assistant messages */}
              {msg.role === "assistant" && (
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff", marginTop: 2,
                }}>✦</div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: msg.role === "user"
                  ? "14px 4px 14px 14px"
                  : "4px 14px 14px 14px",
                background: msg.role === "user" ? "#0b172a" : "#fff",
                border: msg.role === "assistant" ? "1px solid #e5e7eb" : "none",
                fontSize: 13.5,
                color: msg.role === "user" ? "#fff" : "#1f2937",
                lineHeight: 1.65,
                boxShadow: msg.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
              }}
                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
              />
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="cmsg" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✦</div>
              <div style={{ padding: "10px 14px", borderRadius: "4px 14px 14px 14px", background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #f3f4f6", background: "#fff", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            background: "#f9fafb",
            border: "1.5px solid #e5e7eb",
            borderRadius: 12, padding: "8px 8px 8px 14px",
            transition: "border-color 0.15s",
          }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"}
          >
            <textarea
              ref={inputRef}
              className="cinput"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your project..."
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#111827", fontSize: 13.5, fontFamily: "inherit",
                resize: "none", lineHeight: 1.55, maxHeight: 100, overflowY: "auto",
              }}
              onInput={e => {
                const el = e.currentTarget as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 100) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: input.trim() && !loading ? "#0b172a" : "#f3f4f6",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "default",
                color: input.trim() && !loading ? "#fff" : "#9ca3af",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.background = "#1a2d4a"; }}
              onMouseLeave={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.background = "#0b172a"; }}
            >
              {loading
                ? <span style={{ width: 12, height: 12, border: "1.5px solid #d1d5db", borderTopColor: "#6366f1", borderRadius: "50%", animation: "cspin 0.6s linear infinite", display: "inline-block" }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 7, fontSize: 10.5, color: "#d1d5db" }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatDrawer;