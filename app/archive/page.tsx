import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import EventLightbox from "../components/EventLightbox";
import VisualBand from "@/app/components/VisualBand";

export const metadata: Metadata = { title: "Archive" };
export const revalidate = 300;

const VIEWS = [
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

// media는 허브의 MEDIA 섹션으로 분리 — 행사 그리드에서는 제외
const EVENT_CATEGORIES: { key: string; label: string }[] = [
  { key: "baseball_night", label: "야구의 밤" },
  { key: "booth", label: "부스" },
  { key: "competition", label: "대회" },
  { key: "exchange", label: "교류전" },
  { key: "club", label: "동아리" },
];

// 디자인 허브의 4개 대형 타일
const HUB_TILES = [
  {
    href: "/devils#timeline",
    title: "HISTORY",
    sub: "History of Devils",
    desc: "2022년 창단부터 현재까지의 시즌별 활동과 팀의 발자취",
  },
  {
    href: "/archive?tab=awards",
    title: "AWARDS",
    sub: "Awards of Devils",
    desc: "MVP부터 Manager까지, 시즌별 수상자와 데빌스의 성과",
  },
  {
    href: "/archive?tab=hof",
    title: "HALL OF FAME",
    sub: "Hall of Fame",
    desc: "팀을 빛낸 선수·매니저와 Utah Asia Campus Faculty",
  },
  {
    href: "/archive?tab=events",
    title: "ARCHIVE",
    sub: "Archive of Devils",
    desc: "야구의 밤, 교류 활동, 캠퍼스 부스와 외부 행사 아카이브",
  },
];

type SeasonAward = {
  id: string;
  season: string;
  award_type: string;
  player_name: string;
  player_name_en: string | null;
  player_number: number | null;
  photo_url?: string | null;
};

type HofMember = {
  id: string;
  name_ko: string;
  name_en: string;
  number: number | null;
  birth_date: string | null;
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

// 진행 중 시즌(어워즈 미확정) — 시즌 종료 후 공개 placeholder를 노출한다
const CURRENT_SEASON = String(new Date().getFullYear());

// "2001-01-12" → "2001.01.12" (디자인 표기)
function formatBirth(date: string | null): string | null {
  return date ? date.replaceAll("-", ".") : null;
}

// 디자인의 소문자 이니셜("e a kim") — season_awards의 'E A KIM' 표기를 재사용하고,
// 어워즈에 없는 인물은 name_en 단어 첫 글자로 대체한다
function initialsOf(
  m: { name_ko: string; name_en: string },
  map: Map<string, string>
): string {
  const fromAwards = map.get(m.name_ko);
  if (fromAwards) return fromAwards.toLowerCase();
  const words = m.name_en.trim().split(/\s+/);
  if (words.length < 2) return m.name_en.toLowerCase();
  const given = words.slice(0, -1).map((w) => w[0]);
  return [...given, words[words.length - 1]].join(" ").toLowerCase();
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: { tab?: string; category?: string };
}) {
  const view = VIEWS.some((t) => t.key === searchParams.tab)
    ? (searchParams.tab as (typeof VIEWS)[number]["key"])
    : null;
  const supabase = getSupabase();

  let awards: SeasonAward[] | null = null;
  let hof: HofMember[] | null = null;
  let events: ArchiveEvent[] | null = null;
  let mediaLinks: ArchiveEvent[] = [];
  const initialsMap = new Map<string, string>();

  if (!supabase) {
    console.error("[archive] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
  } else if (view === null) {
    const { data, error } = await supabase
      .from("archive_events")
      .select(
        "id, title, category, event_date, description, photo_urls, external_link, is_featured"
      )
      .eq("category", "media");
    if (error) console.error("[archive] media 조회 실패:", error.message);
    mediaLinks = (data as ArchiveEvent[]) ?? [];
  } else if (view === "awards") {
    let res: { data: unknown; error: { code?: string; message: string } | null } =
      await supabase
        .from("season_awards")
        .select(
          "id, season, award_type, player_name, player_name_en, player_number, photo_url"
        )
        .order("season", { ascending: false });
    if (res.error?.code === "42703") {
      // photo_url 컬럼 미생성(sql/05 실행 전) — 사진 없이 폴백
      console.error("[archive] season_awards.photo_url 없음 — sql/05_awards_photo.sql 실행 필요");
      res = await supabase
        .from("season_awards")
        .select("id, season, award_type, player_name, player_name_en, player_number")
        .order("season", { ascending: false });
    }
    if (res.error) console.error("[archive] season_awards 조회 실패:", res.error.message);
    awards = (res.data as SeasonAward[]) ?? null;
  } else if (view === "hof") {
    const [hofRes, awardsRes] = await Promise.all([
      supabase
        .from("hall_of_fame")
        .select(
          "id, name_ko, name_en, number, birth_date, active_period, roles, achievements, hof_points, hof_category, inducted_year, photo_url, sort_order"
        )
        .order("inducted_year", { ascending: false })
        .order("sort_order", { ascending: true }),
      supabase.from("season_awards").select("player_name, player_name_en"),
    ]);
    if (hofRes.error)
      console.error("[archive] hall_of_fame 조회 실패:", hofRes.error.message);
    if (awardsRes.error)
      console.error("[archive] season_awards 조회 실패:", awardsRes.error.message);
    hof = (hofRes.data as HofMember[]) ?? null;
    (awardsRes.data ?? []).forEach((a: { player_name: string; player_name_en: string | null }) => {
      if (a.player_name_en) initialsMap.set(a.player_name, a.player_name_en);
    });
  } else {
    const { data, error } = await supabase
      .from("archive_events")
      .select(
        "id, title, category, event_date, description, photo_urls, external_link, is_featured"
      )
      .neq("category", "media")
      .order("event_date", { ascending: false, nullsFirst: false });
    if (error) console.error("[archive] archive_events 조회 실패:", error.message);
    events = (data as ArchiveEvent[]) ?? null;
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
  const showCurrentPlaceholder =
    view === "awards" && awards !== null && !awardsBySeason.has(CURRENT_SEASON);

  // 학생/매니저는 헌액 연도 그룹으로, faculty는 별도 섹션으로 분리
  const hofStudents = (hof ?? []).filter((m) => m.hof_category !== "faculty");
  const hofFaculty = (hof ?? []).filter((m) => m.hof_category === "faculty");
  const hofByYear = new Map<number, HofMember[]>();
  hofStudents.forEach((m) => {
    if (!hofByYear.has(m.inducted_year)) hofByYear.set(m.inducted_year, []);
    hofByYear.get(m.inducted_year)!.push(m);
  });

  const youtube = mediaLinks.find((m) => m.title.toLowerCase().includes("youtube"));
  const instagram = mediaLinks.find((m) =>
    m.title.toLowerCase().includes("instagram")
  );

  return (
    <div className="container">
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="hero__meta">HISTORY & RECORDS</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 12 }}
        >
          ARCH<span className="outline">IVE</span>
        </h1>
        <p className="hero__tagline">
          연혁, 시즌 어워즈, 명예의 전당, 그리고 Utah Devils가 함께한 행사들의
          기록입니다.
        </p>
      </section>
      <VisualBand image="/images/home/team-celebration.png" alt="Utah Devils 단체 사진" label="MOMENTS THAT STAY" />

      {view === null ? (
        /* ---------- 허브: 4개 대형 타일 + MEDIA ---------- */
        <>
          <div className="archive-hub-list">
            {HUB_TILES.map((t) => (
              <Link key={t.title} href={t.href} className="hub-tile">
                <div className="hub-tile__sub">{t.sub}</div>
                <div className="wordmark hub-tile__title">{t.title}</div>
                <p className="hub-tile__desc">{t.desc}</p>
              </Link>
            ))}
          </div>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title" style={{ fontSize: 32 }}>
                <span className="outline">MEDIA</span>
              </h2>
            </div>
            <div className="archive-hub-list">
              <a
                href={youtube?.external_link ?? "https://youtube.com/@utahdevils"}
                target="_blank"
                rel="noopener noreferrer"
                className="hub-tile media-tile"
              >
                <div className="hub-tile__sub">DEVILS TV</div>
                <div className="wordmark hub-tile__title">
                  YOU<span style={{ color: "var(--red)" }}>TUBE</span> ↗
                </div>
                <p className="hub-tile__desc">
                  경기 하이라이트와 동아리 영상 콘텐츠
                </p>
              </a>
              <a
                href={
                  instagram?.external_link ??
                  "https://www.instagram.com/uac.baseball"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hub-tile media-tile"
              >
                <div className="hub-tile__sub">@uac.baseball</div>
                <div className="wordmark hub-tile__title">
                  INSTA<span style={{ color: "var(--red)" }}>GRAM</span> ↗
                </div>
                <p className="hub-tile__desc">일상, 행사, 경기 소식 피드</p>
              </a>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="tabs">
            <Link href="/archive" className="tab">
              ← HUB
            </Link>
            {VIEWS.map((t) => (
              <Link
                key={t.key}
                href={`/archive?tab=${t.key}`}
                className={`tab${t.key === view ? " active" : ""}`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {!supabase ? (
            <div className="notice">아카이브 데이터를 준비 중입니다.</div>
          ) : view === "awards" ? (
            /* ---------- Awards of Devils ---------- */
            awards === null ? (
              <div className="notice">아카이브 데이터를 준비 중입니다.</div>
            ) : (
              <>
                {showCurrentPlaceholder ? (
                  <section style={{ marginBottom: 40 }}>
                    <div className="section-head">
                      <h2 className="section-title" style={{ fontSize: 28 }}>
                        {CURRENT_SEASON} <span className="outline">AWARDS</span>
                      </h2>
                      <span className="pill">SEASON IN PROGRESS</span>
                    </div>
                    <div className="grid grid--3">
                      {AWARD_TYPES.map((t) => (
                        <div key={t.key} className="card award-card--placeholder">
                          <div className="award-card__type">{t.label}</div>
                          <div className="award-card__number">00</div>
                          <div
                            className="award-card__player"
                            style={{ color: "var(--text-muted)" }}
                          >
                            시즌 종료 후 공개
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {awardsBySeason.size === 0 && !showCurrentPlaceholder ? (
                  <div className="notice">
                    시즌 어워즈는 시즌 종료 후 공개됩니다. 시즌이 끝나면 6개
                    부문 수상자가 이곳에 기록됩니다.
                  </div>
                ) : (
                  Array.from(awardsBySeason.entries()).map(([season, list]) => (
                    <section key={season} style={{ marginBottom: 40 }}>
                      <div className="section-head">
                        <h2 className="section-title" style={{ fontSize: 28 }}>
                          {season} <span className="outline">AWARDS</span>
                        </h2>
                      </div>
                      <div className="grid grid--3">
                        {AWARD_TYPES.map((t) => {
                          const winner = list.find(
                            (a) => a.award_type === t.key
                          );
                          return (
                            <div key={t.key} className="card card--hover">
                              {winner?.photo_url ? (
                                <div className="award-card__photo">
                                  <Image
                                    src={winner.photo_url}
                                    alt={winner.player_name}
                                    fill
                                    sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                                    style={{ objectFit: "cover", objectPosition: "top" }}
                                  />
                                </div>
                              ) : null}
                              <div className="award-card__type">{t.label}</div>
                              {winner ? (
                                <>
                                  <div className="award-card__number">
                                    {winner.player_number != null
                                      ? String(winner.player_number).padStart(
                                          2,
                                          "0"
                                        )
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
                                </>
                              ) : (
                                <div
                                  className="award-card__player"
                                  style={{
                                    color: "var(--text-muted)",
                                    marginTop: 8,
                                  }}
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
                )}
              </>
            )
          ) : view === "hof" ? (
            /* ---------- Hall of Fame ---------- */
            hofByYear.size === 0 && hofFaculty.length === 0 ? (
              <div className="notice">
                아직 헌액자가 없습니다. 명예의 전당에 오른 데빌스가 이곳에
                기록됩니다.
              </div>
            ) : (
              <>
                {Array.from(hofByYear.entries()).map(([year, list]) => (
                  <section key={year} style={{ marginBottom: 40 }}>
                    <div className="section-head">
                      <h2 className="section-title" style={{ fontSize: 28 }}>
                        CLASS OF <span className="outline">{year}</span>
                      </h2>
                    </div>
                    <div className="grid grid--2">
                      {list.map((m) => (
                        <div key={m.id} className="card hof-detail">
                          <div className="hof-detail__side">
                            {m.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="hof-card__photo"
                                src={m.photo_url}
                                alt={m.name_ko}
                              />
                            ) : null}
                            <div className="hof-detail__number">
                              {m.number != null ? m.number : "UD"}
                            </div>
                            <div className="hof-detail__initials">
                              {initialsOf(m, initialsMap)}
                            </div>
                          </div>
                          <div className="hof-detail__body">
                            <div className="hof-detail__idline">
                              {[
                                m.name_ko,
                                m.name_en,
                                formatBirth(m.birth_date),
                              ]
                                .filter(Boolean)
                                .join(" | ")}
                            </div>
                            {m.active_period ? (
                              <div className="hof-detail__period">
                                {m.active_period}
                              </div>
                            ) : null}
                            {m.roles?.length ? (
                              <div className="hof-detail__lines">
                                {m.roles.map((r, i) => (
                                  <div key={i}>{r}</div>
                                ))}
                              </div>
                            ) : null}
                            {m.achievements?.length ? (
                              <div className="hof-detail__lines">
                                {m.achievements.map((a, i) => (
                                  <div key={i}>{a}</div>
                                ))}
                              </div>
                            ) : null}
                            {m.hof_points != null ? (
                              <div className="hof-detail__points">
                                Hall of Fame Points | {m.hof_points}
                                {m.hof_category ? ` (${m.hof_category})` : ""}
                              </div>
                            ) : null}
                            <div className="hof-detail__inducted">
                              Inducted into the Hall of Fame in {m.inducted_year}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {hofFaculty.length > 0 ? (
                  <section style={{ marginBottom: 40 }}>
                    <div className="section-head">
                      <h2
                        className="section-title"
                        style={{ fontSize: "clamp(20px, 3.5vw, 28px)" }}
                      >
                        Faculty of The University of Utah{" "}
                        <span className="outline">Asia Campus</span>
                      </h2>
                    </div>
                    <div className="grid grid--2">
                      {hofFaculty.map((m) => (
                        <div key={m.id} className="card card--hover hof-card">
                          {m.photo_url ? (
                            <div className="hof-card__photo--next">
                              <Image
                                src={m.photo_url}
                                alt={m.name_ko}
                                fill
                                sizes="96px"
                                style={{ objectFit: "cover", objectPosition: "top" }}
                              />
                            </div>
                          ) : null}
                          <div>
                          <div className="hof-card__name">{m.name_ko}</div>
                          {m.roles?.length ? (
                            <div
                              className="award-card__sub"
                              style={{ marginTop: 6 }}
                            >
                              {m.roles.join(" · ")}
                            </div>
                          ) : null}
                          <div
                            className="hof-detail__inducted"
                            style={{ marginTop: 10 }}
                          >
                            Inducted into the Hall of Fame in {m.inducted_year}
                          </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            )
          ) : (
            /* ---------- Archive of Devils (행사) ---------- */
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
                  아직 등록된 행사 기록이 없습니다. 야구의 밤, 부스, 교류전
                  등의 활동이 이곳에 기록됩니다.
                </div>
              ) : (
                <div className="grid grid--3">
                  {filteredEvents.map((e) => {
                    const label =
                      EVENT_CATEGORIES.find((c) => c.key === e.category)
                        ?.label ?? e.category;
                    return (
                      <div key={e.id} className="card card--hover">
                        {e.photo_urls?.length ? (
                          <EventLightbox title={e.title} photos={e.photo_urls} />
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
        </>
      )}
    </div>
  );
}
