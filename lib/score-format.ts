/**
 * 경기 점수의 유일한 표기 규칙.
 *
 * 점수는 시간이 아니므로 한 자리 수를 0으로 채우지 않는다. 표시 컴포넌트는
 * `us`와 `them`을 별도 칸에 넣어 콜론 위치를 고정할 수 있도록 함께 반환한다.
 */
export function formatScore(scoreUs: number | null, scoreThem: number | null) {
  const us = scoreUs == null ? "–" : String(scoreUs);
  const them = scoreThem == null ? "–" : String(scoreThem);

  return { us, them, text: `${us}:${them}` };
}

/** GAME 번호는 초안 식별자이므로 두 자리 표기를 유지한다. */
export function formatGameNumber(gameNumber: number) {
  return String(gameNumber).padStart(2, "0");
}
