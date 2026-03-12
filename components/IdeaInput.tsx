"use client";

import { useState } from "react";

interface Props {
  onGenerate: (idea: string) => void;
  loading: boolean;
}

export default function IdeaInput({ onGenerate, loading }: Props) {
  const [idea, setIdea] = useState("");

  const handleSubmit = () => {
    if (!idea.trim() || idea.trim().length < 10 || loading) return;
    onGenerate(idea.trim());
  };

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-3)",
          marginBottom: 8,
        }}
      >
        Describe your product idea
      </label>

      <textarea
        style={{
          width: "100%",
          minHeight: 120,
          padding: "12px 14px",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          fontFamily: "var(--font)",
          fontSize: 14,
          color: "var(--text)",
          background: "var(--bg)",
          outline: "none",
          resize: "vertical",
          lineHeight: 1.6,
          transition: "border-color 0.12s, box-shadow 0.12s",
        }}
        placeholder="e.g. A SaaS tool that helps solo founders validate product ideas using AI-powered user research simulations..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        maxLength={2000}
        disabled={loading}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--border-2)";
          e.target.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.05)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "none";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) handleSubmit();
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-4)" }}>
          {idea.length}/2000 · Press ⌘Enter to generate
        </span>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || idea.trim().length < 10}
          style={{
            opacity: loading || idea.trim().length < 10 ? 0.45 : 1,
            cursor:
              loading || idea.trim().length < 10 ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 13,
                  height: 13,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.65s linear infinite",
                }}
              />
              Generating...
            </>
          ) : (
            <>
              Generate Blueprint
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
