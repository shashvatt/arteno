"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Section = "profile" | "appearance" | "danger";

const IconUser = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconSun = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
const IconTrash = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IconCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>{children}</label>;
}
function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13.5, color: "var(--text)", background: "var(--bg)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box", ...style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.05)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}
function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setEmail(user.email ?? ""); setUserId(user.id); }
      setIsLoaded(true);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "delete my account") return;
    setDeleting(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleting(false);
    }
  };

  const sections = [
    { key: "profile" as Section, label: "Profile", icon: <IconUser /> },
    { key: "appearance" as Section, label: "Appearance", icon: <IconSun /> },
    { key: "danger" as Section, label: "Danger zone", icon: <IconTrash /> },
  ];

  if (!isLoaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 20, flexShrink: 0 }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px 6px 8px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "transparent", color: "var(--text-3)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.12s, color 0.12s", flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
          <IconArrowLeft />Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Settings</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 60px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", animation: "fadeup 0.3s cubic-bezier(0.16,1,0.3,1) both" }}>
          <div className="settings-mobile-tabs">
            {sections.map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={`settings-mobile-tab${activeSection === s.key ? " active" : ""}`}>
                {s.icon}{s.label}
              </button>
            ))}
          </div>

          <div className="settings-layout">
            <div className="settings-sidenav">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-4)", marginBottom: 8, paddingLeft: 10 }}>Settings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {sections.map((s) => (
                  <button key={s.key} onClick={() => setActiveSection(s.key)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--r)", border: "none", background: activeSection === s.key ? "var(--border)" : "transparent", color: activeSection === s.key ? "var(--text)" : "var(--text-3)", fontFamily: "var(--font)", fontSize: 13.5, fontWeight: activeSection === s.key ? 500 : 400, cursor: "pointer", width: "100%", textAlign: "left", transition: "background 0.12s, color 0.12s" }}>
                    {s.icon}{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {activeSection === "profile" && (
                <div style={{ animation: "fadeup 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>Profile</h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>Manage your personal information.</p>
                  <div style={{ marginBottom: 24 }}>
                    <Label>Profile photo</Label>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                        {email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    </div>
                  </div>
                  <Divider />
                  <div style={{ marginBottom: 28 }}>
                    <Label>Email address</Label>
                    <Input value={email} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
                    <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 6 }}>Email is managed through your auth provider and cannot be changed here.</p>
                  </div>
                  {saveError && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{saveError}</p>}
                </div>
              )}

              {activeSection === "appearance" && (
                <div style={{ animation: "fadeup 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>Appearance</h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>Customize how Arteno looks for you.</p>
                  <Label>Theme</Label>
                  <div className="settings-theme-grid">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button key={t} onClick={() => setTheme(t)}
                        style={{ padding: "14px 12px", border: `1px solid ${theme === t ? "var(--text)" : "var(--border)"}`, borderRadius: "var(--r)", background: theme === t ? "var(--text)" : "var(--surface)", color: theme === t ? "#fff" : "var(--text-3)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ width: "100%", height: 48, borderRadius: 6, border: `1px solid ${theme === t ? "rgba(255,255,255,0.15)" : "var(--border)"}`, background: t === "dark" ? "#1a1a1a" : t === "light" ? "#fff" : "linear-gradient(135deg, #fff 50%, #1a1a1a 50%)", marginBottom: 2 }} />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 12 }}>Dark mode coming soon - this will be fully functional in a future update.</p>
                </div>
              )}

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
                      <p style={{ fontSize: 13, color: "var(--text-3)" }}>Permanently delete your account and all your projects. This cannot be undone.</p>
                    </div>
                    <button onClick={() => setShowDeleteModal(true)}
                      className="settings-danger-btn"
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

      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadein 0.15s ease both", padding: "0 16px" }}
          onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 28, maxWidth: 420, width: "100%", animation: "scalein 0.2s cubic-bezier(0.16,1,0.3,1) both", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#dc2626" }}>Delete your account?</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.65 }}>
              This will permanently delete your account and all your projects. This action <strong style={{ color: "var(--text-2)" }}>cannot be undone</strong>.
            </p>
            <label style={{ fontSize: 13, color: "var(--text-2)", display: "block", marginBottom: 8 }}>Type <strong>delete my account</strong> to confirm:</label>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="delete my account"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13.5, outline: "none", marginBottom: 20, color: "var(--text)", background: "var(--bg)", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</button>
              <button disabled={deleteConfirm !== "delete my account" || deleting} onClick={handleDeleteAccount}
                style={{ padding: "6px 16px", background: deleteConfirm === "delete my account" ? "#dc2626" : "var(--surface-2)", color: deleteConfirm === "delete my account" ? "#fff" : "var(--text-4)", border: "none", borderRadius: "var(--r)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: deleteConfirm === "delete my account" ? "pointer" : "not-allowed", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                {deleting ? <><span className="spinner-inline" style={{ borderTopColor: "#fff" }} /> Deleting...</> : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}