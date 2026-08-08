"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Member = {
  user_id: string;
  unid: string;
  display_name: string;
  created_at: string;
  email: string;
  lastSignInAt: string | null;
};

type MembersResponse = { currentUserId: string; members: Member[] };

function formatDate(value: string | null) {
  if (!value) return "로그인 기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? "요청을 처리하지 못했습니다.");
  return data;
}

export default function AdminMembersPage() {
  const [data, setData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [deletingTarget, setDeletingTarget] = useState<Member | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await requestJson("/api/admin/members")) as MembersResponse;
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "운영진 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    setError("");
    try {
      await requestJson("/api/admin/members", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setEmail("");
      setPassword("");
      setMessage("운영진 계정이 생성되었습니다. 임시 비밀번호를 당사자에게 개별 전달하고 첫 로그인 뒤 비밀번호 변경을 안내해 주세요.");
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정을 생성하지 못했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function resetMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetTarget) return;
    setBusyId(resetTarget.user_id);
    setMessage("");
    setError("");
    try {
      await requestJson(`/api/admin/members/${resetTarget.user_id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: resetPassword }),
      });
      setResetTarget(null);
      setResetPassword("");
      setMessage(`${resetTarget.email} 계정의 임시 비밀번호가 변경되었습니다. 새 비밀번호를 개별 전달해 주세요.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호를 재설정하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deletingTarget) return;
    setBusyId(deletingTarget.user_id);
    setMessage("");
    setError("");
    try {
      await requestJson(`/api/admin/members/${deletingTarget.user_id}`, {
        method: "DELETE",
        body: JSON.stringify({ email: confirmEmail }),
      });
      setDeletingTarget(null);
      setConfirmEmail("");
      setMessage("운영진 계정을 회수했습니다.");
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정을 삭제하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const memberCount = data?.members.length ?? 0;

  return (
    <section style={{ maxWidth: 960 }}>
      <p className="eyebrow">ACCESS CONTROL</p>
      <h1 className="wordmark" style={{ fontSize: 36 }}>
        ADMIN <span className="outline">MEMBERS</span>
      </h1>
      <p style={{ color: "var(--text-muted)", marginTop: 12, lineHeight: 1.6 }}>
        운영진 계정 생성·비밀번호 재설정·회수를 이 화면에서 관리합니다. 이메일 발송은 사용하지 않습니다.
      </p>

      <form className="form" style={{ marginTop: 32, maxWidth: 560 }} onSubmit={createMember}>
        <h2 style={{ fontSize: 20 }}>새 운영진 추가</h2>
        <div>
          <label htmlFor="member-email">EMAIL</label>
          <input id="member-email" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div>
          <label htmlFor="member-password">TEMPORARY PASSWORD</label>
          <input id="member-password" type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <button type="submit" className="btn btn--primary" disabled={creating}>
          {creating ? "계정 생성 중..." : "운영진 계정 생성"}
        </button>
      </form>

      {message ? <p className="form-msg" style={{ marginTop: 18 }}>{message}</p> : null}
      {error ? <p className="form-msg form-msg--err" style={{ marginTop: 18 }}>{error}</p> : null}

      <div style={{ marginTop: 44 }}>
        <h2 className="wordmark" style={{ fontSize: 24 }}>CURRENT MEMBERS</h2>
        {loading ? <p style={{ color: "var(--text-muted)", marginTop: 18 }}>운영진 목록을 불러오는 중...</p> : null}
        {!loading && data?.members.length === 0 ? <p className="notice" style={{ marginTop: 18 }}>등록된 운영진이 없습니다.</p> : null}
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {data?.members.map((member) => {
            const isSelf = member.user_id === data.currentUserId;
            const cannotDelete = isSelf || memberCount <= 1;
            const deleteReason = isSelf
              ? "본인 계정은 삭제할 수 없습니다."
              : memberCount <= 1
                ? "마지막 운영진 계정은 삭제할 수 없습니다."
                : "계정 삭제";
            return (
              <article key={member.user_id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                  <div>
                    <strong>{member.email}</strong>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>UNID: {member.unid} · 생성: {formatDate(member.created_at)} · 마지막 로그인: {formatDate(member.lastSignInAt)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn--ghost" onClick={() => { setResetTarget(member); setResetPassword(""); }} disabled={busyId === member.user_id}>비밀번호 재설정</button>
                    <button type="button" className="btn btn--ghost" onClick={() => { setDeletingTarget(member); setConfirmEmail(""); }} disabled={cannotDelete || busyId === member.user_id} title={deleteReason}>계정 삭제</button>
                  </div>
                </div>
                {cannotDelete ? <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 12 }}>{deleteReason}</p> : null}
              </article>
            );
          })}
        </div>
      </div>

      {resetTarget ? (
        <div className="notice" style={{ marginTop: 24, maxWidth: 560 }}>
          <form className="form" onSubmit={resetMember}>
            <h2 style={{ fontSize: 20 }}>비밀번호 재설정</h2>
            <p style={{ color: "var(--text-muted)" }}>{resetTarget.email}</p>
            <div>
              <label htmlFor="reset-password">NEW TEMPORARY PASSWORD</label>
              <input id="reset-password" type="password" minLength={8} autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} required />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn--primary" disabled={busyId === resetTarget.user_id}>변경</button>
              <button type="button" className="btn btn--ghost" onClick={() => setResetTarget(null)}>취소</button>
            </div>
          </form>
        </div>
      ) : null}

      {deletingTarget ? (
        <div className="notice" style={{ marginTop: 24, maxWidth: 560 }}>
          <form className="form" onSubmit={deleteMember}>
            <h2 style={{ fontSize: 20 }}>운영진 계정 삭제</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              삭제 대상: <strong>{deletingTarget.email}</strong><br />
              계속하려면 위 이메일 주소를 정확히 다시 입력해 주세요.
            </p>
            <div>
              <label htmlFor="delete-email">CONFIRM EMAIL</label>
              <input id="delete-email" type="email" autoComplete="off" value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} required />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn--primary" disabled={busyId === deletingTarget.user_id}>계정 삭제</button>
              <button type="button" className="btn btn--ghost" onClick={() => setDeletingTarget(null)}>취소</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
