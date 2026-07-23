"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Props = {
  surveyId: string;
  sizeOptions: string[];
  closesAt: string | null;
};

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function SurveyForm({ surveyId, sizeOptions, closesAt }: Props) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [size, setSize] = useState(sizeOptions[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const closed = closesAt != null && new Date(closesAt) < new Date();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (closed) {
      setMsg({ kind: "err", text: "수요조사가 마감되었습니다." });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setMsg({
        kind: "err",
        text: "서버 설정 오류로 신청할 수 없습니다. 운영진에게 문의해 주세요.",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("survey_responses").insert({
      survey_id: surveyId,
      name: name.trim(),
      student_id: studentId.trim(),
      size: size || null,
      quantity,
      contact: contact.trim() || null,
    });
    setSubmitting(false);

    if (!error) {
      setMsg({
        kind: "ok",
        text: "신청이 완료되었습니다. 참여해 주셔서 감사합니다!",
      });
      setName("");
      setStudentId("");
      setQuantity(1);
      setContact("");
      return;
    }
    if (error.code === "23505") {
      setMsg({
        kind: "err",
        text: "이미 같은 학번·사이즈로 신청 내역이 있습니다. 수정이 필요하면 운영진에게 문의해 주세요.",
      });
    } else if (error.code === "42501" || error.code === "PGRST301") {
      setMsg({
        kind: "err",
        text: "수요조사가 마감되어 신청할 수 없습니다.",
      });
    } else {
      setMsg({
        kind: "err",
        text: "신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  if (closed) {
    return <div className="notice">이 수요조사는 마감되었습니다.</div>;
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor={`name-${surveyId}`}>이름</label>
        <input
          id={`name-${surveyId}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={30}
          placeholder="홍길동"
        />
      </div>
      <div>
        <label htmlFor={`sid-${surveyId}`}>학번</label>
        <input
          id={`sid-${surveyId}`}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          maxLength={20}
          placeholder="u1234567"
        />
      </div>
      {sizeOptions.length > 0 ? (
        <div>
          <label htmlFor={`size-${surveyId}`}>사이즈</label>
          <select
            id={`size-${surveyId}`}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {sizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor={`qty-${surveyId}`}>수량</label>
        <input
          id={`qty-${surveyId}`}
          type="number"
          min={1}
          max={10}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          required
        />
      </div>
      <div>
        <label htmlFor={`contact-${surveyId}`}>연락처 (선택)</label>
        <input
          id={`contact-${surveyId}`}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={40}
          placeholder="카카오톡 ID 또는 전화번호"
        />
      </div>
      {msg ? (
        <div className={`form-msg form-msg--${msg.kind}`} role="status">
          {msg.text}
        </div>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "제출 중..." : "신청하기"}
      </button>
    </form>
  );
}
