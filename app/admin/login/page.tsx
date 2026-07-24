"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("서버 설정 오류입니다. 운영진에게 문의해 주세요.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1 className="wordmark" style={{ fontSize: 36 }}>
        ADMIN <span className="outline">LOGIN</span>
      </h1>
      <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
        운영진 전용 페이지입니다. 계정은 운영진에게 문의하세요.
      </p>
      <form className="form" style={{ marginTop: 28 }} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="admin-email">EMAIL</label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="admin-password">PASSWORD</label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <div className="form-msg form-msg--err">{error}</div> : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
