"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const LINKS = [
  { href: "/admin", label: "DASHBOARD" },
  { href: "/admin/timeline", label: "연혁" },
  { href: "/admin/events", label: "행사" },
  { href: "/admin/survey", label: "수요조사" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (["/admin/login", "/admin/signup", "/admin/pending"].includes(pathname)) return null;

  async function handleLogout() {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div
      className="tabs"
      style={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`tab${pathname === l.href ? " active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button type="button" className="tab" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
