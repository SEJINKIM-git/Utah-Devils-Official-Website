import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";

export const metadata: Metadata = { title: "Devils" };
// force-dynamic으로 쿼리 정상 동작을 검증 완료(2026-07). ISR로 복귀하되
// 빌드 시점 일시 장애가 캐시에 고정되지 않도록 재검증 주기를 둔다.
export const revalidate = 300;

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
    .order("year", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("month", { ascending: true });
  if (error) {
    console.error("[devils] timeline_events 조회 실패:", error.message);
    return null;
  }
  return data as TimelineEvent[];
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
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="hero__meta">ABOUT US</div>
        <h1 className="wordmark" style={{ fontSize: "clamp(44px, 8vw, 88px)", marginTop: 12 }}>
          WE ARE <span className="outline-red">DEVILS</span>
        </h1>
        <p className="hero__tagline">
          Utah Devils는 유타대학교 아시아캠퍼스의 야구동아리입니다. 매 시즌
          리그와 교류전에 참가하며, 야구를 사랑하는 부원들이 함께 성장하는
          팀을 지향합니다.
        </p>
      </section>

      <section className="section" style={{ paddingTop: 24 }}>
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
          <div className="timeline">
            {Array.from(byYear.entries()).map(([year, list]) => (
              <div key={year} className="timeline__item">
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
        )}
      </section>
    </div>
  );
}
