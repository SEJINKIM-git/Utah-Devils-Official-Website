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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cooldown) {
      setError("로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
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
      const nextAttempts = failedAttempts + 1;
      if (nextAttempts >= 5) {
        setCooldown(true);
        setFailedAttempts(0);
        setError("로그인 시도가 많습니다. 30초 후 다시 시도해 주세요.");
        window.setTimeout(() => {
          setCooldown(false);
          setError(null);
        }, 30_000);
      } else {
        setFailedAttempts(nextAttempts);
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
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
      <form className="form" style={{ marginTop: 28 }} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="admin-email">SCHOOL EMAIL</label>
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
        <button type="submit" className="btn btn--primary" disabled={submitting || cooldown}>
          {submitting ? "로그인 중..." : cooldown ? "잠시 후 다시 시도" : "로그인"}
        </button>
      </form>
    </div>
  );
}
