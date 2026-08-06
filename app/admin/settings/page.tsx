"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AdminSettingsPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setStatus("error");
      setMessage("비밀번호는 8자 이상으로 설정해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      setMessage("서버 설정 오류입니다. 운영진에게 문의해 주세요.");
      return;
    }
    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setStatus("success");
    setMessage("비밀번호가 변경되었습니다.");
  }

  return (
    <section style={{ maxWidth: 520 }}>
      <h1 className="wordmark" style={{ fontSize: 36 }}>
        ACCOUNT <span className="outline">SETTINGS</span>
      </h1>
      <form className="form" style={{ marginTop: 28 }} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password">NEW PASSWORD</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <div>
          <label htmlFor="confirm-password">CONFIRM PASSWORD</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        </div>
        {message ? <p className={`form-msg${status === "error" ? " form-msg--err" : ""}`}>{message}</p> : null}
        <button type="submit" className="btn btn--primary" disabled={status === "saving"}>
          {status === "saving" ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </section>
  );
}
