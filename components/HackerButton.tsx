"use client";

import Link from "next/link";

interface HackerButtonProps {
  projectId: string;
  size?: "sm" | "md";
}

export function HackerButton({ projectId, size = "md" }: HackerButtonProps) {
  const isSm = size === "sm";
  return (
    <Link
      href={`/build?project=${projectId}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSm ? 5 : 7,
        padding: isSm ? "5px 12px" : "8px 16px",
        background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
        color: "#fff",
        borderRadius: isSm ? 6 : 8,
        fontSize: isSm ? 12 : 13,
        fontWeight: 600,
        textDecoration: "none",
        fontFamily: "var(--font)",
        letterSpacing: "-0.1px",
        boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
        transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.opacity = "0.9";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.45)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.35)";
      }}
    >
      <span style={{ fontSize: isSm ? 11 : 13 }}>⚡</span>
      Build with Hacker
    </Link>
  );
}
