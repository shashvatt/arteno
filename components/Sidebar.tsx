"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Project = {
  id: string; name: string; created_at: string;
  blueprint: any; roadmap: any; prompts: any; feasibility: any;
};
type Props = {
  onLoadProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
};

const IconBolt = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconGrid = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconList = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconUser = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconSettings = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconUpgrade = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>;
const IconX = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconLogout = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function Sidebar({ onLoadProject, onDeleteProject }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setIsSignedIn(true); setUserEmail(user.email ?? ""); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setIsSignedIn(true); setUserEmail(session.user.email ?? ""); }
      else { setIsSignedIn(false); setUserEmail(""); setProjects([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setProjects(json.data ?? []);
    } catch (err) { console.error("Failed to load projects:", err); }
    finally { setLoadingProjects(false); }
  };

  useEffect(() => { if (isSignedIn) loadProjects(); }, [isSignedIn]);
  useEffect(() => {
    const handler = () => loadProjects();
    window.addEventListener("forge:project-saved", handler);
    return () => window.removeEventListener("forge:project-saved", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const handleConfirmDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeletingId(projectId); setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      onDeleteProject?.(projectId);
    } catch (err) { console.error("Failed to delete:", err); }
    finally { setDeletingId(null); }
  };

  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <aside className="sidebar sidebar-desktop">
      <div className="sidebar-header" style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64 }}>
        <div style={{ marginLeft: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.72)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Product Suite</div>
        </div>
        {isSignedIn && (
          <Link href="/dashboard">
            <button className="sidebar-new-btn" title="New project"
              style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", color: "#fff", transition: "background 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
            ><IconPlus /></button>
          </Link>
        )}
      </div>

      <div className="sidebar-body">
        <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className={`sidebar-item ${pathname === "/dashboard" ? "active" : ""}`}>
          <IconBolt />{isSignedIn ? "New project" : "Start building"}
        </Link>
        {isSignedIn ? (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Projects</div>
            {loadingProjects && (
              <div style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton skeleton-text" style={{ width: "80%" }} />
                <div className="skeleton skeleton-text" style={{ width: "60%" }} />
                <div className="skeleton skeleton-text" style={{ width: "70%" }} />
              </div>
            )}
            {!loadingProjects && projects.length === 0 && (
              <div className="sidebar-item" style={{ opacity: 0.45, cursor: "default", pointerEvents: "none", fontSize: 13 }}>
                <IconList />No projects yet
              </div>
            )}
            {!loadingProjects && projects.map((project) => (
              <div key={project.id} style={{ position: "relative" }}
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => { setHoveredId(null); setConfirmDeleteId(null); }}>
                {confirmDeleteId === project.id ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid #dc2626", margin: "1px 0", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 500 }}>Delete?</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={(e) => handleConfirmDelete(e, project.id)} style={{ fontSize: 11, padding: "2px 8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 500 }}>Yes</button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} style={{ fontSize: 11, padding: "2px 8px", background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }}>No</button>
                    </div>
                  </div>
                ) : (
                  <button className="sidebar-item"
                    style={{ width: "100%", fontFamily: "var(--font)", opacity: deletingId === project.id ? 0.4 : 1, paddingRight: hoveredId === project.id ? 28 : undefined, position: "relative", cursor: deletingId === project.id ? "default" : "pointer" }}
                    onClick={() => onLoadProject?.(project)} title={project.name} disabled={deletingId === project.id}>
                    <IconList />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140, fontSize: 13 }}>
                      {deletingId === project.id ? "Deleting..." : project.name}
                    </span>
                    {hoveredId === project.id && deletingId !== project.id && (
                      <span onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id); }}
                        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 4, color: "var(--text-4)", cursor: "pointer" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.1)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <IconX />
                      </span>
                    )}
                  </button>
                )}
              </div>
            ))}
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Workspace</div>
            <Link href="/dashboard" className={`sidebar-item ${pathname === "/dashboard" ? "active" : ""}`}>
              <IconGrid />Dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="sidebar-divider" />
            <Link href="/sign-in" className="sidebar-item"><IconUser />Log in to continue</Link>
            <Link href="/sign-up" className="sidebar-item"><IconPlus />Create free account</Link>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        {isSignedIn ? (
          <>
            <Link href="/upgrade" className={`sidebar-item ${pathname === "/upgrade" ? "active" : ""}`}><IconUpgrade />Upgrade plan</Link>
            <Link href="/settings" className={`sidebar-item ${pathname === "/settings" ? "active" : ""}`}><IconSettings />Settings</Link>
            <div className="sidebar-user" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {avatarLetter}
              </div>
              <span className="sidebar-user-name" style={{ fontSize: 12.5, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {userEmail}
              </span>
              <button onClick={handleSignOut} title="Sign out"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "flex", alignItems: "center", padding: 2, borderRadius: 4, flexShrink: 0 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}>
                <IconLogout />
              </button>
            </div>
          </>
        ) : (
          <Link href="/sign-in" className="sidebar-item"><IconUser />Sign in</Link>
        )}
      </div>
    </aside>
  );
}