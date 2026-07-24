import Link from "next/link";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";

export const revalidate = 600;

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

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

type Game = {
  id: number;
  date: string;
  time: string | null;
  opponent: string;
  location: string | null;
  result: string | null;
  score_us: number | null;
  score_them: number | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDate(date: string): string {
  const month = MONTH_ABBR[Number(date.slice(5, 7)) - 1] ?? "";
  return `${month} ${date.slice(8, 10)}`;
}

async function fetchLiveGames(): Promise<{
  last: Game | null;
  next: Game | null;
}> {
  const supabase = getSupabase();
  if (!supabase) return { last: null, next: null };

  const today = new Date().toISOString().slice(0, 10);
  const [lastRes, nextRes] = await Promise.all([
    supabase
      .from("games")
      .select("id, date, time, opponent, location, result, score_us, score_them")
      .not("score_us", "is", null)
      .not("score_them", "is", null)
      .lte("date", today)
      .order("date", { ascending: false })
      .limit(1),
    supabase
      .from("games")
      .select("id, date, time, opponent, location, result, score_us, score_them")
      .is("score_us", null)
      .gt("date", today)
      .order("date", { ascending: true })
      .limit(1),
  ]);
  if (lastRes.error)
    console.error("[home] last game 조회 실패:", lastRes.error.message);
  if (nextRes.error)
    console.error("[home] next game 조회 실패:", nextRes.error.message);
  return {
    last: (lastRes.data?.[0] as Game) ?? null,
    next: (nextRes.data?.[0] as Game) ?? null,
  };
}

export default async function HomePage() {
  const { last, next } = await fetchLiveGames();
  const lastWin = last?.result === "W";

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

      {last || next ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="grid grid--2">
              {last ? (
                <Link
                  href="/schedule"
                  className={`card game-card${lastWin ? " game-card--win" : ""}`}
                >
                  <div className="game-card__top">
                    <span className="game-card__no">LAST GAME</span>
                    {lastWin ? (
                      <span className="badge badge--solid">WIN</span>
                    ) : last.result === "L" ? (
                      <span className="badge badge--muted">LOSE</span>
                    ) : last.result === "D" ? (
                      <span className="badge badge--muted">DRAW</span>
                    ) : null}
                  </div>
                  <div
                    className="game-card__score"
                    style={lastWin ? { color: "var(--red)" } : undefined}
                  >
                    {pad2(last.score_us!)}
                    <span className="vs">:</span>
                    {pad2(last.score_them!)}
                  </div>
                  <div className="game-card__opponent">VS {last.opponent}</div>
                  <div className="game-card__meta">
                    <span>
                      {formatDate(last.date)}
                      {last.time ? ` ${last.time.slice(0, 5)}` : ""}
                    </span>
                    {last.location ? <span>{last.location}</span> : null}
                  </div>
                </Link>
              ) : null}

              {next ? (
                <Link href="/schedule" className="card game-card">
                  <div className="game-card__top">
                    <span className="game-card__no">NEXT GAME</span>
                    <span className="badge">UPCOMING</span>
                  </div>
                  <div
                    className="game-card__score"
                    style={{ color: "var(--text-muted)" }}
                  >
                    –<span className="vs">:</span>–
                  </div>
                  <div className="game-card__opponent">VS {next.opponent}</div>
                  <div className="game-card__meta">
                    <span>
                      {formatDate(next.date)}
                      {next.time ? ` ${next.time.slice(0, 5)}` : ""}
                    </span>
                    {next.location ? <span>{next.location}</span> : null}
                  </div>
                </Link>
              ) : null}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 16 }}>
              <Link
                href="/schedule"
                className="game-card__no"
                style={{ color: "var(--red)" }}
              >
                FULL SCHEDULE →
              </Link>
              <a
                href={INSIGHT_AI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="game-card__no"
              >
                STATS ↗
              </a>
            </div>
          </div>
        </section>
      ) : null}

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
