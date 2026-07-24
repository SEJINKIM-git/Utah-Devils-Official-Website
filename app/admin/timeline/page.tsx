"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type TimelineEvent = {
  id: string;
  year: number;
  season: string | null;
  month: number | null;
  title: string;
  sort_order: number;
};

type Draft = {
  year: string;
  season: string;
  month: string;
  title: string;
  sort_order: string;
};

const EMPTY_DRAFT: Draft = {
  year: String(new Date().getFullYear()),
  season: "",
  month: "",
  title: "",
  sort_order: "1",
};

export default function AdminTimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("timeline_events")
      .select("id, year, season, month, title, sort_order")
      .order("year", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("month", { ascending: true });
    if (error) {
      setMsg({ kind: "err", text: `목록 조회 실패: ${error.message}` });
      return;
    }
    setEvents(data as TimelineEvent[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(e: TimelineEvent) {
    setEditingId(e.id);
    setDraft({
      year: String(e.year),
      season: e.season ?? "",
      month: e.month != null ? String(e.month) : "",
      title: e.title,
      sort_order: String(e.sort_order),
    });
    setMsg(null);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const row = {
      year: Number(draft.year),
      season: draft.season.trim() || null,
      month: draft.month ? Number(draft.month) : null,
      title: draft.title.trim(),
      sort_order: Number(draft.sort_order) || 1,
    };
    setBusy(true);
    const { error } = editingId
      ? await supabase.from("timeline_events").update(row).eq("id", editingId)
      : await supabase.from("timeline_events").insert(row);
    setBusy(false);
    if (error) {
      setMsg({
        kind: "err",
        text: `저장 실패: ${error.message} (RLS 정책 미실행이면 sql/04_admin_rls.sql 확인)`,
      });
      return;
    }
    setMsg({ kind: "ok", text: editingId ? "수정되었습니다." : "추가되었습니다." });
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 연혁을 삭제할까요? 되돌릴 수 없습니다.")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from("timeline_events").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: `삭제 실패: ${error.message}` });
      return;
    }
    setMsg({ kind: "ok", text: "삭제되었습니다." });
    if (editingId === id) resetForm();
    load();
  }

  return (
    <>
      <h1 className="wordmark" style={{ fontSize: 32 }}>
        연혁 <span className="outline">관리</span>
      </h1>

      <form
        className="form"
        style={{ marginTop: 24, maxWidth: 640 }}
        onSubmit={handleSubmit}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 110 }}>
            <label htmlFor="tl-year">연도</label>
            <input
              id="tl-year"
              type="number"
              required
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            />
          </div>
          <div style={{ width: 130 }}>
            <label htmlFor="tl-season">시즌</label>
            <select
              id="tl-season"
              value={draft.season}
              onChange={(e) => setDraft({ ...draft, season: e.target.value })}
            >
              <option value="">(없음)</option>
              <option value="SPRING">SPRING</option>
              <option value="FALL">FALL</option>
            </select>
          </div>
          <div style={{ width: 100 }}>
            <label htmlFor="tl-month">월</label>
            <input
              id="tl-month"
              type="number"
              min={1}
              max={12}
              value={draft.month}
              onChange={(e) => setDraft({ ...draft, month: e.target.value })}
            />
          </div>
          <div style={{ width: 110 }}>
            <label htmlFor="tl-sort">정렬 순서</label>
            <input
              id="tl-sort"
              type="number"
              value={draft.sort_order}
              onChange={(e) =>
                setDraft({ ...draft, sort_order: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label htmlFor="tl-title">제목</label>
          <input
            id="tl-title"
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        {msg ? (
          <div className={`form-msg form-msg--${msg.kind}`}>{msg.text}</div>
        ) : null}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {editingId ? "수정 저장" : "연혁 추가"}
          </button>
          {editingId ? (
            <button type="button" className="btn" onClick={resetForm}>
              취소
            </button>
          ) : null}
        </div>
      </form>

      <div style={{ marginTop: 40 }}>
        {events === null ? (
          <div className="notice">불러오는 중...</div>
        ) : events.length === 0 ? (
          <div className="notice">등록된 연혁이 없습니다.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e) => (
              <div
                key={e.id}
                className="card"
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--red)",
                    minWidth: 96,
                  }}
                >
                  {e.year}
                  {e.month ? `.${String(e.month).padStart(2, "0")}` : ""}
                  {e.season ? ` ${e.season}` : ""}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{e.title}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  #{e.sort_order}
                </span>
                <button type="button" className="tab" onClick={() => startEdit(e)}>
                  수정
                </button>
                <button
                  type="button"
                  className="tab"
                  style={{ color: "var(--red)", borderColor: "var(--red)" }}
                  onClick={() => handleDelete(e.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
