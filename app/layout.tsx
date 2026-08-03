import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import EditModeProvider from "./components/EditModeProvider";
import Editable from "./components/Editable";
import EditModeToolbar from "./components/EditModeToolbar";
import { getSiteSettings } from "@/lib/site-content";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL("https://utah-devils-official-website.vercel.app"),
  title: {
    default: "Utah Devils Baseball Club",
    template: "%s | Utah Devils",
  },
  description:
    "유타대학교 아시아캠퍼스 야구동아리 Utah Devils 공식 홈페이지 — 선수단, 경기 일정, 아카이브, 굿즈",
  openGraph: {
    title: "Utah Devils Baseball Club",
    description:
      "유타대학교 아시아캠퍼스 야구동아리 Utah Devils 공식 홈페이지 — 선수단, 경기 일정, 아카이브, 굿즈",
    url: "/",
    siteName: "Utah Devils Baseball Club",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, user] = await Promise.all([getSiteSettings(), getAuthenticatedUser()]);
  const editMode = Boolean(user && cookies().get("edit_mode")?.value === "1");
  return (
    <html lang="ko">
      <head>
        {/* next/font 사용 금지 — 빌드 환경 폰트 fetch 이슈로 link 방식 유지 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <EditModeProvider enabled={editMode}>
          <SiteHeader />
          {settings.notice_banner || editMode ? <div className="site-notice site-notice--editable" role="status"><Editable table="site_settings" contentKey="notice_banner" value={settings.notice_banner} maxLength={200}>{settings.notice_banner || "공지 배너: 클릭하여 안내 문구를 입력하세요."}</Editable></div> : null}
          <main>{children}</main>
          <SiteFooter />
          {editMode ? <EditModeToolbar /> : null}
        </EditModeProvider>
      </body>
    </html>
  );
}
