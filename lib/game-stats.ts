export type ScoredGame = {
  date: string;
  result: string | null;
  score_us: number | null;
  score_them: number | null;
};

export type GameRecord = { w: number; l: number; d: number; games: number };

export function isCancelledGame(game: Pick<ScoredGame, "result">): boolean {
  const result = game.result?.toLowerCase() ?? "";
  return result.includes("취소") || result === "cancelled" || result === "canceled";
}

export function isCompletedGame(game: ScoredGame): boolean {
  return !isCancelledGame(game) && game.score_us != null && game.score_them != null;
}

export function getGameRecord(games: ScoredGame[]): GameRecord {
  return games.filter(isCompletedGame).reduce<GameRecord>((record, game) => {
    const result = game.score_us! > game.score_them! ? "W" : game.score_us! < game.score_them! ? "L" : "D";
    if (result === "W") record.w += 1;
    if (result === "L") record.l += 1;
    if (result === "D") record.d += 1;
    record.games += 1;
    return record;
  }, { w: 0, l: 0, d: 0, games: 0 });
}
