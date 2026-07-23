import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const metadata: Metadata = { title: "Archive" };
export const revalidate = 300;

const TABS = [
  { key: "awards", label: "AWARDS" },
  { key: "hof", label: "HALL OF FAME" },
  { key: "events", label: "EVENTS" },
] as const;

const AWARD_TYPES: { key: string; label: string }[] = [
  { key: "MVP", label: "MVP" },
  { key: "BEST_BATTER", label: "BEST BATTER" },
  { key: "BEST_PITCHER", label: "BEST PITCHER" },
  { key: "MOST_IMPROVED", label: "MOST IMPROVED" },
  { key: "ROOKIE", label: "ROOKIE" },
  { key: "MANAGER", label: "MANAGER" },
];

const EVENT_CATEGORIES: { key: string; label: string }[] = [
  { key: "baseball_night", label: "야구의 밤" },
  { key: "booth", label: "부스" },
  { key: "competition", label: "대회" },
  { key: "exchange", label: "교류전" },
  { key: "club", label: "동아리" },
  { key: "media", label: "미디어" },
];

type SeasonAward = {
  id: string;
  season: string;
  award_type: string;
  player_name: string;
  player_name_en: string | null;
  player_number: number | null;
};

type HofMember = {
  id: string;
  name_ko: string;
  name_en: string;
  number: number | null;
  active_period: string | null;
  roles: string[] | null;
  achievements: string[] | null;
  hof_points: number | null;
  hof_category: string | null;
  inducted_year: number;
  photo_url: string | null;
  sort_order: number;
};

type ArchiveEvent = {
  id: string;
  title: string;
  category: string;
  event_date: string | null;
  description: string | null;
  photo_urls: string[] | null;
  external_link: string | null;
  is_featured: boolean;
};

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: { tab?: string; category?: string };
}) {
  const tab = TABS.some((t) => t.key === searchParams.tab)
    ? (searchParams.tab as (typeof TABS)[number]["key"])
    : "awards";
  const supabase = getSupabase();

  let awards: SeasonAward[] | null = null;
  let hof: HofMember[] | null = null;
  let events: ArchiveEvent[] | null = null;

  if (!supabase) {
    console.error("[archive] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
  } else {
    if (tab === "awards") {
      const { data, error } = await supabase
        .from("season_awards")
        .select("id, season, award_type, player_name, player_name_en, player_number")
        .order("season", { ascending: false });
      if (error) console.error("[archive] season_awards 조회 실패:", error.message);
      awards = (data as SeasonAward[]) ?? null;
    } else if (tab === "hof") {
      const { data, error } = await supabase
        .from("hall_of_fame")
        .select(
          "id, name_ko, name_en, number, active_period, roles, achievements, hof_points, hof_category, inducted_year, photo_url, sort_order"
        )
        .order("inducted_year", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) console.error("[archive] hall_of_fame 조회 실패:", error.message);
      hof = (data as HofMember[]) ?? null;
    } else {
      const { data, error } = await supabase
        .from("archive_events")
        .select(
          "id, title, category, event_date, description, photo_urls, external_link, is_featured"
        )
        .order("event_date", { ascending: false, nullsFirst: false });
      if (error) console.error("[archive] archive_events 조회 실패:", error.message);
      events = (data as ArchiveEvent[]) ?? null;
    }
  }

  const category = EVENT_CATEGORIES.some((c) => c.key === searchParams.category)
    ? searchParams.category
    : null;
  const filteredEvents = (events ?? []).filter(
    (e) => !category || e.category === category
  );

  const awardsBySeason = new Map<string, SeasonAward[]>();
  (awards ?? []).forEach((a) => {
    if (!awardsBySeason.has(a.season)) awardsBySeason.set(a.season, []);
    awardsBySeason.get(a.season)!.push(a);
  });

  const hofByYear = new Map<number, HofMember[]>();
  (hof ?? []).forEach((m) => {
    if (!hofByYear.has(m.inducted_year)) hofByYear.set(m.inducted_year, []);
    hofByYear.get(m.inducted_year)!.push(m);
  });

  return (
    <div className="container">
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="hero__meta">HISTORY & RECORDS</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(44px, 8vw, 88px)", marginTop: 12 }}
        >
          ARCH<span className="outline">IVE</span>
        </h1>
        <p className="hero__tagline">
          시즌 어워즈, 명예의 전당, 그리고 Utah Devils가 함께한 행사들의
          기록입니다.
        </p>
      </section>

      <div className="tabs">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/archive?tab=${t.key}`}
            className={`tab${t.key === tab ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!supabase ? (
        <div className="notice">아카이브 데이터를 준비 중입니다.</div>
      ) : tab === "awards" ? (
        awardsBySeason.size === 0 ? (
          <div className="notice">
            시즌 어워즈는 시즌 종료 후 공개됩니다. 시즌이 끝나면 6개 부문
            수상자가 이곳에 기록됩니다.
          </div>
        ) : (
          Array.from(awardsBySeason.entries()).map(([season, list]) => (
            <section key={season} style={{ marginBottom: 40 }}>
              <div className="section-head">
                <h2 className="section-title" style={{ fontSize: 28 }}>
                  {season} <span className="outline">AWARDS</span>
                </h2>
                <span className="pill">{season}</span>
              </div>
              <div className="grid grid--3">
                {AWARD_TYPES.map((t) => {
                  const winner = list.find((a) => a.award_type === t.key);
                  return (
                    <div key={t.key} className="card card--hover">
                      <div className="award-card__type">{t.label}</div>
                      {winner ? (
                        <>
                          <div className="award-card__player">
                            {winner.player_number != null ? (
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  color: "var(--red)",
                                  marginRight: 8,
                                }}
                              >
                                {String(winner.player_number).padStart(2, "0")}
                              </span>
                            ) : null}
                            {winner.player_name}
                          </div>
                          {winner.player_name_en ? (
                            <div className="award-card__sub">
                              {winner.player_name_en}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div
                          className="award-card__player"
                          style={{ color: "var(--text-muted)" }}
                        >
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )
      ) : tab === "hof" ? (
        hofByYear.size === 0 ? (
          <div className="notice">
            아직 헌액자가 없습니다. 명예의 전당에 오른 데빌스가 이곳에
            기록됩니다.
          </div>
        ) : (
          Array.from(hofByYear.entries()).map(([year, list]) => (
            <section key={year} style={{ marginBottom: 40 }}>
              <div className="section-head">
                <h2 className="section-title" style={{ fontSize: 28 }}>
                  CLASS OF <span className="outline">{year}</span>
                </h2>
              </div>
              <div className="grid grid--2">
                {list.map((m) => (
                  <div key={m.id} className="card card--hover hof-card">
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="hof-card__photo"
                        src={m.photo_url}
                        alt={m.name_ko}
                      />
                    ) : (
                      <div className="hof-card__placeholder">
                        {m.number != null ? m.number : "UD"}
                      </div>
                    )}
                    <div>
                      <div className="hof-card__name">
                        {m.name_ko}
                        {m.hof_category ? (
                          <span className="pill" style={{ marginLeft: 10 }}>
                            {m.hof_category}
                          </span>
                        ) : null}
                      </div>
                      <div className="award-card__sub">
                        {m.name_en}
                        {m.active_period ? ` · ${m.active_period}` : ""}
                        {m.hof_points != null ? ` · ${m.hof_points}P` : ""}
                      </div>
                      {m.roles?.length ? (
                        <div className="award-card__sub" style={{ marginTop: 4 }}>
                          {m.roles.join(" · ")}
                        </div>
                      ) : null}
                      {m.achievements?.length ? (
                        <ul>
                          {m.achievements.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )
      ) : (
        <>
          <div className="tabs" style={{ marginBottom: 20 }}>
            <Link
              href="/archive?tab=events"
              className={`tab${!category ? " active" : ""}`}
            >
              전체
            </Link>
            {EVENT_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={`/archive?tab=events&category=${c.key}`}
                className={`tab${c.key === category ? " active" : ""}`}
              >
                {c.label}
              </Link>
            ))}
          </div>
          {filteredEvents.length === 0 ? (
            <div className="notice">
              아직 등록된 행사 기록이 없습니다. 야구의 밤, 부스, 교류전 등의
              활동이 이곳에 기록됩니다.
            </div>
          ) : (
            <div className="grid grid--3">
              {filteredEvents.map((e) => {
                const label =
                  EVENT_CATEGORIES.find((c) => c.key === e.category)?.label ??
                  e.category;
                return (
                  <div key={e.id} className="card card--hover">
                    {e.photo_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="event-card__photo"
                        src={e.photo_urls[0]}
                        alt={e.title}
                      />
                    ) : null}
                    <div className="event-card__date">
                      {e.event_date ?? ""}{" "}
                      <span className="pill pill--muted">{label}</span>
                      {e.is_featured ? (
                        <span className="pill" style={{ marginLeft: 6 }}>
                          FEATURED
                        </span>
                      ) : null}
                    </div>
                    <div className="event-card__title">{e.title}</div>
                    {e.description ? (
                      <p className="event-card__desc">{e.description}</p>
                    ) : null}
                    {e.external_link ? (
                      <a
                        href={e.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ marginTop: 14, padding: "8px 14px" }}
                      >
                        LINK ↗
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
