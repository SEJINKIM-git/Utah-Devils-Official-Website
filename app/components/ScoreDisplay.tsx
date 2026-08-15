import { formatScore } from "@/lib/score-format";

type ScoreDisplayProps = {
  scoreUs: number | null;
  scoreThem: number | null;
  className?: string;
};

/** 고정된 숫자 칸으로 어느 경기 행에서나 콜론을 같은 위치에 표시한다. */
export default function ScoreDisplay({ scoreUs, scoreThem, className }: ScoreDisplayProps) {
  const score = formatScore(scoreUs, scoreThem);

  return (
    <span className={className ? `score-display ${className}` : "score-display"} aria-label={score.text}>
      <span className="score-display__value score-display__value--us">{score.us}</span>
      <span className="score-display__separator" aria-hidden="true">:</span>
      <span className="score-display__value score-display__value--them">{score.them}</span>
    </span>
  );
}
