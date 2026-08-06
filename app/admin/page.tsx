import Link from "next/link";
import { startEditMode } from "@/app/actions/edit-mode";

const MENUS = [
  {
    href: "/admin/timeline",
    title: "연혁 관리",
    desc: "/devils 타임라인의 연혁을 추가·수정·삭제합니다.",
  },
  {
    href: "/admin/events",
    title: "행사 관리",
    desc: "/archive 행사 기록을 추가·수정합니다. 사진은 URL 배열로 입력합니다.",
  },
  {
    href: "/admin/survey",
    title: "수요조사 집계",
    desc: "굿즈 수요조사 응답을 사이즈×수량으로 집계하고 CSV로 내려받습니다.",
  },
];

export default function AdminHomePage() {
  return (
    <>
      <h1 className="wordmark" style={{ fontSize: 40 }}>
        DEVILS <span className="outline">ADMIN</span>
      </h1>
      <div className="grid grid--3" style={{ marginTop: 28 }}>
        {MENUS.map((m) => (
          <Link key={m.href} href={m.href} className="card">
            <div style={{ fontSize: 18, fontWeight: 700 }}>{m.title}</div>
            <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 13 }}>
              {m.desc}
            </p>
          </Link>
        ))}
      </div>
      <div className="notice" style={{ marginTop: 28, textAlign: "left" }}>
        쓰기는 승인된 운영진 계정만 통과하는 RLS 정책을 거칩니다. 정책이 아직
        없다면 sql/08_member_registration_roles.sql을 Supabase SQL Editor에서 1회 실행하세요.
        기존 테이블(games, players, batting_stats, pitching_stats)은 이
        콘솔에서 다루지 않습니다.
      </div>
      <form action={startEditMode} style={{ marginTop: 20 }}>
        <button type="submit" className="btn btn--primary">
          사이트 편집 모드 열기 →
        </button>
      </form>
    </>
  );
}
