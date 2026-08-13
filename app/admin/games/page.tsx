import Link from "next/link";
import { getSupabase, INSIGHT_AI_URL } from "@/lib/supabase";
import ScoreDisplay from "@/app/components/ScoreDisplay";
import TeamAvatar from "@/app/components/TeamAvatar";
import { getSiteSettings } from "@/lib/site-content";

type Game = { id: number; date: string; time: string | null; opponent: string; location: string | null; result: string | null; score_us: number | null; score_them: number | null };
const GENERIC_OPPONENTS = new Set(["사회인", "상대팀", "tba", "미정"]);

export default async function AdminGamesPage() {
  const settings = await getSiteSettings();
  const supabase = getSupabase();
  let games: Game[] = [];
  if (supabase) {
    const { data, error } = await supabase.from("games").select("id,date,time,opponent,location,result,score_us,score_them").gte("date", `${settings.current_season}-01-01`).lt("date", `${Number(settings.current_season) + 1}-01-01`).order("date", { ascending: false }).limit(10);
    if (error) console.error("[admin-games] 조회 실패:", error.message); else games = (data as Game[]) ?? [];
  }
  const today = new Date().toISOString().slice(0, 10);
  const warnings = (game: Game) => [
    !game.time && "시간 누락",
    GENERIC_OPPONENTS.has(game.opponent.trim().toLowerCase()) && "상대 팀 표기 확인",
    game.date < today && (game.score_us == null || game.score_them == null) && "과거 경기 스코어 누락",
  ].filter(Boolean) as string[];
  return <section style={{ maxWidth: 960 }}>
    <p className="eyebrow">READ ONLY</p><h1 className="wordmark" style={{ fontSize: 36 }}>GAME <span className="outline">STATUS</span></h1>
    <div className="notice" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <span>경기 입력·수정은 Devils Insight AI에서 처리합니다. 이 화면은 홈페이지 표시값 확인용입니다.</span>
      <Link className="btn btn--primary" href={INSIGHT_AI_URL} target="_blank">Devils Insight AI 열기 ↗</Link>
    </div>
    <h2 style={{ fontSize: 20, marginTop: 32 }}>{settings.current_season} 시즌 최근 10경기</h2>
    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
      {games.length === 0 ? <p className="notice">표시할 경기 기록이 없습니다.</p> : games.map((game) => <article className="card" style={{ padding: 16 }} key={game.id}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><strong>{game.date}</strong><TeamAvatar teamName={game.opponent} size="compact" /><span>{game.opponent}</span><b>{game.score_us != null && game.score_them != null ? <ScoreDisplay scoreUs={game.score_us} scoreThem={game.score_them} /> : "스코어 미입력"}</b><span style={{ color: "var(--text-muted)", fontSize: 13 }}>{game.time?.slice(0, 5) ?? "시간 미입력"} · {game.location ?? "장소 미입력"}</span></div>
        {warnings(game).length ? <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>확인 필요: {warnings(game).join(" · ")}</p> : null}
      </article>)}
    </div>
  </section>;
}
