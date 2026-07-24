import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";

export const metadata: Metadata = { title: "Player" };
export const revalidate = 300;

type RosterMember = {
  id: string;
  season: string;
  name_ko: string;
  name_en: string | null;
  number: number | null;
  birth_date: string | null;
  joined: string | null;
  is_captain: boolean;
  positions: string[] | null;
  player_id: number | null;
  sort_order: number;
};

async function fetchRoster(): Promise<RosterMember[] | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.error("[players] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
    return null;
  }
  const { data, error } = await supabase
    .from("roster_members")
    .select(
      "id, season, name_ko, name_en, number, birth_date, joined, is_captain, positions, player_id, sort_order"
    );
  if (error) {
    console.error(
      "[players] roster_members 조회 실패 (sql/01_roster_members.sql 실행 여부 확인):",
      error.message
    );
    return null;
  }
  return data as RosterMember[];
}

function sortByNumber(a: RosterMember, b: RosterMember) {
  return (a.number ?? 999) - (b.number ?? 999) || a.sort_order - b.sort_order;
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { season?: string };
}) {
  const roster = await fetchRoster();

  const seasons = Array.from(new Set((roster ?? []).map((r) => r.season))).sort(
    (a, b) => b.localeCompare(a)
  );
  const currentSeason =
    searchParams.season && seasons.includes(searchParams.season)
      ? searchParams.season
      : seasons[0];
  const members = (roster ?? [])
    .filter((r) => r.season === currentSeason)
    .sort(sortByNumber);

  return (
    <div className="container">
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="hero__meta">ROSTER</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(44px, 8vw, 88px)", marginTop: 12 }}
        >
          <span className="outline">PLAY</span>ERS
        </h1>
        {currentSeason ? (
          <p className="hero__tagline">
            {currentSeason} 시즌 Utah Devils 선수단입니다. 선수 카드를 누르면
            Devils Insight AI의 상세 기록으로 이동합니다.
          </p>
        ) : null}
      </section>

      <section style={{ paddingBottom: 8 }}>
        {roster === null ? (
          <div className="notice">로스터 데이터를 준비 중입니다.</div>
        ) : roster.length === 0 ? (
          <div className="notice">
            새 시즌 로스터를 준비 중입니다. 명단이 확정되면 이곳에 공개됩니다.
          </div>
        ) : (
          <>
            {seasons.length > 1 ? (
              <div className="tabs">
                {seasons.map((s) => (
                  <Link
                    key={s}
                    href={`/players?season=${encodeURIComponent(s)}`}
                    className={`tab${s === currentSeason ? " active" : ""}`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="grid grid--3">
              {members.map((m) => {
                const inner = (
                  <>
                    <div className="player-card__badges">
                      {m.is_captain ? (
                        <span className="badge badge--solid">CAPTAIN</span>
                      ) : null}
                      {m.joined ? (
                        <span
                          className="badge badge--muted"
                          style={{ textTransform: "none" }}
                        >
                          {m.joined}
                        </span>
                      ) : null}
                    </div>
                    <div className="player-card__number">
                      {m.number != null ? m.number : "–"}
                    </div>
                    <div className="player-card__name-ko">{m.name_ko}</div>
                    {m.name_en ? (
                      // 디자인 표기: First/Last 2줄 (예: "Sawyer" / "Ott")
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
                    {m.birth_date ? (
                      <div className="player-card__birth">{m.birth_date}</div>
                    ) : null}
                    {m.positions?.length ? (
                      <div className="player-card__birth">
                        {m.positions.join(" · ")}
                      </div>
                    ) : null}
                  </>
                );
                return m.player_id != null ? (
                  <a
                    key={m.id}
                    className="card player-card"
                    href={`${INSIGHT_AI_URL}/players/${m.player_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={m.id} className="card player-card">
                    {inner}
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
            SEASON <span style={{ color: "var(--red)" }}>STATS</span>
          </div>
          <p className="cta-panel__sub">
            선수별 타격·투구 기록과 AI 분석은 Devils Insight AI에서 확인하세요.
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
