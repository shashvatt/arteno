/**
 * Arteno PDF Download Utility — v2
 * Place at: lib/downloadPDF.ts
 *
 * Calls /api/generate-pdf (server-side Python/ReportLab)
 * for clean black/blue/white output.
 */

export type ThinkResults = {
  blueprint?: any;
  roadmap?: any;
  prompts?: any;
  feasibility?: any;
};

export type ExecuteAgentData = Record<string, any>;

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

function sanitize(s: string): string {
  return (s || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function downloadThinkPDF(results: ThinkResults, idea: string) {
  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "think", results, idea }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  triggerDownload(blob, `arteno-think-${sanitize(results.blueprint?.productName || idea)}.pdf`);
}

export async function downloadExecutePDF(
  agentKey: "founder" | "sales" | "marketing" | "hacker",
  data: ExecuteAgentData,
  idea: string
) {
  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "execute", agentKey, data, idea }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  triggerDownload(blob, `arteno-${agentKey}-${sanitize(data?.companyName || idea)}.pdf`);
}