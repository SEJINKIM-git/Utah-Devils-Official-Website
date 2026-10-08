import { getSupabase } from "@/lib/supabase";

export const DEFAULT_SETTINGS = {
  current_season: "2026",
  season_target_games: "6",
  instagram_url: "https://www.instagram.com/uac.baseball",
  youtube_url: "https://youtube.com/@utahdevils",
  notice_banner: "",
} as const;

export const DEFAULT_CONTENT = {
  hero_title_sub: "UTAH ASIA CAMPUS · BASEBALL CLUB",
  hero_tagline: "유타대학교 아시아캠퍼스 야구동아리 Utah Devils",
  about_p1: "2022년 2월 창단한 유타대학교의 야구동아리 Utah Devils는 야구를 좋아하는 학생들이 모여, 단순히 경기를 하는 것을 넘어 야구가 지닌 가치와 매력을 함께 만들어 가는 동아리입니다.",
  about_p2: "정기 리그와 교류전, 캠퍼스 행사, Utah Baseball Night를 꾸준히 운영하며 유타대학교 아시아캠퍼스를 대표하는 야구 커뮤니티로 성장하고 있습니다.",
  about_p3: "부원들은 경기뿐 아니라 스포츠 산업, 홍보·마케팅, 미디어 콘텐츠 제작 활동에도 참여합니다.",
  about_p4: "야구와 자신의 진로를 연결하며 실전 경험과 대학 생활의 추억을 함께 쌓아 갑니다.",
  fact_founded: "2022",
  fact_affiliation: "UAC",
  fact_home: "INCHEON",
  fact_members: "100+",
  section_desc_players: "Utah Devils 선수단과 시즌별 프로필을 확인하세요.",
  section_desc_schedule: "시즌별 경기 일정과 결과를 확인하세요. 진행 중인 시즌의 미정 경기는 TBA로 표시됩니다.",
  section_desc_archive: "연혁, 시즌 어워즈, 명예의 전당, 그리고 Utah Devils가 함께한 행사의 기록입니다.",
  section_desc_shop: "Utah Devils 굿즈 수요조사와 지금까지 만든 굿즈를 확인하세요.",
  footer_about: "유타대학교 아시아캠퍼스 야구동아리",
  recruit_message: "새로운 데빌스를 기다립니다.",
  home_devils_title_1: "ONE TEAM.",
  home_devils_title_2: "ONE DEVILS.",
  home_roster_title_1: "PLAYERS,",
  home_roster_title_2: "IN FOCUS.",
  home_schedule_title_1: "EVERY GAME.",
  home_schedule_title_2: "ON RECORD.",
  home_archive_title_1: "KEEP THE",
  home_archive_title_2: "MOMENT.",
  home_stats_title_1: "SEE THE",
  home_stats_title_2: "GAME DEEPER.",
} as const;

export type SiteContentKey = keyof typeof DEFAULT_CONTENT;
export type SiteSettingKey = keyof typeof DEFAULT_SETTINGS;

/**
 * 서버가 저장 시 강제하는 글자 수 상한과, 행이 없을 때 새로 만들 라벨.
 * site_content.max_length 시드 값과 같게 유지한다 — 넘치면 레이아웃이 깨진다.
 */
/** 메인 섹션 제목은 대형 Anton 한 줄이라 길면 줄바꿈 없이 넘친다. */
export const HOME_TITLE_MAX = 14;
/** 팩트 값은 대형 숫자 타이포(nowrap)로 표시된다. */
export const FACT_MAX = 16;

export const CONTENT_META: Record<SiteContentKey, { label: string; max: number }> = {
  hero_title_sub: { label: "메인 히어로 부제", max: 80 },
  hero_tagline: { label: "메인 히어로 소개", max: 160 },
  about_p1: { label: "데빌스 소개 1", max: 400 },
  about_p2: { label: "데빌스 소개 2", max: 400 },
  about_p3: { label: "데빌스 소개 3", max: 400 },
  about_p4: { label: "데빌스 소개 4", max: 400 },
  fact_founded: { label: "창단 연도", max: FACT_MAX },
  fact_affiliation: { label: "소속", max: FACT_MAX },
  fact_home: { label: "활동 지역", max: FACT_MAX },
  fact_members: { label: "누적 회원", max: FACT_MAX },
  section_desc_players: { label: "선수 페이지 설명", max: 200 },
  section_desc_schedule: { label: "일정 페이지 설명", max: 200 },
  section_desc_archive: { label: "아카이브 설명", max: 200 },
  section_desc_shop: { label: "굿즈 페이지 설명", max: 200 },
  footer_about: { label: "푸터 소개", max: 100 },
  recruit_message: { label: "모집 안내", max: 300 },
  home_devils_title_1: { label: "메인 01 DEVILS 제목 1줄", max: HOME_TITLE_MAX },
  home_devils_title_2: { label: "메인 01 DEVILS 제목 2줄(외곽선)", max: HOME_TITLE_MAX },
  home_roster_title_1: { label: "메인 02 ROSTER 제목 1줄", max: HOME_TITLE_MAX },
  home_roster_title_2: { label: "메인 02 ROSTER 제목 2줄(외곽선)", max: HOME_TITLE_MAX },
  home_schedule_title_1: { label: "메인 03 GAME DAY 제목 1줄", max: HOME_TITLE_MAX },
  home_schedule_title_2: { label: "메인 03 GAME DAY 제목 2줄(외곽선)", max: HOME_TITLE_MAX },
  home_archive_title_1: { label: "메인 04 ARCHIVE 제목 1줄", max: HOME_TITLE_MAX },
  home_archive_title_2: { label: "메인 04 ARCHIVE 제목 2줄(외곽선)", max: HOME_TITLE_MAX },
  home_stats_title_1: { label: "메인 05 DATA 제목 1줄", max: HOME_TITLE_MAX },
  home_stats_title_2: { label: "메인 05 DATA 제목 2줄(외곽선)", max: HOME_TITLE_MAX },
};

export const SETTING_MAX_LENGTH = 200;

export async function getSiteContent(): Promise<Record<SiteContentKey, string>> {
  const values: Record<SiteContentKey, string> = { ...DEFAULT_CONTENT };
  const supabase = getSupabase();
  if (!supabase) return values;
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", Object.keys(DEFAULT_CONTENT));
  if (error) {
    console.error("[site-content] 조회 실패:", error.message);
    return values;
  }
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    if (row.key in values) values[row.key as SiteContentKey] = row.value;
  }
  return values;
}

export async function getSiteSettings(): Promise<Record<SiteSettingKey, string>> {
  const values: Record<SiteSettingKey, string> = { ...DEFAULT_SETTINGS };
  const supabase = getSupabase();
  if (!supabase) return values;
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", Object.keys(DEFAULT_SETTINGS));
  if (error) {
    console.error("[site-settings] 조회 실패:", error.message);
    return values;
  }
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    if (row.key in values) values[row.key as SiteSettingKey] = row.value;
  }
  return values;
}
