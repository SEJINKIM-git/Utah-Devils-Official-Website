import Link from "next/link";
import { INSIGHT_AI_URL } from "@/lib/supabase";

const QUICK_LINKS = [
  {
    href: "/devils",
    title: "DEVILS",
    desc: "동아리 소개와 연혁 — 우리가 걸어온 시즌들",
  },
  {
    href: "/players",
    title: "PLAYER",
    desc: "현재 시즌 로스터와 선수 프로필",
  },
  {
    href: "/schedule",
    title: "SCHEDULE",
    desc: "시즌별 경기 일정과 결과",
  },
  {
    href: "/archive",
    title: "ARCHIVE",
    desc: "시즌 어워즈, 명예의 전당, 행사 기록",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero__meta">UTAH ASIA CAMPUS · BASEBALL CLUB</div>
          <h1 className="wordmark" style={{ marginTop: 12 }}>
            UTAH
            <br />
            <span className="outline">DEVILS</span>
          </h1>
          <p className="hero__tagline">
            유타대학교 아시아캠퍼스 야구동아리 Utah Devils의 공식 홈페이지.
            굿즈, 경기 일정, 팀 기록, 동아리 활동을 한곳에서 만나보세요.
          </p>
          <div className="hero__actions">
            <Link href="/schedule" className="btn btn--primary">
              SCHEDULE
            </Link>
            <a
              href={INSIGHT_AI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              DEVILS INSIGHT AI ↗
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid--2">
            {QUICK_LINKS.map((q) => (
              <Link key={q.href} href={q.href} className="card">
                <div className="wordmark" style={{ fontSize: 26 }}>
                  {q.title}
                </div>
                <p style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 14 }}>
                  {q.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
