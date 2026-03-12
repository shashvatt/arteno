"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "pro";

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      fontFamily: "var(--font)",
      padding: 24,
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 400,
        width: "100%",
        animation: "fadeup 0.4s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(22,163,74,0.1)",
          border: "2px solid rgba(22,163,74,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.5px", marginBottom: 8, color: "var(--text)" }}>
          Payment successful!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 8 }}>
          Welcome to Arteno{" "}
          <span style={{ fontWeight: 600, textTransform: "capitalize", color: "var(--text)" }}>
            {plan}
          </span>
          . Your plan is now active.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 32 }}>
          Redirecting to dashboard in 5 seconds...
        </p>

        <Link href="/dashboard">
          <button style={{
            padding: "10px 24px",
            background: "var(--text)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r)",
            fontFamily: "var(--font)",
            fontSize: 13.5,
            fontWeight: 500,
            cursor: "pointer",
            width: "100%",
            maxWidth: 200,
          }}>
            Go to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}