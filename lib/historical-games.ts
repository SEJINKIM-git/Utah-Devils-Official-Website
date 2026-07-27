// 2022~2025 공식 경기 아카이브.
// 출처: Utah Devils Homepage PDF의 경기 기록. 이 데이터는 Devils Insight AI와
// 무관하게 공식 홈페이지에 함께 배포되며, games 테이블에는 쓰지 않는다.

export type HistoricalGame = {
  id: number;
  date: string;
  time: string | null;
  opponent: string;
  location: string | null;
  is_home: boolean | null;
  result: "W" | "L" | "D" | "취소";
  score_us: number | null;
  score_them: number | null;
  season: string;
};

function completed(
  id: number,
  date: string,
  time: string,
  opponent: string,
  location: string,
  score_us: number,
  score_them: number
): HistoricalGame {
  return {
    id,
    date,
    time,
    opponent,
    location,
    is_home: null,
    result: score_us > score_them ? "W" : score_us < score_them ? "L" : "D",
    score_us,
    score_them,
    season: date.slice(0, 4),
  };
}

function cancelled(
  id: number,
  date: string,
  time: string,
  opponent: string,
  location: string
): HistoricalGame {
  return {
    id,
    date,
    time,
    opponent,
    location,
    is_home: null,
    result: "취소",
    score_us: null,
    score_them: null,
    season: date.slice(0, 4),
  };
}

export const HISTORICAL_GAMES: HistoricalGame[] = [
  // 2022
  completed(-2201, "2022-04-22", "18:20", "TEAM송도", "송도 랜드마크 야구장", 14, 19),
  completed(-2202, "2022-05-13", "18:20", "TEAM송도", "송도 랜드마크 야구장", 19, 15),
  completed(-2203, "2022-05-25", "15:30", "육군사관학교", "육군사관학교 야구장", 10, 12),
  completed(-2204, "2022-06-03", "18:00", "TEAM송도", "송도 랜드마크 야구장", 11, 18),
  completed(-2205, "2022-10-14", "18:00", "TEAM송도", "송도 랜드마크 야구장", 13, 12),
  completed(-2206, "2022-10-21", "18:00", "TEAM송도", "송도 랜드마크 야구장", 15, 2),
  cancelled(-2207, "2022-11-04", "18:00", "TEAM송도", "송도 랜드마크 야구장"),
  completed(-2208, "2022-11-11", "19:20", "TEAM시흥", "시흥 에코피아 야구장", 17, 11),
  completed(-2209, "2022-11-18", "19:30", "TEAMIPA", "IPA 볼파크", 13, 15),

  // 2023
  completed(-2301, "2023-04-14", "19:00", "TEAM곤지암", "팀업캠퍼스야구장 3구장", 11, 17),
  completed(-2302, "2023-05-19", "19:00", "TEAM곤지암", "팀업캠퍼스야구장 3구장", 10, 17),
  cancelled(-2303, "2023-05-27", "13:00", "인하대JADE", "동산중학교 야구장"),
  completed(-2304, "2023-06-02", "19:00", "TEAM곤지암", "팀업캠퍼스야구장 3구장", 18, 13),
  completed(-2305, "2023-08-19", "13:30", "매지션즈", "삼육 훼미리 야구장", 5, 9),
  completed(-2306, "2023-08-26", "08:00", "바이퍼즈", "삼육 훼미리 야구장", 10, 0),
  completed(-2307, "2023-09-02", "16:00", "에이포스", "화성드림파크 D구장", 12, 2),
  cancelled(-2308, "2023-09-17", "22:00", "TEAM선학", "선학 야구장"),
  completed(-2309, "2023-10-13", "22:00", "TEAM선학", "선학 야구장", 5, 10),
  completed(-2310, "2023-10-27", "22:00", "TEAM선학", "선학 야구장", 7, 8),
  completed(-2311, "2023-11-03", "22:00", "TEAM선학", "선학 야구장", 12, 11),

  // 2024
  completed(-2401, "2024-02-15", "09:00", "국민대윈드밀스", "팀업캠퍼스야구장 2구장", 15, 6),
  completed(-2402, "2024-02-15", "14:30", "충북대타우르스", "팀업캠퍼스야구장 2구장", 4, 5),
  completed(-2403, "2024-04-12", "22:00", "TEAM선학", "선학 야구장", 5, 15),
  completed(-2404, "2024-04-19", "22:00", "메이슨바이퍼스", "선학 야구장", 3, 20),
  completed(-2405, "2024-05-03", "22:00", "TEAM선학", "선학 야구장", 7, 15),
  completed(-2406, "2024-05-17", "22:00", "TEAM선학", "선학 야구장", 8, 7),
  completed(-2407, "2024-05-31", "22:00", "메이슨바이퍼스", "선학 야구장", 0, 7),
  completed(-2408, "2024-08-19", "15:00", "서원대흑마", "팀업캠퍼스야구장 2구장", 2, 7),
  completed(-2409, "2024-08-20", "15:00", "청주대나인파이터스", "팀업캠퍼스야구장 2구장", 20, 3),
  completed(-2410, "2024-09-08", "22:00", "TEAM선학", "선학 야구장", 7, 20),
  completed(-2411, "2024-09-22", "11:00", "SKIPPERS", "화성드림파크 D구장", 12, 4),
  completed(-2412, "2024-10-03", "15:00", "THUNDERBOLT", "선학 야구장", 8, 5),
  completed(-2413, "2024-10-11", "22:00", "TEAM선학", "선학 야구장", 3, 4),
  completed(-2414, "2024-10-25", "22:00", "메이슨바이퍼스", "선학 야구장", 3, 10),
  completed(-2415, "2024-11-15", "18:30", "메이슨바이퍼스", "서울대시흥캠퍼스 야구장", 4, 10),

  // 2025
  completed(-2501, "2025-02-15", "08:30", "다이아몬드에이스", "팀업캠퍼스야구장 3구장", 20, 0),
  completed(-2502, "2025-04-18", "22:00", "TEAM선학", "선학 야구장", 8, 11),
  completed(-2503, "2025-04-26", "12:30", "메이슨바이퍼스", "송도 LNG 야구장", 3, 6),
  cancelled(-2504, "2025-05-09", "22:00", "TEAM선학", "선학 야구장"),
  completed(-2505, "2025-05-23", "19:30", "메이슨바이퍼스", "선학 야구장", 4, 5),
  completed(-2506, "2025-05-30", "19:30", "TEAM선학", "선학 야구장", 15, 4),
  cancelled(-2507, "2025-09-19", "22:00", "TEAM선학", "선학 야구장"),
  completed(-2508, "2025-09-26", "22:00", "TEAM선학", "선학 야구장", 8, 9),
  completed(-2509, "2025-09-29", "22:00", "TEAM선학", "선학 야구장", 3, 3),
  completed(-2510, "2025-10-24", "19:20", "TEAM시흥", "서울대시흥캠퍼스 야구장", 16, 5),
  completed(-2511, "2025-10-31", "22:00", "메이슨바이퍼스", "선학 야구장", 9, 5),
  completed(-2512, "2025-11-07", "19:20", "메이슨바이퍼스", "서울대시흥캠퍼스 야구장", 8, 11),
  completed(-2513, "2025-11-14", "22:00", "메이슨바이퍼스", "선학 야구장", 10, 4),
];

export function withHistoricalGames<T extends { date: string }>(
  liveGames: T[]
): Array<T | HistoricalGame> {
  // 과거 시즌은 공식 PDF 아카이브를 단일 출처로 삼아 중복·미기록을 막는다.
  return [...HISTORICAL_GAMES, ...liveGames.filter((game) => game.date.slice(0, 4) > "2025")];
}
