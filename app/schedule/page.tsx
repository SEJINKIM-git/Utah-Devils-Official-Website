import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";
import { withHistoricalGames } from "@/lib/historical-games";
import VisualBand from "@/app/components/VisualBand";
import { getSiteContent, getSiteSettings } from "@/lib/site-content";

export const metadata: Metadata = { title: "Schedule" };
export const revalidate = 300;

// 디자인 기준 시즌 탭 범위. games에 데이터가 없는 시즌도 탭은 노출한다.
const SEASON_TABS = ["2022", "2023", "2024", "2025", "2026"];
// 진행 중 시즌의 예정 경기 슬롯 수 — 디자인은 2026에 GAME 04~06 TBA 노출.
// 시즌당 목표 경기 수는 운영자 확인 필요(기본 6).
const TARGET_GAMES_PER_SEASON = 6;

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// 과거 시즌 PDF의 실제 경기 카드에서 추출한 상대팀 로고.
// 2026의 분석 플랫폼 상대팀처럼 시안에 없는 이름은 이니셜 마크로 폴백한다.
const OPPONENT_LOGOS: Record<string, string> = {
  TEAM송도: "/images/opponents/team-songdo.png",
  육군사관학교: "/images/opponents/kma.png",
  TEAM시흥: "/images/opponents/team-siheung.png",
  TEAMIPA: "/images/opponents/team-ipa.png",
  TEAM곤지암: "/images/opponents/team-gonjiam.png",
  인하대JADE: "/images/opponents/jade.png",
  매지션즈: "/images/opponents/magicians.png",
  바이퍼즈: "/images/opponents/vipers.png",
  에이포스: "/images/opponents/aforce.png",
  TEAM선학: "/images/opponents/team-seonhak.png",
  국민대윈드밀스: "/images/opponents/windmills.png",
  충북대타우르스: "/images/opponents/taurus.png",
  메이슨바이퍼스: "/images/opponents/mason-vipers.png",
  서원대흑마: "/images/opponents/seowon-black-horse.png",
  청주대나인파이터스: "/images/opponents/nine-fighters.png",
  SKIPPERS: "/images/opponents/skippers.png",
  THUNDERBOLT: "/images/opponents/thunderbolt.png",
  다이아몬드에이스: "/images/opponents/diamond-ace.png",
};

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

// "APR 17" — 디자인의 영문 월 약어 표기
function formatDate(date: string): string {
  const month = MONTH_ABBR[Number(date.slice(5, 7)) - 1] ?? "";
  return `${month} ${date.slice(8, 10)}`;
}

// time 컬럼 "19:30:00" → "19:30"
function formatTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function OpponentMark({ opponent }: { opponent: string }) {
  const logo = OPPONENT_LOGOS[opponent];
  if (logo) {
    return (
      <span className="game-card__logo" aria-label={`${opponent} 로고`}>
        <Image src={logo} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
      </span>
    );
  }

  return (
    <span className="game-card__logo game-card__logo--fallback" aria-label={`${opponent} 이니셜`}>
      {opponent.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { season?: string };
}) {
  const [liveGames, content, settings] = await Promise.all([fetchGames(), getSiteContent(), getSiteSettings()]);
  // 2022~2025는 배포된 공식 아카이브, 2026부터는 운영 데이터로 표시한다.
  const games = withHistoricalGames(liveGames ?? []) as Game[];
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = settings.current_season;

  const dataSeasons = Array.from(new Set((games ?? []).map(seasonOf)));
  const seasons = Array.from(new Set([...SEASON_TABS, ...dataSeasons])).sort();
  const currentSeason =
    searchParams.season && seasons.includes(searchParams.season)
      ? searchParams.season
      : currentYear >= seasons[0] && seasons.includes(currentYear)
        ? currentYear
        : seasons[seasons.length - 1];
  const seasonGames = (games ?? []).filter(
    (g) => seasonOf(g) === currentSeason
  );

  const targetGames = Math.max(0, Number(settings.season_target_games) || TARGET_GAMES_PER_SEASON);
  // 진행 중 시즌: 목표 경기 수까지 TBA placeholder 슬롯을 채운다
  const tbaCount =
    currentSeason === currentYear
      ? Math.max(0, targetGames - seasonGames.length)
      : 0;

  return (
    <div className="container">
      <div className="page-hero">
        <VisualBand image="/images/home/night-lineup.png" alt="" label="" />
        <section className="hero page-hero__content">
          <div className="hero__meta">GAMES</div>
          <h1
            className="wordmark"
            style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 12 }}
          >
            SCHE<span className="outline">DULE</span>
          </h1>
          <p className="hero__tagline">{content.section_desc_schedule}</p>
        </section>
      </div>

      <section style={{ paddingBottom: 8 }}>
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

            <div className="section-head">
              <h2 className="section-title" style={{ fontSize: 32 }}>
                {currentSeason} <span className="outline">SEASON</span>
              </h2>
            </div>

            {seasonGames.length === 0 && tbaCount === 0 ? (
              <div className="notice">
                {currentSeason} 시즌의 등록된 경기가 없습니다. 경기 기록이
                업로드되면 이곳에 공개됩니다.
              </div>
            ) : (
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
                          GAME {pad2(i + 1)}
                        </span>
                        {cancelled ? null : upcoming ? (
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

                      {cancelled ? (
                        <div className="game-card__score game-card__score--cancelled">
                          경기취소
                        </div>
                      ) : hasScore ? (
                        <div
                          className="game-card__score"
                          style={win ? { color: "var(--red)" } : undefined}
                        >
                          {pad2(g.score_us!)}
                          <span className="vs">:</span>
                          {pad2(g.score_them!)}
                        </div>
                      ) : (
                        <div
                          className="game-card__score"
                          style={{ color: "var(--text-muted)" }}
                        >
                          –<span className="vs">:</span>–
                        </div>
                      )}

                      <div className="game-card__matchup">
                        <OpponentMark opponent={g.opponent} />
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
                        <span className="game-card__logo game-card__logo--devils" aria-label="Utah Devils 로고">
                          <Image src="/logos/emblem-64.png" alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
                        </span>
                      </div>

                      <div className="game-card__meta">
                        <span>
                          {formatDate(g.date)}
                          {formatTime(g.time) ? ` ${formatTime(g.time)}` : ""}
                        </span>
                        {g.location ? <span>{g.location}</span> : null}
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: tbaCount }, (_, i) => (
                  <div key={`tba-${i}`} className="card game-card">
                    <div className="game-card__top">
                      <span className="game-card__no">
                        GAME {pad2(seasonGames.length + i + 1)}
                      </span>
                      <span className="badge badge--muted">TBA</span>
                    </div>
                    <div
                      className="game-card__score"
                      style={{ color: "var(--text-muted)" }}
                    >
                      TBA
                    </div>
                    <div
                      className="game-card__opponent"
                      style={{ color: "var(--text-muted)" }}
                    >
                      VS TBA
                    </div>
                    <div className="game-card__meta">
                      <span>TBA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
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
