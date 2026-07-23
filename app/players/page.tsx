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
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("roster_members")
    .select(
      "id, season, name_ko, name_en, number, birth_date, joined, is_captain, positions, player_id, sort_order"
    );
  if (error) return null;
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
          <div className="notice">
            로스터를 불러오지 못했습니다. Supabase에{" "}
            <strong>roster_members</strong> 테이블이 필요합니다 —{" "}
            <strong>sql/01_roster_members.sql</strong>을 SQL Editor에서 실행해
            주세요.
          </div>
        ) : roster.length === 0 ? (
          <div className="notice">
            등록된 로스터가 없습니다. <strong>roster_members</strong> 테이블에
            시즌 명단을 추가하면 이곳에 표시됩니다.
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
                        <span className="badge badge--muted">{m.joined}</span>
                      ) : null}
                    </div>
                    <div className="player-card__number">
                      {m.number != null ? m.number : "–"}
                    </div>
                    <div className="player-card__name-ko">{m.name_ko}</div>
                    {m.name_en ? (
                      <div className="player-card__name-en">{m.name_en}</div>
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
