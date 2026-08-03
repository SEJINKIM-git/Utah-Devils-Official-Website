"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AdminPendingPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 520, margin: "80px auto" }}>
      <h1 className="wordmark" style={{ fontSize: 36 }}>
        MEMBER <span className="outline">PENDING</span>
      </h1>
      <div className="notice" style={{ marginTop: 24, textAlign: "left" }}>
        <strong>회원 등록이 완료되었습니다.</strong>
        <p style={{ margin: "12px 0 0", color: "var(--text-muted)", lineHeight: 1.7 }}>
          현재 계정은 로그인만 가능한 상태입니다. 콘텐츠·사진·운영 설정을 수정하려면
          운영진의 승인 절차가 필요합니다.
        </p>
      </div>
      <p style={{ marginTop: 20, color: "var(--text-muted)", fontSize: 14 }}>
        승인 후 다시 로그인하면 관리자 메뉴가 열립니다. 문제가 있으면 운영진에게
        UNID와 등록 이메일을 전달해 주세요.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link href="/" className="btn btn--primary">홈으로</Link>
        <button type="button" className="btn" onClick={handleLogout}>로그아웃</button>
      </div>
    </div>
  );
}
