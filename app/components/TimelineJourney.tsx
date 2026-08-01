"use client";

import { useEffect } from "react";

/**
 * 기존 연혁 마크업을 유지한 채, 화면 중앙을 지나는 연도만 활성화한다.
 * 모션 감소 환경에서는 모든 연도를 그대로 표시한다.
 */
export default function TimelineJourney() {
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(".timeline--journey .timeline__item")
    );
    if (
      items.length === 0 ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      items.forEach((item) => item.classList.add("is-active"));
      return;
    }

    items[0].classList.add("is-active");
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!current) return;
        items.forEach((item) =>
          item.classList.toggle("is-active", item === current.target)
        );
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: [0.01, 0.3, 0.6] }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return null;
}
