import type { Metadata } from "next";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import VisualBand from "@/app/components/VisualBand";
import TimelineJourney from "@/app/components/TimelineJourney";

export const metadata: Metadata = { title: "Devils" };
// force-dynamic으로 쿼리 정상 동작을 검증 완료(2026-07). ISR로 복귀하되
// 빌드 시점 일시 장애가 캐시에 고정되지 않도록 재검증 주기를 둔다.
export const revalidate = 300;

// 디자인 초안 p2: 연도 블록 옆 스냅 사진 — timeline_events에 사진 컬럼이 없어 정적 매핑
const STORAGE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") +
  "/storage/v1/object/public/official-site/timeline";
const TIMELINE_SNAPS: Record<number, string[]> = {
  2022: [`${STORAGE}/2022/img-122.jpg`],
  2023: [`${STORAGE}/2023/img-125.jpg`, `${STORAGE}/2023/img-128.jpg`],
  2024: [
    `${STORAGE}/2024/img-163.jpg`,
    `${STORAGE}/2024/img-166.jpg`,
    `${STORAGE}/2024/img-169.jpg`,
  ],
  2025: [
    `${STORAGE}/2025/img-204.jpg`,
    `${STORAGE}/2025/img-207.jpg`,
    `${STORAGE}/2025/img-210.jpg`,
  ],
  2026: [
    `${STORAGE}/2026/img-246.jpg`,
    `${STORAGE}/2026/img-249.jpg`,
    `${STORAGE}/2026/img-252.jpg`,
  ],
};

type TimelineEvent = {
  id: string;
  year: number;
  season: string | null;
  month: number | null;
  title: string;
  sort_order: number;
};

async function fetchTimeline(): Promise<TimelineEvent[] | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.error("[devils] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
    return null;
  }
  const { data, error } = await supabase
    .from("timeline_events")
    .select("id, year, season, month, title, sort_order")
    .order("year", { ascending: true });
  if (error) {
    console.error("[devils] timeline_events 조회 실패:", error.message);
    return null;
  }
  // 디자인 규칙: 연도 내 시즌 그룹핑(SPRING 먼저 → FALL), 그 안에서 월 오름차순.
  // sort_order는 시즌별로 1부터 매겨져 연도 전체 정렬 키로 쓰면 시즌이 섞인다.
  const seasonRank = (s: string | null) =>
    s === "SPRING" ? 0 : s === "FALL" ? 1 : 2;
  return (data as TimelineEvent[]).sort(
    (a, b) =>
      a.year - b.year ||
      seasonRank(a.season) - seasonRank(b.season) ||
      (a.month ?? 13) - (b.month ?? 13) ||
      a.sort_order - b.sort_order
  );
}

export default async function DevilsPage() {
  const events = await fetchTimeline();
  const byYear = new Map<number, TimelineEvent[]>();
  (events ?? []).forEach((e) => {
    if (!byYear.has(e.year)) byYear.set(e.year, []);
    byYear.get(e.year)!.push(e);
  });

  return (
    <div className="container">
      <div className="page-hero">
        <VisualBand image="/images/home/team-huddle.png" alt="" label="" />
        <section className="hero page-hero__content">
          <div className="hero__meta">ABOUT US</div>
          <h1 className="wordmark" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 12 }}>
            WE ARE <span className="outline-red">DEVILS</span>
          </h1>
          <p className="hero__tagline">
            Utah Devils는 야구를 통해 사람과 경험을 연결하는 유타대학교
            아시아캠퍼스의 공식 야구동아리입니다.
          </p>
        </section>
      </div>

      <section className="section about-section" style={{ paddingTop: 36 }}>
        <div className="section-head">
          <h2 className="section-title">
            UTAH <span className="outline">DEVILS</span>는?
          </h2>
        </div>
        <div className="about-copy">
          <p>
            2022년 2월 창단한 유타대학교의 야구동아리 Utah Devils는 야구를
            좋아하는 학생들이 모여, 단순히 경기를 하는 것을 넘어 야구가 지닌
            가치와 매력을 함께 만들어 가는 동아리입니다.
          </p>
          <p>
            정기 리그와 교류전, 캠퍼스 행사, Utah Baseball Night를 꾸준히 운영하며
            유타대학교 아시아캠퍼스를 대표하는 야구 커뮤니티로 성장하고
            있습니다.
          </p>
          <p>
            부원들은 경기뿐 아니라 스포츠 산업, 홍보·마케팅, 미디어 콘텐츠
            제작 활동에도 참여합니다. 야구와 자신의 진로를 연결하며 실전 경험과
            대학 생활의 추억을 함께 쌓아 갑니다.
          </p>
        </div>
        <div className="about-activity-list">
          <article>
            <div className="card__eyebrow">ON THE FIELD</div>
            <h3 className="card__title">PLAY</h3>
            <p className="card__body">정기 경기와 교류전을 통해 팀워크와 경기 경험을 쌓습니다.</p>
          </article>
          <article>
            <div className="card__eyebrow">BEYOND THE GAME</div>
            <h3 className="card__title">CREATE</h3>
            <p className="card__body">콘텐츠·홍보·행사 기획으로 데빌스만의 이야기를 만듭니다.</p>
          </article>
          <article>
            <div className="card__eyebrow">ONE COMMUNITY</div>
            <h3 className="card__title">CONNECT</h3>
            <p className="card__body">야구를 좋아하는 학생들이 캠퍼스와 지역 사회를 연결합니다.</p>
          </article>
        </div>
      </section>

      <section id="timeline" className="section" style={{ paddingTop: 24 }}>
        <div className="section-head">
          <h2 className="section-title">
            <span className="outline">TIME</span>LINE
          </h2>
        </div>

        {events === null ? (
          <div className="notice">연혁 데이터를 준비 중입니다.</div>
        ) : events.length === 0 ? (
          <div className="notice">
            아직 등록된 연혁이 없습니다. 관리자 페이지에서 연혁을 추가하면 이곳에
            표시됩니다.
          </div>
        ) : (
          <>
            <TimelineJourney />
            <div className="timeline timeline--gallery timeline--journey">
            {Array.from(byYear.entries()).map(([year, list]) => (
              <div key={year} className="timeline__item">
                <div className="timeline__content">
                  <div className="timeline__year">{year}</div>
                  {list.map((e) => (
                    <div key={e.id} className="timeline__event">
                      <span className="timeline__month">
                        {e.month ? String(e.month).padStart(2, "0") : "--"}
                      </span>
                      <span>{e.title}</span>
                      {e.season ? (
                        <span className="pill pill--muted">{e.season}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
                {TIMELINE_SNAPS[year]?.length ? (
                  <div className="timeline__snaps timeline__snaps--side">
                    {TIMELINE_SNAPS[year].map((url, i) => (
                      <div key={url} className="timeline__snap">
                        <Image
                          src={url}
                          alt={`${year}년 활동 사진 ${i + 1}`}
                          width={1600}
                          height={1200}
                          sizes="(max-width: 720px) 50vw, 168px"
                          className="timeline__photo"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="timeline__item">
              <div
                className="timeline__year"
                style={{ color: "var(--red)", fontSize: 20, letterSpacing: "0.12em" }}
              >
                TO BE CONTINUED
              </div>
            </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
