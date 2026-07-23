"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // 모바일 메뉴가 열려 있는 동안 ESC 닫기 + 포커스 트랩
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !headerRef.current) return;
      // 메뉴 토글이 화면에 없으면(데스크톱 폭) 트랩하지 않는다
      if (!toggleRef.current || toggleRef.current.offsetParent === null) return;

      const focusables = Array.from(
        headerRef.current.querySelectorAll<HTMLElement>("a[href], button")
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !headerRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // 라우트가 바뀌면 메뉴를 닫는다
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" onClick={() => setOpen(false)}>
          UTAH <span className="accent">DEVILS</span>
        </Link>
        <button
          ref={toggleRef}
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen(!open)}
        >
          {open ? "CLOSE" : "MENU"}
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
