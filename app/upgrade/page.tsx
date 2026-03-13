"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

declare global {
  interface Window { Razorpay: any; }
}

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconBolt = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const plans = [
  {
    key: "free",
    name: "Free",
    price: 0,
    description: "Perfect for exploring Forge AI and occasional use.",
    cta: "Current plan",
    highlighted: false,
    features: [
      { text: "5 project generations / month", included: true },
      { text: "Product Blueprint", included: true },
      { text: "Execution Roadmap", included: true },
      { text: "AI Prompt Packs", included: true },
      { text: "Feasibility Score", included: true },
      { text: "Save & revisit projects", included: true },
      { text: "Unlimited projects", included: false },
      { text: "Priority AI generation", included: false },
      { text: "Team collaboration", included: false },
      { text: "Admin controls & billing", included: false },
      { text: "Early access to new features", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 1699,
    badge: "Most popular",
    description: "For builders who use Forge AI daily and need full power.",
    cta: "Upgrade to Pro",
    highlighted: true,
    features: [
      { text: "Unlimited project generations", included: true },
      { text: "Product Blueprint", included: true },
      { text: "Execution Roadmap", included: true },
      { text: "AI Prompt Packs", included: true },
      { text: "Feasibility Score", included: true },
      { text: "Save & revisit projects", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Priority AI generation", included: true },
      { text: "Team collaboration", included: false },
      { text: "Admin controls & billing", included: false },
      { text: "Early access to new features", included: true },
    ],
  },
  {
    key: "team",
    name: "Team",
    price: 2499,
    description: "For teams building together with shared workspace and admin tools.",
    cta: "Start Team plan",
    highlighted: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Product Blueprint", included: true },
      { text: "Execution Roadmap", included: true },
      { text: "AI Prompt Packs", included: true },
      { text: "Feasibility Score", included: true },
      { text: "Save & revisit projects", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Priority AI generation", included: true },
      { text: "Team collaboration workspace", included: true },
      { text: "Admin controls & billing", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
];

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

export default function UpgradePage() {
  const router = useRouter();
  const w = useWindowWidth();
  const isMobile = w > 0 && w < 768;
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/sign-in"); return; }
      setUserEmail(user.email ?? "");
      setUserName(user.user_metadata?.full_name ?? "");
    });
  }, []);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planKey: "pro" | "team") => {
    if (!userEmail) { router.push("/sign-in"); return; }
    setError(""); setLoadingPlan(planKey);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setError("Failed to load payment gateway. Please try again."); setLoadingPlan(null); return; }
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Forge AI",
        description: orderData.planName,
        order_id: orderData.orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#0d0d0d" },
        modal: { ondismiss: () => setLoadingPlan(null) },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey, email: userEmail,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);
            router.push(`/payment-success?plan=${planKey}`);
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
            setLoadingPlan(null);
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <div className="main-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <button onClick={() => router.back()}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 13, fontFamily: "var(--font)", padding: 0, display: "flex", alignItems: "center", gap: 5, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-4)"}>
              ← Back
            </button>
            <span style={{ color: "var(--border)", fontSize: 13 }}>›</span>
            <span className="main-topbar-title">Upgrade</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "28px 16px 48px" : "48px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 40, animation: "fadeup 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 500, color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--surface)", padding: "4px 12px", borderRadius: 20, marginBottom: 16 }}>
                <IconBolt />Simple, transparent pricing
              </div>
              <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.8px", marginBottom: 10, color: "var(--text)" }}>Build more with Arteno</h1>
              <p style={{ fontSize: isMobile ? 13.5 : 15, color: "var(--text-3)", lineHeight: 1.6 }}>Choose the plan that fits how you build.</p>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--r)", fontSize: 13, color: "#dc2626", marginBottom: 24, textAlign: "center" }}>
                {error}
              </div>
            )}

            {/* Pricing cards — single column on mobile, 3 cols on desktop */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: isMobile ? 14 : 16,
              animation: "fadeup 0.5s cubic-bezier(0.16,1,0.3,1) 0.08s both",
            }}>
              {plans.map((plan) => (
                <div key={plan.key}
                  style={{
                    border: plan.highlighted ? "2px solid var(--text)" : "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    background: plan.highlighted ? "var(--text)" : "var(--bg)",
                    padding: isMobile ? 20 : 24,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!isMobile) { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; } }}
                  onMouseLeave={(e) => { if (!isMobile) { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; } }}>

                  {plan.badge && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap", border: "2px solid var(--bg)" }}>{plan.badge}</div>
                  )}

                  {/* Plan name + price */}
                  <div style={{ display: "flex", alignItems: isMobile ? "center" : "flex-start", justifyContent: isMobile ? "space-between" : "flex-start", flexDirection: isMobile ? "row" : "column", marginBottom: isMobile ? 10 : 0, gap: isMobile ? 0 : 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: plan.highlighted ? "#fff" : "var(--text)", marginBottom: isMobile ? 0 : 6 }}>{plan.name}</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                      {plan.price > 0 && <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 500, marginBottom: isMobile ? 2 : 5, color: plan.highlighted ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>₹</span>}
                      <span style={{ fontSize: isMobile ? 28 : 36, fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1, color: plan.highlighted ? "#fff" : "var(--text)" }}>
                        {plan.price === 0 ? "Free" : plan.price.toLocaleString("en-IN")}
                      </span>
                      {plan.price > 0 && <span style={{ fontSize: 13, marginBottom: 4, color: plan.highlighted ? "rgba(255,255,255,0.6)" : "var(--text-4)" }}>/mo</span>}
                    </div>
                  </div>

                  <p style={{ fontSize: 12.5, color: plan.highlighted ? "rgba(255,255,255,0.65)" : "var(--text-3)", lineHeight: 1.6, marginBottom: 16, minHeight: isMobile ? "auto" : 40 }}>{plan.description}</p>

                  {/* CTA button */}
                  {plan.key === "free" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "9px 16px", borderRadius: "var(--r)", fontSize: 13.5, fontWeight: 500, marginBottom: 20, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                      Current plan
                    </div>
                  ) : (
                    <button onClick={() => handlePayment(plan.key as "pro" | "team")} disabled={loadingPlan !== null}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 16px", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13.5, fontWeight: 500, marginBottom: 20, border: "none", cursor: loadingPlan !== null ? "not-allowed" : "pointer", background: plan.highlighted ? "#fff" : "var(--text)", color: plan.highlighted ? "var(--text)" : "#fff", opacity: loadingPlan !== null && loadingPlan !== plan.key ? 0.5 : 1, transition: "opacity 0.12s, transform 0.12s" }}>
                      {loadingPlan === plan.key ? (
                        <><div style={{ width: 13, height: 13, border: `2px solid ${plan.highlighted ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"}`, borderTopColor: plan.highlighted ? "var(--text)" : "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />Processing...</>
                      ) : plan.cta}
                    </button>
                  )}

                  <div style={{ height: 1, background: plan.highlighted ? "rgba(255,255,255,0.15)" : "var(--border)", marginBottom: 16 }} />

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 9 : 10 }}>
                    {plan.features.map((f) => (
                      <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ flexShrink: 0, marginTop: 1, color: f.included ? (plan.highlighted ? "#fff" : "#16a34a") : (plan.highlighted ? "rgba(255,255,255,0.25)" : "var(--text-4)") }}>
                          {f.included ? <IconCheck /> : <IconX />}
                        </span>
                        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: f.included ? (plan.highlighted ? "rgba(255,255,255,0.9)" : "var(--text-2)") : (plan.highlighted ? "rgba(255,255,255,0.3)" : "var(--text-4)") }}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ marginTop: isMobile ? 32 : 48, padding: isMobile ? 18 : 24, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", animation: "fadeup 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>Frequently asked questions</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 18 : 20 }}>
                {[
                  { q: "What counts as a generation?", a: "Each time you submit an idea and Forge AI generates the full blueprint, roadmap, prompt packs, and feasibility score — that counts as one generation." },
                  { q: "Can I cancel anytime?", a: "Yes. You can cancel at any time and keep access until the end of your billing period." },
                  { q: "Is my payment secure?", a: "Yes. All payments are processed securely via Razorpay. We never store your card details." },
                  { q: "Do unused generations roll over?", a: "Free plan generations reset monthly. Pro and Team plans have no per-generation cap." },
                ].map((item) => (
                  <div key={item.q}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{item.q}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.65 }}>{item.a}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}