"use client";

import { useState, useTransition } from "react";
import { saveSiteSettings } from "@/app/actions/edit-mode";
import type { SiteSettingKey } from "@/lib/site-content";

type Props = { settings: Record<SiteSettingKey, string> };

const FIELDS: { key: SiteSettingKey; label: string; description: string; type?: "number" | "url" | "textarea" }[] = [
  { key: "current_season", label: "현재 시즌", description: "메인·선수·일정의 기본 시즌입니다." },
  { key: "season_target_games", label: "시즌 목표 경기 수", description: "일정 화면의 TBA 슬롯 계산 기준입니다.", type: "number" },
  { key: "instagram_url", label: "Instagram 링크", description: "푸터와 아카이브 링크입니다.", type: "url" },
  { key: "youtube_url", label: "YouTube 링크", description: "푸터와 아카이브 링크입니다.", type: "url" },
  { key: "notice_banner", label: "공지 배너", description: "비워 두면 표시하지 않습니다.", type: "textarea" },
];

export default function SiteSettingsForm({ settings }: Props) {
  const [values, setValues] = useState(settings);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <form className="form" style={{ marginTop: 36, maxWidth: 620 }} onSubmit={(event) => {
    event.preventDefault(); setMessage("");
    startTransition(async () => { const result = await saveSiteSettings(values); setMessage(result.message); });
  }}>
    <h2 style={{ fontSize: 20 }}>사이트 운영 설정</h2>
    <p style={{ color: "var(--text-muted)", marginTop: -6 }}>저장하면 관련 공개 화면에 즉시 반영됩니다.</p>
    {FIELDS.map((field) => <div key={field.key}>
      <label htmlFor={field.key}>{field.label}</label>
      {field.type === "textarea" ? <textarea id={field.key} maxLength={200} rows={3} value={values[field.key]} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} /> :
        <input id={field.key} type={field.type ?? "text"} required={field.key !== "notice_banner"} maxLength={200} value={values[field.key]} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />}
      <small style={{ color: "var(--text-muted)" }}>{field.description}</small>
    </div>)}
    {message ? <p className="form-msg">{message}</p> : null}
    <button type="submit" className="btn btn--primary" disabled={pending}>{pending ? "저장 중..." : "사이트 설정 저장"}</button>
  </form>;
}
