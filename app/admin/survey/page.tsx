"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Survey = {
  id: string;
  title: string;
  is_open: boolean;
  closes_at: string | null;
  size_options: string[] | null;
};

type Response = {
  id: string;
  name: string;
  student_id: string;
  size: string | null;
  quantity: number;
  contact: string | null;
  created_at: string;
};

export default function AdminSurveyPage() {
  const [surveys, setSurveys] = useState<Survey[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [responses, setResponses] = useState<Response[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      const { data, error } = await supabase
        .from("product_surveys")
        .select("id, title, is_open, closes_at, size_options")
        .order("created_at", { ascending: false });
      if (error) {
        setMsg(`수요조사 목록 조회 실패: ${error.message}`);
        return;
      }
      setSurveys(data as Survey[]);
      if (data?.length) setSelectedId(data[0].id);
    })();
  }, []);

  const loadResponses = useCallback(async (surveyId: string) => {
    setResponses(null);
    setMsg(null);
    if (!surveyId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("survey_responses")
      .select("id, name, student_id, size, quantity, contact, created_at")
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: true });
    if (error) {
      setMsg(
        `응답 조회 실패: ${error.message} (authenticated SELECT 정책 미실행이면 sql/04_admin_rls.sql 확인)`
      );
      return;
    }
    setResponses(data as Response[]);
  }, []);

  useEffect(() => {
    if (selectedId) loadResponses(selectedId);
  }, [selectedId, loadResponses]);

  const survey = (surveys ?? []).find((s) => s.id === selectedId) ?? null;

  // 사이즈 × (신청 건수, 수량 합계) 매트릭스
  const sizes = Array.from(
    new Set([
      ...(survey?.size_options ?? []),
      ...(responses ?? []).map((r) => r.size ?? "(미지정)"),
    ])
  );
  const matrix = sizes.map((size) => {
    const rows = (responses ?? []).filter(
      (r) => (r.size ?? "(미지정)") === size
    );
    return {
      size,
      count: rows.length,
      quantity: rows.reduce((sum, r) => sum + (r.quantity ?? 0), 0),
    };
  });
  const totalCount = matrix.reduce((s, m) => s + m.count, 0);
  const totalQuantity = matrix.reduce((s, m) => s + m.quantity, 0);

  function downloadCsv() {
    if (!survey || !responses) return;
    // 업체 견적용: 사이즈별 집계 + 합계
    const lines = [
      ["size", "responses", "total_quantity"],
      ...matrix.map((m) => [m.size, String(m.count), String(m.quantity)]),
      ["TOTAL", String(totalCount), String(totalQuantity)],
    ];
    const csv = lines
      .map((l) =>
        l.map((c) => (/[",\n]/.test(c) ? `"${c.replaceAll('"', '""')}"` : c)).join(",")
      )
      .join("\r\n");
    // Excel 한글 호환 BOM
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey.title.replaceAll(/[\\/:*?"<>|]/g, "_")}_집계.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <h1 className="wordmark" style={{ fontSize: 32 }}>
        수요조사 <span className="outline">집계</span>
      </h1>

      {surveys === null ? (
        <div className="notice" style={{ marginTop: 24 }}>
          불러오는 중...
        </div>
      ) : surveys.length === 0 ? (
        <div className="notice" style={{ marginTop: 24 }}>
          등록된 수요조사가 없습니다.
        </div>
      ) : (
        <>
          <div className="form" style={{ marginTop: 24, maxWidth: 480 }}>
            <div>
              <label htmlFor="sv-select">조사 선택</label>
              <select
                id="sv-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                    {s.is_open ? " (진행 중)" : " (마감)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {msg ? (
            <div className="form-msg form-msg--err" style={{ marginTop: 16, maxWidth: 640 }}>
              {msg}
            </div>
          ) : responses === null ? (
            <div className="notice" style={{ marginTop: 24 }}>
              응답 불러오는 중...
            </div>
          ) : (
            <>
              <div className="card" style={{ marginTop: 24, maxWidth: 560 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["사이즈", "신청 건수", "수량 합계"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            letterSpacing: "0.08em",
                            color: "var(--text-muted)",
                            padding: "8px 12px",
                            borderBottom: "1px solid var(--hairline)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((m) => (
                      <tr key={m.size}>
                        <td style={{ padding: "8px 12px", fontWeight: 700 }}>
                          {m.size}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {m.count}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {m.quantity}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderTop: "1px solid var(--hairline)",
                          color: "var(--red)",
                          fontWeight: 700,
                        }}
                      >
                        합계
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderTop: "1px solid var(--hairline)",
                          fontFamily: "var(--font-mono)",
                          color: "var(--red)",
                        }}
                      >
                        {totalCount}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderTop: "1px solid var(--hairline)",
                          fontFamily: "var(--font-mono)",
                          color: "var(--red)",
                        }}
                      >
                        {totalQuantity}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="btn btn--primary"
                style={{ marginTop: 20 }}
                onClick={downloadCsv}
                disabled={responses.length === 0}
              >
                CSV 다운로드 (업체 견적용)
              </button>
              {responses.length === 0 ? (
                <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}>
                  아직 응답이 없습니다.
                </p>
              ) : null}
            </>
          )}
        </>
      )}
    </>
  );
}
