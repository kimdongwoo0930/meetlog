'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/meetings",
    label: "회의 목록",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/meetings/new",
    label: "새 회의",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 10px", borderRadius: 7,
      fontSize: 13.5,
      color: active ? "#fff" : "rgba(255,255,255,0.5)",
      background: active ? "rgba(99,130,255,0.18)" : "transparent",
      textDecoration: "none",
      transition: "background 0.15s, color 0.15s",
    }}>
      {icon}
      {label}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "var(--sidebar-bg)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: "var(--font-instrument-serif), serif", fontSize: 18, color: "#fff" }}>
            Meet<span style={{ color: "#6b8cff" }}>Log</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.href} {...item} active={pathname === item.href || pathname.startsWith(item.href + "/")} />
          ))}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "8px 10px", borderRadius: 7, cursor: "pointer",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "#fff", flexShrink: 0,
            }}>김</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>김동우</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
}
