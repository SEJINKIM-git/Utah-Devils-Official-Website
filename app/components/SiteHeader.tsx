"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { INSIGHT_AI_URL } from "@/lib/supabase";

const NAV = [
  { href: "/devils", label: "DEVILS" },
  { href: "/players", label: "PLAYER" },
  { href: "/schedule", label: "SCHEDULE" },
  { href: "/archive", label: "ARCHIVE" },
  { href: INSIGHT_AI_URL, label: "STATS", external: true },
  { href: "/shop", label: "SHOP" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" onClick={() => setOpen(false)}>
          UTAH <span className="accent">DEVILS</span>
        </Link>
        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(!open)}
        >
          MENU
        </button>
        <nav id="site-nav" className={`site-nav${open ? " open" : ""}`}>
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
                <span className="ext">↗</span>
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={pathname?.startsWith(item.href) ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
