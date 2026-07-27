import Link from "next/link";
import Image from "next/image";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";
import Reveal from "./components/Reveal";

export const revalidate = 300;

// PDF 디자인 초안에서 추출한 팀 사진. 외부 Storage 설정 없이도 항상 렌더링한다.
const MOOD_CUTS = {
  devils: "/images/home/team-huddle.png",
  schedule: "/images/home/night-walk.png",
  archive: "/images/home/team-celebration.png",
  stats: "/images/home/night-lineup.png",
};

// 2025 어워드 카드 사진은 PDF 시안의 각 카드 사진 영역을 그대로 분리한 로컬 자산이다.
// Storage의 임시 썸네일이 인물 구도를 훼손하더라도, 홈에서는 얼굴이 보이는 원본 구도를 유지한다.
const HOME_AWARD_PHOTOS: Record<string, string> = {
  MVP: "/images/awards/2025-mvp.png",
  BEST_BATTER: "/images/awards/2025-best-batter.png",
  BEST_PITCHER: "/images/awards/2025-best-pitcher.png",
};

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

type RosterMember = {
  id: string;
  season: string;
  name_ko: string;
  name_en: string | null;
  number: number | null;
  is_captain: boolean;
  player_id: number | null;
  sort_order: number;
  photo_url: string | null;
};

type Award = {
  id: string;
  season: string;
  award_type: string;
  player_name: string;
  player_name_en: string | null;
  player_number: number | null;
  photo_url?: string | null;
};

type TimelineEvent = {
  year: number;
  season: string | null;
  month: number | null;
  title: string;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  type: string;
  status: string;
  price_estimate: number | null;
  photo_urls: string[] | null;
  season: string | null;
};

const AWARD_LABELS: Record<string, string> = {
  MVP: "MVP",
  BEST_BATTER: "BEST BATTER",
  BEST_PITCHER: "BEST PITCHER",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDate(date: string): string {
  const month = MONTH_ABBR[Number(date.slice(5, 7)) - 1] ?? "";
  return `${month} ${date.slice(8, 10)}`;
}

async function fetchJourneyData() {
  const supabase = getSupabase();
  const empty = {
    games: [] as Game[],
    roster: [] as RosterMember[],
    awards: [] as Award[],
    hofStudents: 0,
    hofFaculty: 0,
    milestones: [] as TimelineEvent[],
    surveyProducts: [] as Product[],
    latestProducts: [] as Product[],
  };
  if (!supabase) {
    console.error("[home] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
    return empty;
  }

  const [gamesRes, rosterRes, awardsRes, hofRes, timelineRes, productsRes, surveysRes] =
    await Promise.all([
      supabase
        .from("games")
        .select("id, date, time, opponent, location, result, score_us, score_them")
        .order("date", { ascending: true })
        .limit(100),
      supabase
        .from("roster_members")
        .select("id, season, name_ko, name_en, number, is_captain, player_id, sort_order, photo_url")
        .limit(60),
      supabase
        .from("season_awards")
        .select(
          "id, season, award_type, player_name, player_name_en, player_number, photo_url"
        )
        .in("award_type", ["MVP", "BEST_BATTER", "BEST_PITCHER"])
        .order("season", { ascending: false })
        .limit(30),
      supabase.from("hall_of_fame").select("id, hof_category").limit(60),
      supabase
        .from("timeline_events")
        .select("year, season, month, title, sort_order")
        .order("year", { ascending: true })
        .limit(200),
      supabase
        .from("products")
        .select("id, name, type, status, price_estimate, photo_urls, season")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("product_surveys")
        .select("id, product_id, is_open")
        .eq("is_open", true)
        .limit(6),
    ]);

  for (const [name, res] of [
    ["games", gamesRes],
    ["roster_members", rosterRes],
    ["season_awards", awardsRes],
    ["hall_of_fame", hofRes],
    ["timeline_events", timelineRes],
    ["products", productsRes],
    ["product_surveys", surveysRes],
  ] as const) {
    if (res.error) console.error(`[home] ${name} 조회 실패:`, res.error.message);
  }

  const games = (gamesRes.data as Game[]) ?? [];

  // 현재 시즌 로스터: 주장 먼저, 이후 등번호 순
  const allRoster = (rosterRes.data as RosterMember[]) ?? [];
  const seasons = Array.from(new Set(allRoster.map((r) => r.season))).sort();
  const latestSeason = seasons[seasons.length - 1];
  const roster = allRoster
    .filter((r) => r.season === latestSeason)
    .sort(
      (a, b) =>
        Number(b.is_captain) - Number(a.is_captain) ||
        (a.number ?? 999) - (b.number ?? 999) ||
        a.sort_order - b.sort_order
    );

  // 최신 완료 시즌 어워즈 (진행 중 시즌 제외)
  const currentYear = String(new Date().getFullYear());
  let awardsData = awardsRes.data as Award[] | null;
  if (awardsRes.error?.code === "42703") {
    // photo_url 컬럼 미생성(sql/05 실행 전) — 사진 없이 폴백
    const fb = await supabase
      .from("season_awards")
      .select("id, season, award_type, player_name, player_name_en, player_number")
      .in("award_type", ["MVP", "BEST_BATTER", "BEST_PITCHER"])
      .order("season", { ascending: false })
      .limit(30);
    awardsData = (fb.data as Award[]) ?? null;
  }
  const allAwards = awardsData ?? [];
  const awardSeasons = Array.from(new Set(allAwards.map((a) => a.season)))
    .filter((s) => s < currentYear)
    .sort();
  const latestAwardSeason = awardSeasons[awardSeasons.length - 1];
  const awards = allAwards.filter((a) => a.season === latestAwardSeason);

  const hofRows = (hofRes.data as { hof_category: string | null }[]) ?? [];
  const hofStudents = hofRows.filter((h) => h.hof_category !== "faculty").length;
  const hofFaculty = hofRows.filter((h) => h.hof_category === "faculty").length;

  // 마일스톤: 운영자 지정 컬럼이 없으므로 연도별 첫 이벤트(시즌·월 순) 5개
  const timeline = (timelineRes.data as TimelineEvent[]) ?? [];
  const seasonRank = (s: string | null) =>
    s === "SPRING" ? 0 : s === "FALL" ? 1 : 2;
  const byYear = new Map<number, TimelineEvent[]>();
  timeline.forEach((e) => {
    if (!byYear.has(e.year)) byYear.set(e.year, []);
    byYear.get(e.year)!.push(e);
  });
  const milestones = Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([, list]) =>
      list.sort(
        (a, b) =>
          seasonRank(a.season) - seasonRank(b.season) ||
          (a.month ?? 13) - (b.month ?? 13) ||
          a.sort_order - b.sort_order
      )[0]
    )
    .slice(0, 5);

  // 굿즈: 진행 중 수요조사 상품 우선, 없으면 최신 굿즈
  const products = (productsRes.data as Product[]) ?? [];
  const openSurveyProductIds = new Set(
    ((surveysRes.data as { product_id: string }[]) ?? []).map((s) => s.product_id)
  );
  const surveyProducts = products.filter(
    (p) => p.status === "survey" && openSurveyProductIds.has(p.id)
  );
  const latestProducts = products.slice(0, 3);

  return {
    games,
    roster,
    awards,
    hofStudents,
    hofFaculty,
    milestones,
    surveyProducts,
    latestProducts,
  };
}

export default async function HomePage() {
  const data = await fetchJourneyData();
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = today.slice(0, 4);

  const finished = data.games.filter(
    (g) => g.score_us != null && g.score_them != null && g.date <= today
  );
  const last = finished[finished.length - 1] ?? null;
  const next =
    data.games.find((g) => g.date > today && g.score_us == null) ?? null;
  const lastWin = last?.result === "W";

  const seasonGames = data.games.filter((g) => g.date.slice(0, 4) === currentYear);
  const record = {
    w: seasonGames.filter((g) => g.result === "W").length,
    l: seasonGames.filter((g) => g.result === "L").length,
    d: seasonGames.filter((g) => g.result === "D").length,
  };

  const latestAwardSeason = data.awards[0]?.season ?? null;

  return (
    <>
      {/* ---------- #hero ---------- */}
      <section id="hero" className="hero hero--journey">
        <Image
          className="hero__photo"
          src="/images/home/team-celebration.png"
          alt="경기 후 함께 기념 사진을 남긴 Utah Devils 선수단"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero__scrim" aria-hidden="true" />
        <div className="container">
          <div className="hero__meta">UTAH ASIA CAMPUS · BASEBALL CLUB</div>
          <h1 className="wordmark" style={{ marginTop: 12 }}>
            UTAH
            <br />
            <span className="outline">DEVILS</span>
          </h1>
          <p className="hero__tagline">
            유타대학교 아시아캠퍼스 야구동아리 Utah Devils의 공식 홈페이지.
            스크롤로 데빌스의 모든 것을 만나보세요.
          </p>
          {next ? (
            <p className="hero-teaser">
              <strong>NEXT GAME</strong> · {formatDate(next.date)} VS{" "}
              {next.opponent}
            </p>
          ) : null}
          <div className="hero-scroll" aria-hidden="true">
            SCROLL
          </div>
        </div>
      </section>

      {/* ---------- #devils ---------- */}
      <section id="devils" className="journey-section">
        <div className="container">
          <Reveal>
            <div className="journey-eyebrow">ABOUT US</div>
            <h2 className="journey-title">
              WE ARE <span className="outline">DEVILS</span>
            </h2>
            <p className="section-sub" style={{ marginTop: 16 }}>
              2022년 창단한 Utah Devils는 유타대학교 아시아캠퍼스의
              야구동아리입니다. 매 시즌 리그와 교류전에 참가하며, 야구를
              사랑하는 부원들이 함께 성장하는 팀을 지향합니다.
            </p>
            <div className="fact-grid">
              <div className="fact">
                <div className="fact__label">Established</div>
                <div className="fact__value">2022</div>
              </div>
              <div className="fact">
                <div className="fact__label">Campus</div>
                <div className="fact__value">UTAH ASIA</div>
              </div>
              <div className="fact">
                <div className="fact__label">Home</div>
                <div className="fact__value">INCHEON</div>
              </div>
              <div className="fact">
                <div className="fact__label">Members</div>
                <div className="fact__value">100+</div>
              </div>
            </div>
            {data.milestones.length > 0 ? (
              <div className="timeline" style={{ marginTop: 36 }}>
                {data.milestones.map((m) => (
                  <div key={`${m.year}-${m.title}`} className="timeline__item">
                    <div className="timeline__year">{m.year}</div>
                    <div className="timeline__event">
                      <span className="timeline__month">
                        {m.month ? pad2(m.month) : "--"}
                      </span>
                      <span>{m.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mood-cut">
              <Image
                src={MOOD_CUTS.devils}
                alt="Utah Devils 단체 사진"
                fill
                sizes="(max-width: 1120px) 100vw, 1072px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Link href="/devils" className="view-all">
              VIEW ALL →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- #player ---------- */}
      <section id="player" className="journey-section">
        <div className="container">
          <Reveal>
            <div className="journey-eyebrow">ROSTER</div>
            <h2 className="journey-title">
              <span className="outline">PLAY</span>ERS
            </h2>
            {data.roster.length === 0 ? (
              <div className="notice" style={{ marginTop: 24 }}>
                새 시즌 로스터를 준비 중입니다.
              </div>
            ) : (
              <div className="player-rail">
                {data.roster.map((m) => {
                  const inner = (
                    <>
                      {m.photo_url ? (
                        <div className="player-card__photo">
                          <Image
                            src={m.photo_url}
                            alt={m.name_ko}
                            fill
                            sizes="240px"
                            style={{ objectFit: "cover", objectPosition: "top" }}
                          />
                        </div>
                      ) : null}
                      {m.is_captain ? (
                        <span className="badge badge--solid">CAPTAIN</span>
                      ) : null}
                      <div className="player-card__number">
                        {m.number != null ? m.number : "–"}
                      </div>
                      <div className="player-card__name-ko">{m.name_ko}</div>
                      {m.name_en ? (
                        <div className="player-card__name-en">
                          {m.name_en.includes(" ") ? (
                            <>
                              {m.name_en.slice(0, m.name_en.lastIndexOf(" "))}
                              <br />
                              {m.name_en.slice(m.name_en.lastIndexOf(" ") + 1)}
                            </>
                          ) : (
                            m.name_en
                          )}
                        </div>
                      ) : null}
                    </>
                  );
                  return m.player_id != null ? (
                    <a
                      key={m.id}
                      className="card player-card"
                      style={{ minHeight: 150 }}
                      href={`${INSIGHT_AI_URL}/players/${m.player_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      key={m.id}
                      className="card player-card"
                      style={{ minHeight: 150 }}
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/players" className="view-all">
              VIEW ALL →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- #schedule ---------- */}
      <section id="schedule" className="journey-section">
        <div className="container">
          <Reveal>
            <div className="journey-eyebrow">GAMES</div>
            <h2 className="journey-title">
              SCHE<span className="outline">DULE</span>
            </h2>
            {seasonGames.length > 0 ? (
              <p className="season-record">
                <strong>{currentYear} SEASON</strong> · {record.w}W {record.l}L
                {record.d > 0 ? ` ${record.d}D` : ""}
              </p>
            ) : null}
            {last || next ? (
              <div className="grid grid--2" style={{ marginTop: 24 }}>
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
            ) : (
              <div className="notice" style={{ marginTop: 24 }}>
                경기 기록이 업로드되면 이곳에 공개됩니다.
              </div>
            )}
            <div className="mood-cut">
              <Image
                src={MOOD_CUTS.schedule}
                alt="야간 경기 모습"
                fill
                sizes="(max-width: 1120px) 100vw, 1072px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Link href="/schedule" className="view-all">
              VIEW ALL →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- #archive ---------- */}
      <section id="archive" className="journey-section">
        <div className="container">
          <Reveal>
            <div className="journey-eyebrow">HISTORY & RECORDS</div>
            <h2 className="journey-title">
              ARCH<span className="outline">IVE</span>
            </h2>
            {data.awards.length > 0 ? (
              <>
                <p className="season-record">
                  <strong>{latestAwardSeason} AWARDS</strong>
                </p>
                <div className="grid grid--3" style={{ marginTop: 20 }}>
                  {["MVP", "BEST_BATTER", "BEST_PITCHER"].map((type) => {
                    const winner = data.awards.find(
                      (a) => a.award_type === type
                    );
                    if (!winner) return null;
                    const photo =
                      latestAwardSeason === "2025"
                        ? HOME_AWARD_PHOTOS[type]
                        : winner.photo_url;
                    return (
                      <div key={type} className="card">
                        {photo ? (
                          <div className="award-card__photo">
                            <Image
                              src={photo}
                              alt={winner.player_name}
                              fill
                              sizes="(max-width: 560px) 100vw, 33vw"
                              style={{ objectFit: "contain", objectPosition: "center" }}
                            />
                          </div>
                        ) : null}
                        <div className="award-card__type">
                          {AWARD_LABELS[type]}
                        </div>
                        <div className="award-card__number">
                          {winner.player_number != null
                            ? pad2(winner.player_number)
                            : "—"}
                        </div>
                        <div className="award-card__player">
                          {winner.player_name}
                        </div>
                        {winner.player_name_en ? (
                          <div className="award-card__sub">
                            {winner.player_name_en}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
            {data.hofStudents > 0 ? (
              <Link
                href="/archive?tab=hof"
                className="card card--hover"
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span
                  className="wordmark"
                  style={{ fontSize: "clamp(20px, 3.5vw, 28px)" }}
                >
                  HALL OF <span className="outline-red">FAME</span>
                </span>
                <span className="season-record" style={{ margin: 0 }}>
                  {data.hofStudents} MEMBERS
                  {data.hofFaculty > 0 ? " + FACULTY" : ""} →
                </span>
              </Link>
            ) : null}
            <div className="mood-cut">
              <Image
                src={MOOD_CUTS.archive}
                alt="경기 장면"
                fill
                sizes="(max-width: 1120px) 100vw, 1072px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Link href="/archive" className="view-all">
              VIEW ALL →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- #stats ---------- */}
      <section id="stats" className="journey-section">
        <div className="container">
          <Reveal>
            <div className="journey-eyebrow">DATA & AI</div>
            <h2 className="journey-title">
              <span className="outline">STATS</span>
            </h2>
            <div className="cta-panel" style={{ marginTop: 24 }}>
              <div>
                <div className="cta-panel__title">
                  DEVILS <span style={{ color: "var(--red)" }}>INSIGHT AI</span>
                </div>
                <p className="cta-panel__sub">
                  선수별 타격·투구 기록부터 AI 경기 분석까지 — 데빌스의 모든
                  데이터를 분석 플랫폼에서 확인하세요.
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
            <div className="mood-cut">
              <Image
                src={MOOD_CUTS.stats}
                alt="잠실야구장 단체 사진"
                fill
                sizes="(max-width: 1120px) 100vw, 1072px"
                style={{ objectFit: "cover" }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- #shop ---------- */}
      <section id="shop" className="journey-section" style={{ paddingBottom: 24 }}>
        <div className="container">
          <Reveal>
            <div className="journey-eyebrow">GOODS</div>
            <h2 className="journey-title">
              <span className="outline">DEVILS</span> SHOP
            </h2>
            {data.surveyProducts.length > 0 ? (
              <div className="grid grid--2" style={{ marginTop: 24 }}>
                {data.surveyProducts.map((p) => (
                  <div key={p.id} className="card">
                    <span className="pill">수요조사 진행 중</span>
                    <div className="product-card__name" style={{ marginTop: 12 }}>
                      {p.name}
                    </div>
                    <div className="product-card__meta">
                      {p.season ? <span>{p.season}</span> : null}
                      {p.price_estimate != null ? (
                        <span>예상가 {p.price_estimate.toLocaleString()}원</span>
                      ) : null}
                    </div>
                    <Link
                      href="/shop"
                      className="btn btn--primary"
                      style={{ marginTop: 16 }}
                    >
                      신청하기
                    </Link>
                  </div>
                ))}
              </div>
            ) : data.latestProducts.length > 0 ? (
              <div className="grid grid--3" style={{ marginTop: 24 }}>
                {data.latestProducts.map((p) => (
                  <div key={p.id} className="card">
                    <div className="product-card__name">{p.name}</div>
                    <div className="product-card__meta">
                      {p.season ? <span>{p.season}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice" style={{ marginTop: 24 }}>
                지금 진행 중인 수요조사가 없습니다. 새 굿즈 소식이 준비되면
                이곳에서 알려드립니다.
              </div>
            )}
            <Link href="/shop" className="view-all">
              VIEW ALL →
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
