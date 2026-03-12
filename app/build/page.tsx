"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FileNode {
  path: string;
  description: string;
  selected: boolean;
  status: "pending" | "generating" | "done" | "error" | "skipped";
  code: string;
  language: string;
}

interface Blueprint {
  productName: string;
  problemStatement: string;
  targetAudience: string;
  coreFeatures: string[];
  techStack: string[];
  revenueModel: string;
  coreValueProposition?: string;
}

type Stage = "idle" | "filetree" | "generating" | "review";

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectLanguage(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".sql")) return "sql";
  if (path.endsWith(".env") || path.endsWith(".env.example")) return "bash";
  return "text";
}

function fileColor(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "#2563eb";
  if (path.endsWith(".json")) return "#d97706";
  if (path.endsWith(".md")) return "#16a34a";
  if (path.endsWith(".css")) return "#db2777";
  if (path.endsWith(".sql")) return "#0891b2";
  if (path.endsWith(".env") || path.endsWith(".env.example")) return "#ea580c";
  return "#64748b";
}

function fileIcon(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "⬡";
  if (path.endsWith(".json")) return "{}";
  if (path.endsWith(".md")) return "≡";
  if (path.endsWith(".css")) return "◈";
  if (path.endsWith(".sql")) return "⊞";
  if (path.endsWith(".env") || path.endsWith(".env.example")) return "⊕";
  return "·";
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 14, color = "#2563eb" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, animation: "hk-spin 0.75s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.15" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── Log line ──────────────────────────────────────────────────────────────────
function LogLine({ text, type = "info" }: { text: string; type?: "info" | "success" | "error" | "dim" | "highlight" }) {
  const cfg = {
    info: { color: "#475569", prefix: "▸", pc: "#94a3b8" },
    success: { color: "#16a34a", prefix: "✓", pc: "#22c55e" },
    error: { color: "#dc2626", prefix: "✕", pc: "#ef4444" },
    dim: { color: "#cbd5e1", prefix: " ", pc: "#e2e8f0" },
    highlight: { color: "#2563eb", prefix: "⚡", pc: "#3b82f6" },
  }[type];
  return (
    <div style={{ display: "flex", gap: 8, fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 11.5, lineHeight: 1.8, alignItems: "flex-start" }}>
      <span style={{ color: cfg.pc, flexShrink: 0, userSelect: "none" }}>{cfg.prefix}</span>
      <span style={{ color: cfg.color }}>{text}</span>
    </div>
  );
}

// ── Code block ────────────────────────────────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: copied ? "#f0fdf4" : "#f1f5f9", border: `1px solid ${copied ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "monospace", color: copied ? "#16a34a" : "#64748b", transition: "all 0.15s" }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "20px 20px", overflowX: "auto", fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12.5, lineHeight: 1.8, color: "#1e293b", background: "#ffffff", whiteSpace: "pre", maxHeight: "calc(100vh - 160px)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #2563eb, #60a5fa)", borderRadius: 4, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 0 8px rgba(37,99,235,0.4)" }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", minWidth: 34, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ── Inner ─────────────────────────────────────────────────────────────────────
function BuildPageInner() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user);
      setIsLoaded(true);
    });
  }, []);

  // Inject styles client-side only to avoid hydration mismatch
  useEffect(() => {
    const id = "hacker-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      @keyframes hk-spin { to { transform: rotate(360deg); } }
      @keyframes hk-fadeup { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes hk-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.3); } 50% { box-shadow: 0 0 0 6px rgba(37,99,235,0); } }
      @keyframes hk-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      .hk-file-row:hover { background: #f0f7ff !important; }
      .hk-tab:hover { background: #f1f5f9 !important; color: #334155 !important; }
      .hk-ghost:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #475569 !important; }
      .hk-icon-btn:hover { background: #f1f5f9 !important; color: #334155 !important; }
      .hk-back:hover { background: #f0f7ff !important; border-color: #bfdbfe !important; color: #2563eb !important; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 6px; }
      ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [stage, setStage] = useState<Stage>("idle");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ text: string; type: "info" | "success" | "error" | "dim" | "highlight" }>>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isBlueprintLoading, setIsBlueprintLoading] = useState(false);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedFiles = fileTree.filter(f => f.selected);
  const doneFiles = fileTree.filter(f => f.status === "done");
  const activeFileData = fileTree.find(f => f.path === activeFile);
  const totalSelected = selectedFiles.length;

  useEffect(() => { if (isLoaded && !isSignedIn) router.push("/sign-in"); }, [isLoaded, isSignedIn, router]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const addLog = useCallback((text: string, type: "info" | "success" | "error" | "dim" | "highlight" = "info") => {
    setLogs(prev => [...prev, { text, type }]);
  }, []);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      setIsBlueprintLoading(true);
      addLog("Loading project...", "dim");
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const bp = data.data?.blueprint ?? data.blueprint ?? data.project?.blueprint;
        if (bp?.productName) {
          if (Array.isArray(bp.coreFeatures)) {
            bp.coreFeatures = bp.coreFeatures.map((f: any) =>
              typeof f === "string" ? f : f.name ?? f.title ?? f.feature ?? JSON.stringify(f)
            );
          }
          setBlueprint(bp);
          setStage("filetree");
          addLog(`Blueprint loaded — ${bp.productName}`, "success");
          addLog("Click 'Plan Files' to generate your file tree.", "info");
        } else {
          addLog("No blueprint found in this project.", "error");
        }
      } catch (e: any) { addLog(`Failed: ${e.message}`, "error"); }
      setIsBlueprintLoading(false);
    };
    load();
  }, [projectId, addLog]);

  // Generate file tree
  const generateFileTree = async () => {
    if (!blueprint) return;
    setIsLoadingTree(true); setFileTree([]); setActiveFile(null); setLogs([]);
    addLog("Analysing blueprint...", "highlight");
    addLog(`Stack: ${blueprint.techStack?.join(", ") || "Next.js, Supabase, Tailwind"}`, "dim");
    try {
      const res = await fetch("/api/build/file-tree", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (!data.files || !Array.isArray(data.files)) throw new Error("No file array");
      const nodes: FileNode[] = data.files.map((f: { path: string; description: string }) => ({
        path: f.path, description: f.description, selected: true,
        status: "pending", code: "", language: detectLanguage(f.path),
      }));
      setFileTree(nodes); setStage("filetree");
      addLog(`${nodes.length} files planned.`, "success");
      addLog("Deselect files you don't need, then generate.", "info");
    } catch (e: any) { addLog(`Error: ${e.message}`, "error"); }
    setIsLoadingTree(false);
  };

  // Generate all files
  const startGeneration = async () => {
    const toGenerate = fileTree.filter(f => f.selected);
    if (!toGenerate.length) return;
    setStage("generating"); setLogs([]);
    addLog(`Generating ${toGenerate.length} files...`, "highlight");
    const generated: Record<string, string> = {};

    for (let i = 0; i < toGenerate.length; i++) {
      const file = toGenerate[i];
      setCurrentlyGenerating(file.path);
      setFileTree(prev => prev.map(f => f.path === file.path ? { ...f, status: "generating" } : f));
      addLog(`Writing ${file.path}`, "info");
      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/build/generate-file", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blueprint, filePath: file.path, fileDescription: file.description, existingFiles: generated, allFiles: toGenerate.map(f => f.path) }),
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let code = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            code += decoder.decode(value, { stream: true });
            setFileTree(prev => prev.map(f => f.path === file.path ? { ...f, code } : f));
          }
        }
        generated[file.path] = code;
        setFileTree(prev => prev.map(f => f.path === file.path ? { ...f, status: "done", code } : f));
        addLog(`${file.path} — done`, "success");
        if (i === 0) setActiveFile(file.path);
      } catch (e: any) {
        if (e.name === "AbortError") {
          addLog("Cancelled.", "error");
          setFileTree(prev => prev.map(f => f.status === "generating" ? { ...f, status: "pending" } : f));
          setCurrentlyGenerating(null); setStage("filetree"); return;
        }
        setFileTree(prev => prev.map(f => f.path === file.path ? { ...f, status: "error" } : f));
        addLog(`Failed: ${file.path}`, "error");
      }
      await new Promise(r => setTimeout(r, 180));
    }
    setCurrentlyGenerating(null); setStage("review");
    addLog("", "dim");
    addLog(`All ${doneFiles.length + 1} files ready. Download below.`, "highlight");
  };

  // Regenerate single file
  const regenerateFile = async (filePath: string) => {
    const file = fileTree.find(f => f.path === filePath);
    if (!file) return;
    const generated: Record<string, string> = {};
    fileTree.filter(f => f.status === "done" && f.path !== filePath).forEach(f => { generated[f.path] = f.code; });
    setFileTree(prev => prev.map(f => f.path === filePath ? { ...f, status: "generating", code: "" } : f));
    addLog(`Regenerating ${filePath}...`, "info");
    try {
      const res = await fetch("/api/build/generate-file", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint, filePath, fileDescription: file.description, existingFiles: generated, allFiles: fileTree.filter(f => f.selected).map(f => f.path) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let code = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          code += decoder.decode(value, { stream: true });
          setFileTree(prev => prev.map(f => f.path === filePath ? { ...f, code } : f));
        }
      }
      setFileTree(prev => prev.map(f => f.path === filePath ? { ...f, status: "done", code } : f));
      addLog(`${filePath} — regenerated`, "success");
    } catch (e: any) {
      setFileTree(prev => prev.map(f => f.path === filePath ? { ...f, status: "error" } : f));
      addLog(`Failed: ${filePath}`, "error");
    }
  };

  // Download zip
  const downloadZip = async () => {
    addLog("Packaging project...", "info");
    const files = fileTree.filter(f => f.status === "done").map(f => ({ path: f.path, code: f.code }));
    try {
      const res = await fetch("/api/build/download", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, productName: blueprint?.productName || "project" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(blueprint?.productName || "project").toLowerCase().replace(/\s+/g, "-")}.zip`;
      a.click(); URL.revokeObjectURL(url);
      addLog("Download started!", "success");
    } catch (e: any) { addLog(`Download failed: ${e.message}`, "error"); }
  };

  const cancelGeneration = () => abortRef.current?.abort();
  const stageOrder: Record<string, number> = { idle: -1, filetree: 0, generating: 1, review: 2 };
  const currentStageIndex = stageOrder[stage] ?? -1;

  // No project screen
  if (!projectId) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28, boxShadow: "0 8px 32px rgba(37,99,235,0.15)" }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.4px" }}>No project selected</h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 28 }}>Launch Hacker from a project in your dashboard to start generating code.</p>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff", borderRadius: 10, fontSize: 13.5, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'JetBrains Mono','Fira Code',monospace", display: "flex", flexDirection: "column", color: "#0f172a" }}>

      {/* ── TOPBAR ── */}
      <header style={{ height: 52, borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", gap: 12, boxShadow: "0 1px 0 #e2e8f0, 0 4px 16px rgba(37,99,235,0.04)" }}>

        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <Link href="/dashboard" className="hk-back" style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", textDecoration: "none", fontSize: 12, fontWeight: 500, padding: "5px 11px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Dashboard
          </Link>

          <div style={{ width: 1, height: 16, background: "#e2e8f0", flexShrink: 0 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}>⚡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px", lineHeight: 1.2 }}>Hacker</div>
              <div style={{ fontSize: 9.5, color: "#94a3b8", lineHeight: 1 }}>AI Code Agent</div>
            </div>
          </div>

          {blueprint && (
            <>
              <div style={{ width: 1, height: 16, background: "#e2e8f0", flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{blueprint.productName}</span>
            </>
          )}
          {isBlueprintLoading && <Spinner size={12} color="#94a3b8" />}
        </div>

        {/* Center: stage pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {(["File Tree", "Generate", "Review"] as const).map((label, i) => {
            const keys = ["filetree", "generating", "review"] as const;
            const isDone = currentStageIndex > i;
            const isActive = stage === keys[i];
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <div style={{ width: 20, height: 1, background: isDone ? "#bbf7d0" : "#e2e8f0" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: isActive ? "#eff6ff" : isDone ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isActive ? "#bfdbfe" : isDone ? "#bbf7d0" : "#e2e8f0"}`, transition: "all 0.25s", boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.12)" : "none" }}>
                  {isDone
                    ? <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#16a34a" }}>✓</div>
                    : <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#2563eb" : "#cbd5e1", boxShadow: isActive ? "0 0 0 3px rgba(37,99,235,0.15)" : "none", transition: "all 0.25s" }} />
                  }
                  <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? "#1d4ed8" : isDone ? "#16a34a" : "#94a3b8", transition: "color 0.25s" }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
          {stage === "generating" && (
            <button onClick={cancelGeneration} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "#fff5f5", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fef2f2"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff5f5"}>
              Stop
            </button>
          )}
          {stage === "review" && doneFiles.length > 0 && (
            <button onClick={downloadZip} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.35)", transition: "all 0.2s", letterSpacing: "0.01em" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 22px rgba(37,99,235,0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(37,99,235,0.35)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download .zip
            </button>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", height: "calc(100vh - 52px)" }}>

        {/* ── LEFT: File Explorer ── */}
        <aside style={{ width: 244, borderRight: "1px solid #e2e8f0", background: "#ffffff", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 12px rgba(37,99,235,0.04)" }}>

          <div style={{ padding: "13px 14px 10px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Explorer</span>
              {fileTree.length > 0 && <span style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "monospace" }}>{totalSelected}/{fileTree.length}</span>}
            </div>
            {blueprint && <div style={{ marginTop: 5, fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{blueprint.productName}</div>}
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {fileTree.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 20, boxShadow: "0 4px 12px rgba(37,99,235,0.1)" }}>📁</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                  {isBlueprintLoading ? "Loading blueprint..." : blueprint ? "Click Plan Files below" : "No project loaded"}
                </div>
              </div>
            ) : (
              fileTree.map((file, idx) => {
                const isAct = activeFile === file.path;
                const parts = file.path.split("/");
                const fileName = parts[parts.length - 1];
                const dir = parts.slice(0, -1).join("/");
                const dotColors: Record<string, string> = {
                  pending: "#e2e8f0", generating: "#2563eb", done: "#22c55e", error: "#ef4444", skipped: "#94a3b8"
                };

                return (
                  <div key={file.path} className="hk-file-row" onClick={() => setActiveFile(file.path)}
                    style={{ padding: "5px 10px 5px 12px", cursor: "pointer", background: isAct ? "#eff6ff" : "transparent", borderLeft: `2px solid ${isAct ? "#2563eb" : "transparent"}`, transition: "all 0.1s", display: "flex", alignItems: "center", gap: 8 }}>

                    {stage === "filetree" && (
                      <div onClick={e => { e.stopPropagation(); setFileTree(prev => prev.map(f => f.path === file.path ? { ...f, selected: !f.selected } : f)); }}
                        style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${file.selected ? "#2563eb" : "#cbd5e1"}`, background: file.selected ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s", boxShadow: file.selected ? "0 0 0 3px rgba(37,99,235,0.1)" : "none" }}>
                        {file.selected && <span style={{ color: "#fff", fontSize: 8.5, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                      </div>
                    )}

                    {stage !== "filetree" && (
                      <div style={{ flexShrink: 0, width: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {file.status === "generating"
                          ? <Spinner size={12} color="#2563eb" />
                          : <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColors[file.status], boxShadow: file.status === "done" ? "0 0 6px rgba(34,197,94,0.5)" : (activeFileData?.status as string) === "generating" ? "0 0 6px rgba(37,99,235,0.5)" : "none", transition: "all 0.3s" }} />
                        }
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {dir && <div style={{ fontSize: 9.5, color: "#cbd5e1", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}/</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 9, color: fileColor(file.path), flexShrink: 0 }}>{fileIcon(file.path)}</span>
                        <span style={{ fontSize: 12, color: (file.selected || stage !== "filetree") ? fileColor(file.path) : "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s", fontWeight: isAct ? 600 : 400 }}>
                          {fileName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar buttons */}
          <div style={{ padding: "10px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 6 }}>
            {(stage === "idle" || (stage === "filetree" && fileTree.length === 0)) && (
              <button onClick={generateFileTree} disabled={isLoadingTree || !blueprint || isBlueprintLoading}
                style={{ width: "100%", padding: "10px 0", background: (isLoadingTree || !blueprint || isBlueprintLoading) ? "#f1f5f9" : "linear-gradient(135deg, #1d4ed8, #2563eb)", color: (isLoadingTree || !blueprint || isBlueprintLoading) ? "#94a3b8" : "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: (isLoadingTree || !blueprint || isBlueprintLoading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", letterSpacing: "0.01em", boxShadow: (!isLoadingTree && blueprint && !isBlueprintLoading) ? "0 4px 14px rgba(37,99,235,0.3)" : "none" }}>
                {isLoadingTree || isBlueprintLoading ? <><Spinner size={13} color="#94a3b8" /> Analysing...</> : <>⚡ Plan Files</>}
              </button>
            )}

            {stage === "filetree" && fileTree.length > 0 && (
              <>
                <button onClick={startGeneration} disabled={totalSelected === 0}
                  style={{ width: "100%", padding: "10px 0", background: totalSelected === 0 ? "#f1f5f9" : "linear-gradient(135deg, #1d4ed8, #2563eb)", color: totalSelected === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: totalSelected === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", letterSpacing: "0.01em", boxShadow: totalSelected > 0 ? "0 4px 14px rgba(37,99,235,0.3)" : "none" }}>
                  ⚡ Generate {totalSelected} File{totalSelected !== 1 ? "s" : ""}
                </button>
                <button onClick={() => { setFileTree([]); setStage("filetree"); }} className="hk-ghost"
                  style={{ width: "100%", padding: "7px 0", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
                  Re-plan
                </button>
              </>
            )}

            {stage === "review" && (
              <>
                <button onClick={downloadZip}
                  style={{ width: "100%", padding: "10px 0", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, letterSpacing: "0.01em", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", transition: "all 0.2s" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download .zip
                </button>
                <button onClick={() => { setFileTree([]); setStage("filetree"); setActiveFile(null); setLogs([]); }} className="hk-ghost"
                  style={{ width: "100%", padding: "7px 0", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
                  Re-plan files
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ── CENTER: Editor ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffff", minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ height: 40, borderBottom: "1px solid #f1f5f9", background: "#fafafa", display: "flex", alignItems: "center", padding: "0 2px", gap: 0, overflowX: "auto", flexShrink: 0 }}>
            {fileTree.filter(f => f.status === "done" || f.status === "generating").slice(0, 12).map(f => {
              const isAct = activeFile === f.path;
              return (
                <button key={f.path} className="hk-tab" onClick={() => setActiveFile(f.path)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "none", borderBottom: `2px solid ${isAct ? "#2563eb" : "transparent"}`, borderRight: "1px solid #f1f5f9", background: isAct ? "#ffffff" : "transparent", color: isAct ? "#1d4ed8" : "#94a3b8", cursor: "pointer", fontSize: 11.5, whiteSpace: "nowrap", transition: "all 0.1s", flexShrink: 0, fontFamily: "inherit", fontWeight: isAct ? 600 : 400 }}>
                  {f.status === "generating" ? <Spinner size={10} color="#2563eb" /> : <span style={{ fontSize: 8.5, color: fileColor(f.path) }}>{fileIcon(f.path)}</span>}
                  {f.path.split("/").pop()}
                </button>
              );
            })}
          </div>

          {/* Editor area */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {!activeFileData?.code ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {stage === "generating" && currentlyGenerating ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#eff6ff", border: "2px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 6px rgba(37,99,235,0.08), 0 8px 24px rgba(37,99,235,0.15)", animation: "hk-pulse 2s ease-in-out infinite" }}>
                        <Spinner size={22} color="#2563eb" />
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: "#334155", marginBottom: 6, fontWeight: 600 }}>Writing code...</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{currentlyGenerating}</div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", maxWidth: 360, padding: 40 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26, boxShadow: "0 8px 28px rgba(37,99,235,0.14)" }}>⚡</div>
                    <div style={{ fontSize: 16, color: "#0f172a", marginBottom: 10, fontWeight: 700, letterSpacing: "-0.3px" }}>
                      {blueprint ? (fileTree.length > 0 ? "Ready to generate" : "Ready to plan") : "Loading..."}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.85 }}>
                      {blueprint
                        ? fileTree.length > 0
                          ? `${totalSelected} files selected. Hit Generate to start.`
                          : `Click Plan Files to build a file tree for ${blueprint.productName}.`
                        : "Loading your blueprint..."
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* File header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", background: "#fafafa", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, zIndex: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, color: fileColor(activeFileData.path) }}>{fileIcon(activeFileData.path)}</span>
                    <span style={{ fontSize: 12.5, color: fileColor(activeFileData.path), fontWeight: 600 }}>{activeFileData.path}</span>
                    {activeFileData.code && (
                      <span style={{ fontSize: 10.5, color: "#94a3b8", background: "#f1f5f9", padding: "1px 7px", borderRadius: 5 }}>
                        {activeFileData.code.split("\n").length}L · {(activeFileData.code.length / 1024).toFixed(1)}kb
                      </span>
                    )}
                  </div>
                  {(stage === "generating" || stage === "review") && (
                    <button onClick={() => regenerateFile(activeFileData.path)} disabled={activeFileData.status === "generating"} className="hk-icon-btn"
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, color: "#64748b", cursor: activeFileData.status === "generating" ? "not-allowed" : "pointer", fontSize: 11.5, transition: "all 0.15s", fontFamily: "inherit" }}>
                      {activeFileData.status === "generating" ? <Spinner size={11} color="#94a3b8" /> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>}
                      Regenerate
                    </button>
                  )}
                </div>
                <CodeBlock code={activeFileData.code} language={activeFileData.language} />
              </div>
            )}
          </div>

          {/* Progress bar */}
          {stage === "generating" && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", background: "#fafafa", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>{currentlyGenerating ? currentlyGenerating.split("/").pop() : "Processing..."}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{doneFiles.length}/{totalSelected} done</span>
              </div>
              <ProgressBar done={doneFiles.length} total={totalSelected} />
            </div>
          )}
        </main>

        {/* ── RIGHT: Terminal / Info ── */}
        <aside style={{ width: 268, borderLeft: "1px solid #e2e8f0", background: "#ffffff", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "-2px 0 12px rgba(37,99,235,0.04)" }}>

          {/* Terminal header */}
          <div style={{ padding: "11px 14px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.75 }} />
              ))}
            </div>
            <span style={{ fontSize: 10.5, color: "#94a3b8", letterSpacing: "0.05em", fontFamily: "monospace" }}>output</span>
            {stage === "generating" && <Spinner size={11} color="#2563eb" />}
          </div>

          {/* Logs */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 13px", display: "flex", flexDirection: "column", gap: 0, background: "#fafafa" }}>
            {logs.length === 0
              ? <LogLine text="Awaiting instructions..." type="dim" />
              : logs.map((l, i) => <LogLine key={i} text={l.text} type={l.type} />)
            }
            <div ref={logsEndRef} />
          </div>

          {/* Active file info */}
          {activeFileData && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 7 }}>Selected File</div>
              <div style={{ fontSize: 11.5, color: fileColor(activeFileData.path), marginBottom: 5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeFileData.path}</div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.65 }}>{activeFileData.description}</div>
            </div>
          )}

          {/* Blueprint preview */}
          {blueprint && stage === "filetree" && fileTree.length === 0 && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Blueprint</div>
              <div style={{ fontSize: 12.5, color: "#1e293b", marginBottom: 8, fontWeight: 600 }}>{blueprint.productName}</div>
              {blueprint.coreFeatures?.slice(0, 3).map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: "#64748b", lineHeight: 1.9, display: "flex", gap: 6 }}>
                  <span style={{ color: "#2563eb", flexShrink: 0 }}>›</span><span>{f}</span>
                </div>
              ))}
              {blueprint.techStack?.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {blueprint.techStack.slice(0, 4).map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 7px", border: "1px solid #e2e8f0", borderRadius: 5, color: "#64748b", background: "#f8fafc" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary in review */}
          {stage === "review" && doneFiles.length > 0 && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {[
                  { label: "Files", value: doneFiles.length },
                  { label: "Lines", value: doneFiles.reduce((a, f) => a + f.code.split("\n").length, 0).toLocaleString() },
                  { label: "Size", value: `${(doneFiles.reduce((a, f) => a + f.code.length, 0) / 1024).toFixed(1)}kb` },
                  { label: "Stack", value: blueprint?.techStack?.[0] ?? "Next.js" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "9px 10px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, boxShadow: "0 1px 4px rgba(37,99,235,0.05)" }}>
                    <div style={{ fontSize: 9.5, color: "#94a3b8", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function BuildPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "hk-spin 0.75s linear infinite" }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.15" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Loading Hacker...
        </div>
      </div>
    }>
      <BuildPageInner />
    </Suspense>
  );
}