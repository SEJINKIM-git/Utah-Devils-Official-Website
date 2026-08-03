"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AdminPendingPage() {
  const router = useRouter();
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleLogout() {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function requestApproval() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setRequestStatus("sending");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setRequestStatus("error");
      return;
    }
    const response = await fetch("/api/admin/request-approval", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setRequestStatus(response.ok ? "sent" : "error");
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
        아래 버튼을 누르면 승인 요청이 운영진 학교 메일로 전달됩니다. 승인 후 다시 로그인하면
        관리자 메뉴가 열립니다.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <button type="button" className="btn btn--primary" onClick={requestApproval} disabled={requestStatus === "sending" || requestStatus === "sent"}>
          {requestStatus === "sending" ? "승인 요청 전송 중..." : requestStatus === "sent" ? "승인 요청 전송 완료" : "운영진 승인 요청 보내기"}
        </button>
        <Link href="/" className="btn btn--primary">홈으로</Link>
        <button type="button" className="btn" onClick={handleLogout}>로그아웃</button>
      </div>
      {requestStatus === "sent" ? <p className="form-msg">운영진 메일로 승인 요청을 보냈습니다.</p> : null}
      {requestStatus === "error" ? <p className="form-msg form-msg--err">요청 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
    </div>
  );
}
