"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Section = "profile" | "billing" | "appearance" | "danger";

type SubscriptionData = {
  plan: "free" | "pro" | "team";
  email: string;
  name: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  plan_expires_at: string | null;
  updated_at: string | null;
};

// ── Icons ────────────────────────────────────────────────
const IcUser      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcBilling   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcSun       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IcTrash     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcLeft      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IcCheck     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcCopy      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;

// ── Small components ─────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</label>;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "22px 0" }} />;
}

function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13.5, color: "var(--text)", background: "var(--bg)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box", ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,33,61,0.07)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function PlanBadge({ plan }: { plan: "free" | "pro" | "team" }) {
  const cfg = {
    free:  { label: "Free",  color: "#64748b", bg: "rgba(100,116,139,0.09)", border: "rgba(100,116,139,0.2)" },
    pro:   { label: "Pro",   color: "#7c3aed", bg: "rgba(124,58,237,0.09)", border: "rgba(124,58,237,0.25)" },
    team:  { label: "Team",  color: "#0369a1", bg: "rgba(3,105,161,0.09)",  border: "rgba(3,105,161,0.25)" },
  }[plan];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {plan !== "free" && <span>★</span>}
      {cfg.label}
    </span>
  );
}

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-2)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#16a34a" : "var(--text-4)", padding: 0, display: "flex", flexShrink: 0, transition: "color 0.15s" }}>
        {copied ? <IcCheck /> : <IcCopy />}
      </button>
    </div>
  );
}

function InfoRow({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--border)", gap: 16 }}>
      <span style={{ fontSize: 13, color: "var(--text-4)", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, textAlign: "right" }}>{children}</span>
    </div>
  );
}

// ── Billing section ──────────────────────────────────────
function BillingSection({ sub, loading, onUpgrade }: { sub: SubscriptionData | null; loading: boolean; onUpgrade: () => void }) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeup 0.25s ease both" }}>
      <div style={{ height: 20, width: 160, background: "var(--border)", borderRadius: 6 }} />
      {[1,2,3].map(i => <div key={i} style={{ height: 60, background: "var(--surface)", borderRadius: "var(--r)", border: "1px solid var(--border)" }} />)}
    </div>
  );

  const plan = sub?.plan ?? "free";
  const isPaid = plan !== "free";

  const fmt = (iso: string | null, opts?: Intl.DateTimeFormatOptions) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "long", year: "numeric" }) : "—";

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const expiresAt = sub?.plan_expires_at ? new Date(sub.plan_expires_at) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;
  const planPrice = plan === "pro" ? "₹1,699" : plan === "team" ? "₹2,499" : "₹0";
  const planName = plan === "pro" ? "Arteno Pro" : plan === "team" ? "Arteno Team" : "Arteno Free";

  return (
    <div style={{ animation: "fadeup 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>Billing & Subscription</h2>
      <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>Your plan, payment history and subscription details.</p>

      {/* ── Active plan card ── */}
      <div style={{
        borderRadius: "var(--r-lg)", border: `1.5px solid ${isPaid ? (plan === "pro" ? "rgba(124,58,237,0.3)" : "rgba(3,105,161,0.3)") : "var(--border)"}`,
        background: isPaid ? (plan === "pro" ? "rgba(124,58,237,0.04)" : "rgba(3,105,161,0.04)") : "var(--surface)",
        padding: "20px 22px", marginBottom: 20, position: "relative", overflow: "hidden",
      }}>
        {isPaid && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: plan === "pro" ? "linear-gradient(90deg,#7c3aed,#a78bfa,transparent)" : "linear-gradient(90deg,#0369a1,#38bdf8,transparent)" }} />}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-4)" }}>Current Plan</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <PlanBadge plan={plan} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>{planPrice}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-4)" }}>/mo</span></span>
            </div>
            {isPaid && expiresAt && (
              <div style={{ fontSize: 12.5, color: isExpired ? "#dc2626" : daysLeft !== null && daysLeft <= 7 ? "#d97706" : "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
                <span>📅</span>
                {isExpired ? "Plan expired" : `Expires ${fmt(sub?.plan_expires_at)} · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
              </div>
            )}
            {!isPaid && <div style={{ fontSize: 12.5, color: "var(--text-4)" }}>5 generations / month · No credit card required</div>}
          </div>

          <button onClick={onUpgrade}
            style={{ padding: "8px 16px", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap", transition: "opacity 0.15s", border: isPaid ? `1px solid ${plan === "pro" ? "rgba(124,58,237,0.3)" : "rgba(3,105,161,0.3)"}` : "none", background: isPaid ? "transparent" : "var(--text)", color: isPaid ? (plan === "pro" ? "#7c3aed" : "#0369a1") : "#fff" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
            {isPaid ? "Manage plan" : "Upgrade →"}
          </button>
        </div>
      </div>

      {/* ── Expiry warnings ── */}
      {isPaid && !isExpired && daysLeft !== null && daysLeft <= 7 && (
        <div style={{ padding: "12px 16px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: "var(--r)", fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <span>⚠️ Your plan expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>. Renew to keep uninterrupted access.</span>
          <button onClick={onUpgrade} style={{ marginLeft: "auto", padding: "5px 12px", background: "#d97706", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", flexShrink: 0 }}>Renew now</button>
        </div>
      )}
      {isPaid && isExpired && (
        <div style={{ padding: "12px 16px", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--r)", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <span>❌ Your plan has expired. You've been moved to Free.</span>
          <button onClick={onUpgrade} style={{ marginLeft: "auto", padding: "5px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", flexShrink: 0 }}>Resubscribe</button>
        </div>
      )}

      {/* ── Plan features ── */}
      {isPaid && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 12 }}>Plan includes</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px 16px" }}>
            {[
              "Unlimited generations",
              "Product Blueprint",
              "Execution Roadmap",
              "AI Prompt Packs",
              "Feasibility Score",
              "Priority AI generation",
              ...(plan === "team" ? ["Team collaboration", "Admin controls"] : []),
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-2)" }}>
                <span style={{ color: "#16a34a", display: "flex", flexShrink: 0 }}><IcCheck /></span>{f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment details ── */}
      {isPaid && sub && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 12 }}>Payment Details</div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--bg)", padding: "0 16px", marginBottom: 20 }}>
            <InfoRow label="Name">{sub.name || "—"}</InfoRow>
            <InfoRow label="Email">{sub.email}</InfoRow>
            <InfoRow label="Plan">{planName}</InfoRow>
            <InfoRow label="Amount paid">{planPrice} / month</InfoRow>
            <InfoRow label="Purchase date">{fmtTime(sub.updated_at)}</InfoRow>
            <InfoRow label="Valid until">{fmt(sub.plan_expires_at)}</InfoRow>
            <InfoRow label="Payment ID">
              {sub.razorpay_payment_id ? <CopyableValue value={sub.razorpay_payment_id} /> : "—"}
            </InfoRow>
            <InfoRow label="Order ID">
              {sub.razorpay_order_id ? <CopyableValue value={sub.razorpay_order_id} /> : "—"}
            </InfoRow>
            <InfoRow label="Status" last>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: isExpired ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)", color: isExpired ? "#dc2626" : "#16a34a", border: `1px solid ${isExpired ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"}` }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {isExpired ? "Expired" : "Active"}
              </span>
            </InfoRow>
          </div>
        </>
      )}

      {/* ── Free plan upgrade CTA ── */}
      {!isPaid && (
        <div style={{ padding: "22px 24px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Unlock unlimited generations</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Pro at ₹1,699/mo or Team at ₹2,499/mo</div>
          </div>
          <button onClick={onUpgrade}
            style={{ padding: "10px 20px", background: "var(--text)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
            View plans →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isLoaded, setIsLoaded]         = useState(false);
  const [email, setEmail]               = useState("");
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [theme, setTheme]               = useState<"light" | "dark" | "system">("system");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting]         = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sub, setSub]                   = useState<SubscriptionData | null>(null);
  const [loadingSub, setLoadingSub]     = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsLoaded(true); return; }
      setEmail(user.email ?? "");

      setLoadingSub(true);
      try {
        const { data } = await supabase
          .from("users")
          .select("plan, email, razorpay_payment_id, razorpay_order_id, plan_expires_at, updated_at")
          .eq("id", user.id)
          .single();

        setSub({
          plan: (data?.plan ?? "free") as "free" | "pro" | "team",
          email: data?.email ?? user.email ?? "",
          name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
          razorpay_payment_id: data?.razorpay_payment_id ?? null,
          razorpay_order_id: data?.razorpay_order_id ?? null,
          plan_expires_at: data?.plan_expires_at ?? null,
          updated_at: data?.updated_at ?? null,
        });
      } catch {
        setSub({ plan: "free", email: user.email ?? "", name: user.user_metadata?.full_name ?? "", razorpay_payment_id: null, razorpay_order_id: null, plan_expires_at: null, updated_at: null });
      } finally {
        setLoadingSub(false);
      }
      setIsLoaded(true);
    });
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/"); };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "delete my account") return;
    setDeleting(true);
    try { await supabase.auth.signOut(); router.push("/"); }
    catch (err) { console.error(err); setDeleting(false); }
  };

  const sections = [
    { key: "profile"    as Section, label: "Profile",    icon: <IcUser /> },
    { key: "billing"    as Section, label: "Billing",     icon: <IcBilling />, dot: sub?.plan && sub.plan !== "free" },
    { key: "appearance" as Section, label: "Appearance",  icon: <IcSun /> },
    { key: "danger"     as Section, label: "Danger zone", icon: <IcTrash /> },
  ];

  if (!isLoaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 20, flexShrink: 0 }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px 6px 8px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "transparent", color: "var(--text-3)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.12s, color 0.12s", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
          <IcLeft />Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Settings</span>
        {sub?.plan && sub.plan !== "free" && <PlanBadge plan={sub.plan} />}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 60px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Mobile tabs */}
          <div className="settings-mobile-tabs">
            {sections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`settings-mobile-tab${activeSection === s.key ? " active" : ""}`}>
                {s.icon}{s.label}
                {s.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c3aed", display: "inline-block", marginLeft: 2 }} />}
              </button>
            ))}
          </div>

          <div className="settings-layout">
            {/* Sidenav */}
            <div className="settings-sidenav">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-4)", marginBottom: 8, paddingLeft: 10 }}>Settings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {sections.map(s => (
                  <button key={s.key} onClick={() => setActiveSection(s.key)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--r)", border: "none", background: activeSection === s.key ? "var(--border)" : "transparent", color: activeSection === s.key ? "var(--text)" : "var(--text-3)", fontFamily: "var(--font)", fontSize: 13.5, fontWeight: activeSection === s.key ? 500 : 400, cursor: "pointer", width: "100%", textAlign: "left", transition: "background 0.12s, color 0.12s" }}>
                    {s.icon}{s.label}
                    {s.dot && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* ── PROFILE ── */}
              {activeSection === "profile" && (
                <div style={{ animation: "fadeup 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>Profile</h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>Your personal information and account plan.</p>

                  {/* Avatar row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", marginBottom: 22 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0, border: "2px solid var(--border)" }}>
                      {email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{sub?.name || email?.split("@")[0]}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginBottom: 6 }}>{email}</div>
                      {sub?.plan && <PlanBadge plan={sub.plan} />}
                    </div>
                  </div>

                  <Divider />

                  <div style={{ marginBottom: 22 }}>
                    <FieldLabel>Email address</FieldLabel>
                    <Input value={email} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
                    <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 6 }}>Managed through your auth provider — cannot be changed here.</p>
                  </div>

                  <Divider />

                  {/* Plan summary row */}
                  <FieldLabel>Subscription</FieldLabel>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {sub?.plan && <PlanBadge plan={sub.plan} />}
                      <span style={{ fontSize: 13, color: "var(--text-3)" }}>
                        {sub?.plan === "free" ? "5 generations / month" : sub?.plan === "pro" ? "Unlimited · ₹1,699/mo" : "Unlimited · ₹2,499/mo"}
                      </span>
                    </div>
                    <button
                      onClick={() => sub?.plan === "free" ? router.push("/upgrade") : setActiveSection("billing")}
                      style={{ fontSize: 12.5, padding: "5px 12px", background: sub?.plan === "free" ? "var(--text)" : "transparent", color: sub?.plan === "free" ? "#fff" : "var(--text-3)", border: sub?.plan === "free" ? "none" : "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font)", fontWeight: 500, transition: "opacity 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                      {sub?.plan === "free" ? "Upgrade" : "View billing →"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── BILLING ── */}
              {activeSection === "billing" && (
                <BillingSection sub={sub} loading={loadingSub} onUpgrade={() => router.push("/upgrade")} />
              )}

              {/* ── APPEARANCE ── */}
              {activeSection === "appearance" && (
                <div style={{ animation: "fadeup 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>Appearance</h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>Customize how Arteno looks for you.</p>
                  <FieldLabel>Theme</FieldLabel>
                  <div className="settings-theme-grid">
                    {(["light", "dark", "system"] as const).map(t => (
                      <button key={t} onClick={() => setTheme(t)}
                        style={{ padding: "14px 12px", border: `1px solid ${theme === t ? "var(--text)" : "var(--border)"}`, borderRadius: "var(--r)", background: theme === t ? "var(--text)" : "var(--surface)", color: theme === t ? "#fff" : "var(--text-3)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ width: "100%", height: 48, borderRadius: 6, border: `1px solid ${theme === t ? "rgba(255,255,255,0.15)" : "var(--border)"}`, background: t === "dark" ? "#1a1a1a" : t === "light" ? "#fff" : "linear-gradient(135deg,#fff 50%,#1a1a1a 50%)" }} />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 12 }}>Dark mode coming soon — will be fully functional in a future update.</p>
                </div>
              )}

              {/* ── DANGER ── */}
              {activeSection === "danger" && (
                <div style={{ animation: "fadeup 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>Danger zone</h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>Irreversible actions. Please proceed with caution.</p>
                  <div className="settings-danger-row" style={{ marginBottom: 16 }}>
                    <div className="settings-danger-text">
                      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Sign out</p>
                      <p style={{ fontSize: 13, color: "var(--text-3)" }}>Sign out of your Arteno account on this device.</p>
                    </div>
                    <button className="btn btn-secondary btn-sm settings-danger-btn" onClick={handleSignOut}>Sign out</button>
                  </div>
                  <div className="settings-danger-row" style={{ border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.02)" }}>
                    <div className="settings-danger-text">
                      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, color: "#dc2626" }}>Delete account</p>
                      <p style={{ fontSize: 13, color: "var(--text-3)" }}>Permanently delete your account and all projects. Cannot be undone.</p>
                    </div>
                    <button onClick={() => setShowDeleteModal(true)} className="settings-danger-btn"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "var(--r)", padding: "6px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap" }}>
                      Delete account
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "0 16px" }}
          onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#dc2626" }}>Delete your account?</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.65 }}>
              This will permanently delete your account and all your projects. This action <strong style={{ color: "var(--text-2)" }}>cannot be undone</strong>.
            </p>
            <label style={{ fontSize: 13, color: "var(--text-2)", display: "block", marginBottom: 8 }}>Type <strong>delete my account</strong> to confirm:</label>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="delete my account"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13.5, outline: "none", marginBottom: 20, color: "var(--text)", background: "var(--bg)", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</button>
              <button disabled={deleteConfirm !== "delete my account" || deleting} onClick={handleDeleteAccount}
                style={{ padding: "6px 16px", background: deleteConfirm === "delete my account" ? "#dc2626" : "var(--surface)", color: deleteConfirm === "delete my account" ? "#fff" : "var(--text-4)", border: "none", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: deleteConfirm === "delete my account" ? "pointer" : "not-allowed", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                {deleting ? <><span className="spinner-inline" style={{ borderTopColor: "#fff" }} />Deleting...</> : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}