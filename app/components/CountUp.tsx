"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = () => {
      const duration = 1000;
      const began = performance.now();
      setDisplay(0);
      const tick = (now: number) => {
        const progress = Math.min((now - began) / duration, 1);
        setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === "undefined") start();
    else {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          start();
        }
      }, { threshold: 0.25 });
      observer.observe(element);
      return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span ref={ref} className="count-up" style={{ minWidth: `${String(value).length + suffix.length}ch` }} suppressHydrationWarning>{display}{suffix}</span>;
}
