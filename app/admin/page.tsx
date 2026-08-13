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
    desc: "/archive 행사 기록을 추가·수정·삭제하고 사진을 업로드합니다.",
  },
  {
    href: "/admin/games",
    title: "경기 데이터 상태",
    desc: "홈페이지가 읽는 경기 기록을 확인합니다. 경기 입력은 분석 플랫폼에서 합니다.",
  },
  {
    href: "/admin/survey",
    title: "수요조사 집계",
    desc: "굿즈 수요조사 응답을 사이즈×수량으로 집계하고 CSV로 내려받습니다.",
  },
  {
    href: "/admin/members",
    title: "운영진 계정 관리",
    desc: "운영진 계정을 만들고, 비밀번호를 재설정하거나 회수합니다.",
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
        저장한 내용은 즉시 공개 화면에 반영됩니다. 경기 기록은 이 화면에서 수정하지 않으며,
        분석 플랫폼에서 입력한 값을 홈페이지가 읽어 표시합니다.
      </div>
      <form action={startEditMode} style={{ marginTop: 20 }}>
        <button type="submit" className="btn btn--primary">
          사이트 편집 모드 열기 →
        </button>
      </form>
    </>
  );
}
