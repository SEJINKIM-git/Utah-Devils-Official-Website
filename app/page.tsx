import Link from "next/link";
import Image from "next/image";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";
import { HISTORICAL_GAMES, withHistoricalGames } from "@/lib/historical-games";
import Reveal from "./components/Reveal";

export const revalidate = 300;

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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
  sort_order: number;
};

type Award = {
  id: string;
  season: string;
  award_type: string;
  player_name: string;
  player_number: number | null;
};

type TimelineEvent = {
  year: number;
  season: string | null;
  month: number | null;
  title: string;
  sort_order: number;
};

const AWARD_LABELS: Record<string, string> = {
  MVP: "MVP",
  BEST_BATTER: "BEST BATTER",
  BEST_PITCHER: "BEST PITCHER",
};

const pad2 = (value: number) => String(value).padStart(2, "0");
const formatDate = (date: string) => `${MONTH_ABBR[Number(date.slice(5, 7)) - 1] ?? ""} ${date.slice(8, 10)}`;

async function fetchJourneyData() {
  const empty = {
    games: HISTORICAL_GAMES as Game[],
    roster: [] as RosterMember[],
    awards: [] as Award[],
    milestones: [] as TimelineEvent[],
  };
  const supabase = getSupabase();
  if (!supabase) {
    console.error("[home] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
    return empty;
  }

  const [gamesRes, rosterRes, awardsRes, timelineRes] = await Promise.all([
    supabase.from("games").select("id, date, time, opponent, location, result, score_us, score_them").order("date", { ascending: true }).limit(100),
    supabase.from("roster_members").select("id, season, name_ko, name_en, number, is_captain, sort_order").limit(60),
    supabase.from("season_awards").select("id, season, award_type, player_name, player_number").in("award_type", ["MVP", "BEST_BATTER", "BEST_PITCHER"]).order("season", { ascending: false }).limit(30),
    supabase.from("timeline_events").select("year, season, month, title, sort_order").order("year", { ascending: true }).limit(200),
  ]);

  for (const [name, result] of [["games", gamesRes], ["roster_members", rosterRes], ["season_awards", awardsRes], ["timeline_events", timelineRes]] as const) {
    if (result.error) console.error(`[home] ${name} 조회 실패:`, result.error.message);
  }

  const allRoster = (rosterRes.data as RosterMember[]) ?? [];
  const latestSeason = Array.from(new Set(allRoster.map((member) => member.season))).sort().at(-1);
  const roster = allRoster
    .filter((member) => member.season === latestSeason)
    .sort((a, b) => Number(b.is_captain) - Number(a.is_captain) || (a.number ?? 999) - (b.number ?? 999) || a.sort_order - b.sort_order);
  const allAwards = (awardsRes.data as Award[]) ?? [];
  const currentYear = String(new Date().getFullYear());
  const latestAwardSeason = Array.from(new Set(allAwards.map((award) => award.season))).filter((season) => season < currentYear).sort().at(-1);
  const timeline = (timelineRes.data as TimelineEvent[]) ?? [];
  const byYear = new Map<number, TimelineEvent[]>();
  timeline.forEach((event) => byYear.set(event.year, [...(byYear.get(event.year) ?? []), event]));
  const milestones = Array.from(byYear.values())
    .map((events) => events.sort((a, b) => (a.month ?? 13) - (b.month ?? 13) || a.sort_order - b.sort_order)[0])
    .slice(0, 5);

  return {
    games: withHistoricalGames((gamesRes.data as Game[]) ?? []) as Game[],
    roster,
    awards: allAwards.filter((award) => award.season === latestAwardSeason),
    milestones,
  };
}

export default async function HomePage() {
  const data = await fetchJourneyData();
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = today.slice(0, 4);
  const finished = data.games.filter((game) => game.score_us != null && game.score_them != null && game.date <= today);
  const last = finished.at(-1) ?? null;
  const next = data.games.find((game) => game.date > today && game.score_us == null) ?? null;
  const seasonGames = data.games.filter((game) => game.date.slice(0, 4) === currentYear);
  const record = {
    w: seasonGames.filter((game) => game.result === "W").length,
    l: seasonGames.filter((game) => game.result === "L").length,
    d: seasonGames.filter((game) => game.result === "D").length,
  };
  const featuredRoster = data.roster.slice(0, 5);
  const featuredAwards = data.awards.slice(0, 3);

  return (
    <>
      <section id="hero" className="hero hero--journey">
        <Image className="hero__photo" src="/images/home/team-celebration.png" alt="경기 후 함께 기념 사진을 남긴 Utah Devils 선수단" fill priority sizes="100vw" />
        <div className="hero__scrim" aria-hidden="true" />
        <div className="container">
          <div className="hero__meta">UTAH ASIA CAMPUS · BASEBALL CLUB</div>
          <h1 className="wordmark hero__wordmark">UTAH<br /><span className="outline">DEVILS</span></h1>
          <p className="hero__tagline">시즌의 로스터와 경기 결과, 팀의 순간과 데이터를 한 흐름으로 확인하는 Utah Devils 기록 플랫폼입니다.</p>
          <Link href="/devils" className="hero__cta">EXPLORE THE DEVILS <span aria-hidden="true">→</span></Link>
          {next ? <p className="hero-teaser"><strong>NEXT GAME</strong> · {formatDate(next.date)} VS {next.opponent}</p> : null}
          <div className="hero-scroll" aria-hidden="true">SCROLL <span>⌄</span></div>
        </div>
      </section>

      <nav className="platform-index" aria-label="Utah Devils 주요 기록">
        <div className="container">
          <Link href="#devils">01 / DEVILS</Link><Link href="#player">02 / ROSTER</Link><Link href="#schedule">03 / SCHEDULE</Link><Link href="#archive">04 / ARCHIVE</Link><Link href="#stats">05 / STATS</Link>
        </div>
      </nav>

      <section id="devils" className="platform-stage platform-stage--devils">
        <div className="platform-stage__background" aria-hidden="true"><Image src="/images/home/night-lineup.png" alt="" fill sizes="100vw" /></div>
        <div className="container"><Reveal>
          <div className="platform-stage__copy">
            <div className="journey-eyebrow">01 / CLUB IDENTITY</div>
            <h2 className="platform-stage__title">ONE TEAM.<br /><span className="outline">ONE DEVILS.</span></h2>
            <p className="platform-stage__lead">2022년부터 이어진 시즌의 사람과 기록을 연결합니다. 팀의 시작부터 현재까지, 데빌스가 만든 장면을 한눈에 따라갈 수 있습니다.</p>
            <div className="platform-facts"><span><b>2022</b> ESTABLISHED</span><span><b>100+</b> MEMBERS</span><span><b>INCHEON</b> HOME</span></div>
            <Link href="/devils" className="view-all">TEAM HISTORY <span aria-hidden="true">→</span></Link>
          </div>
          {data.milestones.length > 0 ? <ol className="platform-timeline" aria-label="주요 연혁">{data.milestones.map((milestone) => <li key={`${milestone.year}-${milestone.title}`}><b>{milestone.year}</b><span>{milestone.month ? `${pad2(milestone.month)} / ` : ""}{milestone.title}</span></li>)}</ol> : null}
          <div className="stage-3d stage-3d--devils" aria-hidden="true"><span /><span /><Image src="/logos/emblem.png" alt="" width={260} height={260} /></div>
        </Reveal></div>
      </section>

      <section id="player" className="platform-stage platform-stage--roster">
        <div className="platform-stage__background" aria-hidden="true"><Image src="/images/home/hero-team.png" alt="" fill sizes="100vw" /></div>
        <div className="container"><Reveal>
          <div className="platform-stage__copy platform-stage__copy--right">
            <div className="journey-eyebrow">02 / ROSTER</div>
            <h2 className="platform-stage__title">PLAYERS,<br /><span className="outline">IN FOCUS.</span></h2>
            <p className="platform-stage__lead">등번호와 입단 시즌, 주장 표시까지. 매 시즌의 선수단을 정확한 프로필 정보로 확인할 수 있습니다.</p>
            {featuredRoster.length > 0 ? <ol className="platform-roster" aria-label="주요 선수단">{featuredRoster.map((member) => <li key={member.id}><b>{String(member.number ?? 0).padStart(2, "0")}</b><span>{member.name_ko}</span><small>{member.is_captain ? "CAPTAIN" : member.season}</small></li>)}</ol> : null}
            <Link href="/players" className="view-all">VIEW FULL ROSTER <span aria-hidden="true">→</span></Link>
          </div>
          <div className="stage-3d stage-3d--roster" aria-hidden="true"><span /><span /><span className="stage-3d__number">35</span></div>
        </Reveal></div>
      </section>

      <section id="schedule" className="platform-stage platform-stage--schedule">
        <div className="platform-stage__background" aria-hidden="true"><Image src="/images/home/night-walk.png" alt="" fill sizes="100vw" /></div>
        <div className="container"><Reveal>
          <div className="platform-stage__copy">
            <div className="journey-eyebrow">03 / GAME DAY</div>
            <h2 className="platform-stage__title">EVERY GAME.<br /><span className="outline">ON RECORD.</span></h2>
            <p className="platform-stage__lead">과거 경기의 결과와 이번 시즌의 일정을 같은 타임라인에서 이어 봅니다. 기록은 AI 분석과 별개로 바로 공개됩니다.</p>
            {seasonGames.length > 0 ? <p className="platform-season-line"><b>{currentYear}</b> SEASON / {record.w}W {record.l}L{record.d > 0 ? ` ${record.d}D` : ""}</p> : null}
            <Link href="/schedule" className="view-all">ALL RESULTS &amp; SCHEDULE <span aria-hidden="true">→</span></Link>
          </div>
          <div className="platform-score" aria-label="최근 경기"><span className="platform-score__label">{last ? "LAST GAME" : "NEXT GAME"}</span>{last ? <><strong>{pad2(last.score_us!)}<i>:</i>{pad2(last.score_them!)}</strong><span>VS {last.opponent} · {formatDate(last.date)}</span></> : next ? <><strong>–<i>:</i>–</strong><span>VS {next.opponent} · {formatDate(next.date)}</span></> : <span>SEASON RECORDS COMING SOON</span>}</div>
          <div className="stage-3d stage-3d--schedule" aria-hidden="true"><span /><span /></div>
        </Reveal></div>
      </section>

      <section id="archive" className="platform-stage platform-stage--archive">
        <div className="platform-stage__background" aria-hidden="true"><Image src="/images/home/team-huddle.png" alt="" fill sizes="100vw" /></div>
        <div className="container"><Reveal>
          <div className="platform-stage__copy platform-stage__copy--right">
            <div className="journey-eyebrow">04 / HISTORY &amp; RECORDS</div>
            <h2 className="platform-stage__title">KEEP THE<br /><span className="outline">MOMENT.</span></h2>
            <p className="platform-stage__lead">시즌 어워즈와 명예의 전당, 행사 사진까지. 데빌스의 성취와 장면을 연도별 아카이브로 남깁니다.</p>
            {featuredAwards.length > 0 ? <div className="platform-awards" aria-label="주요 수상">{featuredAwards.map((award) => <p key={award.id}><span>{AWARD_LABELS[award.award_type] ?? award.award_type}</span><b>{award.player_name}</b><em>{award.player_number != null ? `#${award.player_number}` : ""}</em></p>)}</div> : null}
            <Link href="/archive" className="view-all">OPEN THE ARCHIVE <span aria-hidden="true">→</span></Link>
          </div>
          <div className="stage-3d stage-3d--archive" aria-hidden="true"><span /><Image src="/logos/emblem.png" alt="" width={220} height={220} /></div>
        </Reveal></div>
      </section>

      <section id="stats" className="platform-stage platform-stage--stats">
        <div className="container"><Reveal>
          <div className="platform-stage__copy">
            <div className="journey-eyebrow">05 / DATA PLATFORM</div>
            <h2 className="platform-stage__title">SEE THE<br /><span className="outline">GAME DEEPER.</span></h2>
            <p className="platform-stage__lead">Devils Insight AI에서 선수별 타격·투구 기록과 팀 단위 분석을 이어서 확인하세요.</p>
            <a href={INSIGHT_AI_URL} target="_blank" rel="noopener noreferrer" className="hero__cta">OPEN DEVILS INSIGHT AI <span aria-hidden="true">↗</span></a>
          </div>
          <div className="platform-statements" aria-label="데이터 범위"><span>PLAYER<br /><b>STATS</b></span><span>GAME<br /><b>LOGS</b></span><span>TEAM<br /><b>INSIGHT</b></span></div>
          <div className="stage-3d stage-3d--stats" aria-hidden="true"><span /><span /><span /></div>
        </Reveal></div>
      </section>

      <section id="shop" className="platform-shop"><div className="container"><p>OFFICIAL GOODS</p><h2>DEVILS SHOP</h2><span>새 굿즈와 수요조사 소식은 한곳에서 확인하세요.</span><Link href="/shop" className="view-all">VIEW SHOP <span aria-hidden="true">→</span></Link></div></section>
    </>
  );
}
