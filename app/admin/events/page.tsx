"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const CATEGORIES = [
  { key: "baseball_night", label: "Utah Baseball Night" },
  { key: "booth", label: "부스" },
  { key: "competition", label: "대회" },
  { key: "exchange", label: "교류전" },
  { key: "club", label: "동아리" },
  { key: "media", label: "미디어" },
];

type ArchiveEvent = {
  id: string;
  title: string;
  category: string;
  event_date: string | null;
  description: string | null;
  photo_urls: string[] | null;
  external_link: string | null;
  is_featured: boolean;
};

type Draft = {
  title: string;
  category: string;
  event_date: string;
  description: string;
  photo_urls: string;
  external_link: string;
  is_featured: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  category: "booth",
  event_date: "",
  description: "",
  photo_urls: "",
  external_link: "",
  is_featured: false,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ArchiveEvent[] | null>(null);
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
      .from("archive_events")
      .select(
        "id, title, category, event_date, description, photo_urls, external_link, is_featured"
      )
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("title", { ascending: true });
    if (error) {
      setMsg({ kind: "err", text: `목록 조회 실패: ${error.message}` });
      return;
    }
    setEvents(data as ArchiveEvent[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(e: ArchiveEvent) {
    setEditingId(e.id);
    setDraft({
      title: e.title,
      category: e.category,
      event_date: e.event_date ?? "",
      description: e.description ?? "",
      photo_urls: (e.photo_urls ?? []).join("\n"),
      external_link: e.external_link ?? "",
      is_featured: e.is_featured,
    });
    setMsg(null);
    window.scrollTo({ top: 0 });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    // 사진은 한 줄에 URL 하나 — http(s)만 허용
    const urls = draft.photo_urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    const invalid = urls.find((u) => !/^https?:\/\//.test(u));
    if (invalid) {
      setMsg({ kind: "err", text: `URL 형식이 아닙니다: ${invalid}` });
      return;
    }
    const row = {
      title: draft.title.trim(),
      category: draft.category,
      event_date: draft.event_date || null,
      description: draft.description.trim() || null,
      photo_urls: urls.length > 0 ? urls : null,
      external_link: draft.external_link.trim() || null,
      is_featured: draft.is_featured,
    };
    setBusy(true);
    const { error } = editingId
      ? await supabase.from("archive_events").update(row).eq("id", editingId)
      : await supabase.from("archive_events").insert(row);
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

  return (
    <>
      <h1 className="wordmark" style={{ fontSize: 32 }}>
        행사 <span className="outline">관리</span>
      </h1>
      <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 13 }}>
        사진 업로드 UI는 다음 단계입니다 — Storage 업로드 후 URL을 아래에
        붙여넣으세요 (docs/photo_upload_guide.md 참조).
      </p>

      <form
        className="form"
        style={{ marginTop: 24, maxWidth: 640 }}
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="ev-title">행사명</label>
          <input
            id="ev-title"
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 160 }}>
            <label htmlFor="ev-category">카테고리</label>
            <select
              id="ev-category"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: 170 }}>
            <label htmlFor="ev-date">날짜</label>
            <input
              id="ev-date"
              type="date"
              value={draft.event_date}
              onChange={(e) =>
                setDraft({ ...draft, event_date: e.target.value })
              }
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 10 }}>
            <label
              htmlFor="ev-featured"
              style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}
            >
              <input
                id="ev-featured"
                type="checkbox"
                style={{ width: "auto" }}
                checked={draft.is_featured}
                onChange={(e) =>
                  setDraft({ ...draft, is_featured: e.target.checked })
                }
              />
              FEATURED
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="ev-desc">설명</label>
          <textarea
            id="ev-desc"
            rows={2}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </div>
        <div>
          <label htmlFor="ev-photos">사진 URL (한 줄에 하나)</label>
          <textarea
            id="ev-photos"
            rows={3}
            placeholder="https://..."
            value={draft.photo_urls}
            onChange={(e) => setDraft({ ...draft, photo_urls: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="ev-link">외부 링크</label>
          <input
            id="ev-link"
            type="url"
            placeholder="https://..."
            value={draft.external_link}
            onChange={(e) =>
              setDraft({ ...draft, external_link: e.target.value })
            }
          />
        </div>
        {msg ? (
          <div className={`form-msg form-msg--${msg.kind}`}>{msg.text}</div>
        ) : null}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {editingId ? "수정 저장" : "행사 추가"}
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
          <div className="notice">등록된 행사가 없습니다.</div>
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
                  className="pill pill--muted"
                  style={{ minWidth: 84, textAlign: "center" }}
                >
                  {CATEGORIES.find((c) => c.key === e.category)?.label ??
                    e.category}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{e.title}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {e.event_date ?? "날짜 미정"} · 사진{" "}
                  {e.photo_urls?.length ?? 0}장
                </span>
                {e.is_featured ? <span className="pill">FEATURED</span> : null}
                <button type="button" className="tab" onClick={() => startEdit(e)}>
                  수정
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
