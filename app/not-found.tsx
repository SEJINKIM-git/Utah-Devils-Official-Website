import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: "center", padding: "120px 24px 80px" }}>
      <div className="hero__meta">FOUL BALL</div>
      <h1
        className="wordmark"
        style={{ fontSize: "clamp(80px, 18vw, 180px)", marginTop: 12 }}
      >
        4<span className="outline-red">0</span>4
      </h1>
      <p style={{ color: "var(--text-muted)", marginTop: 16 }}>
        찾으시는 페이지가 파울 라인 밖으로 나갔습니다.
      </p>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href="/" className="btn btn--primary">
          HOME
        </Link>
        <Link href="/schedule" className="btn">
          SCHEDULE
        </Link>
      </div>
    </div>
  );
}
