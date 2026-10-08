"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// 기존 홈페이지 초안의 페이지 순서:
// 1 Home → 2 Devils → 3 Awards → 4 Hall of Fame → 5 Player
// → 6~10 Schedule(시즌별) → 11 Archive
const NAV = [
  { id: "devils", label: "DEVILS", page: "/devils" },
  { id: "awards", label: "AWARDS", page: "/archive?tab=awards" },
  { id: "hof", label: "HOF", page: "/archive?tab=hof" },
  { id: "player", label: "PLAYER", page: "/players" },
  { id: "schedule", label: "SCHEDULE", page: "/schedule" },
  { id: "archive", label: "ARCHIVE", page: "/archive?tab=events" },
  { id: "stats", label: "STATS", page: null },
  { id: "shop", label: "SHOP", page: "/shop" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // R1: 메인에서 scrollY > 50이면 투명 → 솔리드 (rAF로 스로틀)
  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
        raf = 0;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  // Scrollspy: 메인에서 현재 보이는 섹션의 메뉴를 활성 표시
  useEffect(() => {
    if (!isHome || typeof IntersectionObserver === "undefined") return;
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // 화면 중앙 밴드에 들어온 섹션 중 가장 위의 것을 활성으로
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
        else if (window.scrollY < 200) setActiveId(null);
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome]);

  // 모바일 메뉴가 열려 있는 동안 ESC 닫기 + 포커스 트랩 + body 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

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
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // 라우트가 바뀌면 메뉴를 닫는다
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const transparent = isHome && !scrolled && !open;
  const headerClass = [
    "site-header",
    transparent ? "site-header--transparent" : "",
    isHome && scrolled ? "site-header--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function isActive(item: (typeof NAV)[number]): boolean {
    if (isHome) return activeId === item.id;
    // Awards/HOF/Archive는 같은 상세 경로를 공유한다. 정적 렌더링을 유지하기
    // 위해 쿼리 의존 훅은 사용하지 않고 Archive 메뉴만 현재 페이지로 표시한다.
    const basePath = item.page?.split("?")[0];
    if (basePath === "/archive") {
      return pathname === "/archive" && item.id === "archive";
    }
    return basePath != null && pathname?.startsWith(basePath) === true;
  }

  function hrefOf(item: (typeof NAV)[number]): string {
    // 원본 시안은 페이지별 구성이므로, 각 메뉴는 해당 상세 페이지로 바로 이동한다.
    // Stats만 메인 페이지의 분석 소개 섹션을 유지한다.
    if (item.page) return item.page;
    return isHome ? `#${item.id}` : `/#${item.id}`;
  }

  const navLinks = (onClick: () => void) =>
    NAV.map((item) => (
      <Link
        key={item.id}
        href={hrefOf(item)}
        className={isActive(item) ? "active" : ""}
        onClick={onClick}
      >
        {item.label}
      </Link>
    ));

  return (
    <header className={headerClass} ref={headerRef}>
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/emblem-64.png"
            alt=""
            width={30}
            height={30}
            className="site-header__emblem"
          />
          UTAH <span className="accent">DEVILS</span>
        </Link>
        <button
          ref={toggleRef}
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="mobile-panel"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen(!open)}
        >
          {open ? "CLOSE" : "MENU"}
        </button>
        <nav id="site-nav" className="site-nav">
          {navLinks(() => setOpen(false))}
        </nav>
      </div>
      {/* R2: 모바일 슬라이드다운 패널 — 큰 Anton 타이포 세로 나열 */}
      <div id="mobile-panel" className={`mobile-panel${open ? " open" : ""}`}>
        <div className="mobile-panel__inner">
          <nav aria-label="모바일 메뉴">
            {navLinks(() => setOpen(false))}
          </nav>
        </div>
      </div>
    </header>
  );
}
