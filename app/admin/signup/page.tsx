"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

function initialPassword(birthDate: string, jerseyNumber: string) {
  const date = birthDate.replace(/-/g, "");
  const number = Number(jerseyNumber);
  if (date.length !== 8 || !Number.isInteger(number) || number < 0 || number > 99) {
    return "생년월일과 등번호를 입력하세요";
  }
  return `${date}${String(number).padStart(2, "0")}`;
}

export default function AdminSignupPage() {
  const router = useRouter();
  const [englishName, setEnglishName] = useState("");
  const [unid, setUnid] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const password = useMemo(
    () => initialPassword(birthDate, jerseyNumber),
    [birthDate, jerseyNumber]
  );
  const hasPassword = /^\d{8}\d{2}$/.test(password);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!hasPassword) {
      setError("생년월일과 0~99 사이의 등번호를 입력해 주세요.");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("서버 설정 오류입니다. 운영진에게 문의해 주세요.");
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: englishName.trim(),
          unid: unid.trim(),
          jersey_number: Number(jerseyNumber),
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError("회원 등록에 실패했습니다. 입력 정보와 중복 이메일을 확인해 주세요.");
      return;
    }
    if (data.session) {
      router.push("/admin");
      router.refresh();
      return;
    }
    setMessage(
      "회원 등록이 완료되었습니다. 이메일 인증이 켜져 있다면 받은 메일의 인증을 완료한 뒤 로그인해 주세요."
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "80px auto" }}>
      <h1 className="wordmark" style={{ fontSize: 36 }}>
        ADMIN <span className="outline">SIGN UP</span>
      </h1>
      <div className="notice" style={{ marginTop: 20, textAlign: "left" }}>
        <strong>회원 등록 기준</strong>
        <ol style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.7 }}>
          <li>회원 이름은 각자의 <strong>영문 이름</strong>으로 입력합니다.</li>
          <li>ID는 각자의 <strong>UNID</strong>로 기록합니다.</li>
          <li>
            초기 비밀번호는 <strong>생년월일(YYYYMMDD) + 두 자리 등번호</strong>입니다.
          </li>
        </ol>
        <p style={{ margin: "10px 0 0", color: "var(--text-muted)", fontSize: 13 }}>
          로그인에는 본인의 학교 이메일 전체를 사용합니다. 예: 2002-03-15, 35번 → 2002031535
        </p>
      </div>
      <form className="form" style={{ marginTop: 28 }} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="admin-signup-name">ENGLISH NAME</label>
          <input id="admin-signup-name" required autoComplete="name" value={englishName} onChange={(event) => setEnglishName(event.target.value)} />
        </div>
        <div>
          <label htmlFor="admin-signup-unid">UNID (ID)</label>
          <input id="admin-signup-unid" required autoComplete="username" value={unid} onChange={(event) => setUnid(event.target.value)} />
        </div>
        <div>
          <label htmlFor="admin-signup-email">SCHOOL EMAIL</label>
          <input id="admin-signup-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="grid grid--2" style={{ gap: 12 }}>
          <div>
            <label htmlFor="admin-signup-birth">BIRTH DATE</label>
            <input id="admin-signup-birth" type="date" required value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </div>
          <div>
            <label htmlFor="admin-signup-number">JERSEY NO.</label>
            <input id="admin-signup-number" type="number" min="0" max="99" required value={jerseyNumber} onChange={(event) => setJerseyNumber(event.target.value)} />
          </div>
        </div>
        <div className="notice" style={{ textAlign: "left", padding: "12px 14px" }}>
          INITIAL PASSWORD: <strong>{password}</strong>
        </div>
        {error ? <div className="form-msg form-msg--err">{error}</div> : null}
        {message ? <div className="form-msg">{message}</div> : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "회원 등록 중..." : "회원으로 등록하기"}
        </button>
      </form>
      <p style={{ marginTop: 20, color: "var(--text-muted)", fontSize: 14 }}>
        이미 등록했나요?{" "}
        <Link href="/admin/login" style={{ color: "var(--red)" }}>
          로그인 →
        </Link>
      </p>
    </div>
  );
}
