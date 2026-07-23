import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";

export const metadata: Metadata = { title: "Schedule" };
export const revalidate = 300;

type Game = {
  id: number;
  date: string;
  time: string | null;
  opponent: string;
  location: string | null;
  is_home: boolean | null;
  result: string | null;
  score_us: number | null;
  score_them: number | null;
  season: string | null;
};

async function fetchGames(): Promise<Game[] | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.error("[schedule] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
    return null;
  }
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, date, time, opponent, location, is_home, result, score_us, score_them, season"
    )
    .order("date", { ascending: true });
  if (error) {
    console.error("[schedule] games 조회 실패:", error.message);
    return null;
  }
  return data as Game[];
}

// games.season 표기가 비일관('Spring'/'Fall'/'2026')이라 date 연도로 시즌을 정한다
function seasonOf(g: Game): string {
  return g.date.slice(0, 4);
}

function isCancelled(g: Game): boolean {
  if (!g.result) return false;
  const r = g.result.toLowerCase();
  return r.includes("취소") || r === "cancelled" || r === "canceled";
}

function isUpcoming(g: Game, today: string): boolean {
  return g.date > today && g.score_us == null && g.score_them == null;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { season?: string };
}) {
  const games = await fetchGames();
  const today = new Date().toISOString().slice(0, 10);

  const seasons = Array.from(new Set((games ?? []).map(seasonOf))).sort();
  const currentSeason =
    searchParams.season && seasons.includes(searchParams.season)
      ? searchParams.season
      : seasons[seasons.length - 1];
  const seasonGames = (games ?? []).filter(
    (g) => seasonOf(g) === currentSeason
  );

  return (
    <div className="container">
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="hero__meta">GAMES</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(44px, 8vw, 88px)", marginTop: 12 }}
        >
          SCHE<span className="outline">DULE</span>
        </h1>
        <p className="hero__tagline">
          Utah Devils의 시즌별 경기 일정과 결과입니다.
        </p>
      </section>

      <section style={{ paddingBottom: 8 }}>
        {games === null ? (
          <div className="notice">경기 데이터를 준비 중입니다.</div>
        ) : games.length === 0 ? (
          <div className="notice">
            등록된 경기가 없습니다. 새 시즌 일정이 확정되면 이곳에 공개됩니다.
          </div>
        ) : (
          <>
            <div className="tabs">
              {seasons.map((s) => (
                <Link
                  key={s}
                  href={`/schedule?season=${encodeURIComponent(s)}`}
                  className={`tab${s === currentSeason ? " active" : ""}`}
                >
                  {s}
                </Link>
              ))}
            </div>

            <div className="grid grid--2">
              {seasonGames.map((g, i) => {
                const cancelled = isCancelled(g);
                const upcoming = isUpcoming(g, today);
                const hasScore = g.score_us != null && g.score_them != null;
                const win = g.result === "W";
                return (
                  <div
                    key={g.id}
                    className={`card game-card${win ? " game-card--win" : ""}`}
                  >
                    <div className="game-card__top">
                      <span className="game-card__no">
                        GAME {String(i + 1).padStart(2, "0")}
                      </span>
                      {cancelled ? (
                        <span className="badge badge--muted">경기취소</span>
                      ) : upcoming ? (
                        <span className="badge">UPCOMING</span>
                      ) : win ? (
                        <span className="badge badge--solid">WIN</span>
                      ) : g.result === "L" ? (
                        <span className="badge badge--muted">LOSE</span>
                      ) : g.result === "D" ? (
                        <span className="badge badge--muted">DRAW</span>
                      ) : !hasScore ? (
                        <span className="badge badge--muted">미기록</span>
                      ) : null}
                    </div>

                    {hasScore && !cancelled ? (
                      <div className="game-card__score">
                        {g.score_us}
                        <span className="vs">:</span>
                        {g.score_them}
                      </div>
                    ) : (
                      <div
                        className="game-card__score"
                        style={{ color: "var(--text-muted)" }}
                      >
                        –<span className="vs">:</span>–
                      </div>
                    )}

                    <div className="game-card__opponent">
                      VS {g.opponent}
                      {g.is_home != null ? (
                        <span
                          className="pill pill--muted"
                          style={{ marginLeft: 10 }}
                        >
                          {g.is_home ? "HOME" : "AWAY"}
                        </span>
                      ) : null}
                    </div>

                    <div className="game-card__meta">
                      <span>{g.date}</span>
                      {g.time ? <span>{g.time}</span> : null}
                      {g.location ? <span>{g.location}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="cta-panel">
        <div>
          <div className="cta-panel__title">
            FULL <span style={{ color: "var(--red)" }}>STATS</span>
          </div>
          <p className="cta-panel__sub">
            전체 기록과 AI 분석은 Devils Insight AI에서 확인하세요.
          </p>
        </div>
        <a
          href={INSIGHT_AI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--primary"
        >
          DEVILS INSIGHT AI ↗
        </a>
      </div>
    </div>
  );
}
