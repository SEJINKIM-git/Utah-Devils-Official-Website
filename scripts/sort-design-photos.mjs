#!/usr/bin/env node
/**
 * Utah Devils — 디자인 추출 사진 정리 스크립트 (Phase 6 부속 명세 §10-1)
 *
 * utah_devils_design_photos.zip 추출본(img-NNN 92장)을
 * docs/image_placement_spec 기준으로 ~/devils-images/ 구조에 재배치한다.
 *
 * 사용법: node scripts/sort-design-photos.mjs [소스폴더] [대상폴더]
 *   기본값: ~/Downloads/design_photos → ~/devils-images
 *
 * - 신원 확정 항목만 슬롯 폴더로 복사한다
 * - ⚠️ 항목(라벨 겹침/문서 간 충돌)은 _review/ 로 분리 — 운영자 확정 후 이동
 * - 선수(p5) 추출 컷은 드라이브 원본 대조용 → _reference/ (업로드 제외)
 * - _review/, _reference/ 는 upload-images.mjs가 업로드하지 않는다
 */

import { promises as fs } from "fs";
import { existsSync } from "fs";
import path from "path";

const HOME = process.env.HOME ?? "";
const src = path.resolve(
  (process.argv[2] ?? "~/Downloads/design_photos").replace(/^~(?=$|\/)/, HOME)
);
const dest = path.resolve(
  (process.argv[3] ?? "~/devils-images").replace(/^~(?=$|\/)/, HOME)
);

// ---------- 확정 매핑 (스템 → 대상 경로들; 복수 슬롯 재사용은 중복 복사) ----------

const PLACE = {
  // §1 공통 자산
  "img-033": ["logos/emblem.png"],
  "img-004": ["logos/circle-a.png"],
  "img-086": ["logos/circle-b.png"],
  "img-1003": ["logos/circle-c.png"],
  "img-006": ["logos/mascot-a.png"],
  "img-014": ["logos/mascot-b.png"],
  // §2 메인 분위기 컷 (초안 배치 순서 유지)
  "img-032": ["main/hero-bg.jpg"],
  "img-046": ["main/mood-1.jpg"],
  "img-048": ["main/mood-2.jpg"],
  "img-050": ["main/mood-3.jpg"],
  "img-052": ["main/mood-4.jpg"],
  // §3 타임라인 연도 스냅 (125/128/169는 §8 행사와 재사용 → 중복 복사)
  "img-122": ["timeline/2022/img-122.jpg"],
  "img-125": ["timeline/2023/img-125.png", "events/2023-baseball-night/img-125.png"],
  "img-128": ["timeline/2023/img-128.png", "events/2023-baseball-night/img-128.png"],
  "img-169": ["timeline/2024/img-169.jpg", "events/2024-assembly-dongsim/img-169.jpg"],
  "img-204": ["timeline/2025/img-204.jpg"],
  "img-207": ["timeline/2025/img-207.png"],
  "img-210": ["timeline/2025/img-210.png"],
  "img-246": ["timeline/2026/img-246.png"],
  "img-249": ["timeline/2026/img-249.jpg"],
  "img-252": ["timeline/2026/img-252.jpg"],
  // §4 어워즈 — 확정 항목만 (부문-등번호-인물)
  "img-320": ["awards/2022/bp-52-yoonjunyoung.png"],
  "img-359": ["awards/2023/bp-35-leehowon.jpg"],
  "img-361": ["awards/2023/rookie-22-kimkyungjae.png"],
  "img-362": ["awards/2023/manager-21-kimeuna.png"],
  "img-396": ["awards/2024/bb-25-kangbaehyun.png"],
  "img-397": ["awards/2024/bp-11-kimtaekyeong.png"],
  "img-399": ["awards/2024/rookie-82-hwangseohyun.png"],
  "img-400": ["awards/2024/manager-45-parkyeyoung.jpg"],
  "img-435": ["awards/2025/bp-82-hwangseohyun.jpg"],
  // §5 Hall of Fame Faculty (라벨 확정)
  "img-512": ["hof/faculty-greg-hill.png"],
  "img-513": ["hof/faculty-marisa-hill.png"],
  "img-514": ["hof/faculty-james-park.png"],
  "img-515": ["hof/faculty-molly-kinder.png"],
  // §6 선수 컷 — 드라이브 원본 대조용 (업로드 제외 _reference/)
  "img-677": ["_reference/player-design-cuts/2-limjuho.jpg"],
  "img-750": ["_reference/player-design-cuts/56-parkjimin.jpg"],
  // §8 행사 사진
  "img-1585": ["events/2022-baseball-night/img-1585.png"],
  "img-1586": ["events/2022-baseball-night/img-1586.png"],
  "img-1578": ["events/2023-baseball-night/img-1578.png"],
  "img-1579": ["events/2023-baseball-night/img-1579.png"],
  "img-1580": ["events/2023-baseball-night/img-1580.png"],
  "img-1588": ["events/2023-baseball-night/img-1588.png"],
  "img-1625": ["events/2025-baseball-night/img-1625.jpg"],
  "img-1626": ["events/2025-baseball-night/img-1626.jpg"],
  "img-1627": ["events/2025-baseball-night/img-1627.jpg"],
  "img-1581": ["events/2024-assembly-dongsim/img-1581.png"],
  "img-1582": ["events/2024-assembly-dongsim/img-1582.jpg"],
  "img-1583": ["events/2024-assembly-dongsim/img-1583.png"],
  "img-1628": ["events/2024-carnival-10th/img-1628.jpg"],
  "img-1629": ["events/2024-carnival-10th/img-1629.jpg"],
  "img-1630": ["events/2024-carnival-10th/img-1630.jpg"],
  "img-1631": ["events/2025-dongsim/img-1631.png"],
  "img-1632": ["events/2025-dongsim/img-1632.png"],
  "img-1633": ["events/2025-dongsim/img-1633.png"],
  "img-1672": ["events/2025-neungheodae/img-1672.png"],
  "img-1674": ["events/2025-neungheodae/img-1674.png"],
  "img-1675": ["events/2025-neungheodae/img-1675.png"],
  "img-1677": ["events/2026-childrens-day/img-1677.png"],
  "img-1678": ["events/2026-childrens-day/img-1678.png"],
  "img-1679": ["events/2026-childrens-day/img-1679.png"],
};

// ---------- ⚠️ 검수 필요 (라벨 겹침·문서 간 충돌·미배치) ----------

const REVIEW = {
  // §3 타임라인 연도 경계
  "img-163": "타임라인 2023~2024 경계 — 어느 연도 블록인지 확인",
  "img-166": "타임라인 2023~2024 경계 — 어느 연도 블록인지 확인",
  // §4 어워즈 라벨 겹침
  "img-319": "2022 MVP 이호원(35) 추정 — 권혁준 BB 카드와 걸친 대형, 시트 대조 필요",
  "img-321": "2022 권혁준(46) BB 또는 김채영(32) Manager — 둘 중 확정 필요",
  "img-322": "2022 MIP 강배현(25) 추정 — 라벨 겹침",
  "img-323": "2022 권혁준(46) BB 또는 김채영(32) Manager — 둘 중 확정 필요",
  "img-358": "2023 BB 박성연(27) 추정 — MVP 김경재와 인접",
  "img-360": "2023 김태경(11) MIP 또는 잔여 카드 — 확정 필요",
  "img-363": "2023 김태경(11) MIP 또는 잔여 카드 — 확정 필요",
  "img-398": "2024 MVP 이호원(35) 추정 — 대형 이미지 걸침",
  "img-401": "2024 MIP 정재형(17) 추정 — 라벨 겹침",
  "img-437": "2025 Rookie 임희찬(13) 추정 — 라벨 겹침",
  "img-438": "2025 Manager 김민정(51) 추정 — 조경민 MIP와 걸친 대형",
  "img-439": "2025 MVP 이호원(35) 추정 — 라벨 겹침",
  "img-717": "문서 충돌: §4는 박상언(23) 2025 BB, §6은 이호원(35) — 신원 확정 필요",
  "img-752": "문서 충돌: §4는 조경민(14) 2025 MIP, §6은 강래원(37) — 신원 확정 필요",
  // §6 선수 컷 라벨 겹침 (확정돼도 _reference로만 감 — 드라이브 원본 우선)
  "img-676": "선수 컷: 소이어(1) 추정 — 임주호 카드와 걸친 대형",
  "img-678": "선수 컷: 임희찬(13) 추정 — 조경민 라벨 인접",
  "img-679": "선수 컷: 조경민(14) 추정 — 라벨 인접",
  "img-714": "선수 컷: 강배현(25) 추정 — 윤준호(18)와 인접",
  "img-715": "선수 컷: 윤준호(18) 추정 — 라벨 인접",
  "img-716": "선수 컷: 사무엘(34) 추정 — 이호원(35)과 걸친 대형",
  "img-751": "선수 컷: 황서현(82) 추정 — 라벨 인접",
  // §8 행사 경계
  "img-1589": "2022 vs 2023 Baseball Night 경계 — 어느 행사인지 확인",
  // §9 미배치 — 확인 전까지 업로드 보류
  "img-037": "인물 세로컷 — 초안 배치 미확인, 용도 확인 필요",
  "img-434": "미배치 — 사용 여부 확인",
  "img-436": "미배치 — 사용 여부 확인",
};

// ---------- 사용 안 함 ----------

const SKIP = {
  "img-039": "PLAYER 실루엣 아이콘 — 사이트는 텍스트 카드로 구현됨",
  "img-041": "ARCHIVE 폴더 아이콘 — 미사용",
  "img-043": "Shop 카트 아이콘 — 미사용",
  "img-044": "Certification 아이콘 — 미사용",
  "img-1466": "구장/팀 원형 아이콘 자리 — 경기 카드는 텍스트 유지",
};

// ---------- 실행 ----------

if (!existsSync(src)) {
  console.error(`소스 폴더가 없습니다: ${src}`);
  process.exit(1);
}

const files = (await fs.readdir(src)).filter((f) => !f.startsWith("."));
const byStem = new Map(files.map((f) => [f.replace(/\.[^.]+$/, ""), f]));

let placed = 0;
const reviewRows = [];
const unmapped = [];

async function copyTo(srcFile, relDest) {
  const abs = path.join(dest, relDest);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.copyFile(path.join(src, srcFile), abs);
}

for (const [stem, file] of byStem) {
  if (PLACE[stem]) {
    for (const target of PLACE[stem]) {
      // 확장자는 원본을 따른다 (매핑의 확장자와 다르면 원본 확장자로 교체)
      const ext = path.extname(file);
      const target2 = target.replace(/\.[^.]+$/, ext);
      await copyTo(file, target2);
    }
    placed++;
  } else if (REVIEW[stem]) {
    await copyTo(file, path.join("_review", file));
    reviewRows.push([file, REVIEW[stem]]);
  } else if (SKIP[stem]) {
    // 복사하지 않음
  } else {
    unmapped.push(file);
  }
}

reviewRows.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

console.log(`\n정리 완료 → ${dest}`);
console.log(`  확정 배치: ${placed}개 / 검수 대기(_review): ${reviewRows.length}개 / 사용 안 함: ${Object.keys(SKIP).length}개`);
if (unmapped.length) console.log(`  ⚠️ 명세에 없는 파일 (수동 확인): ${unmapped.join(", ")}`);

console.log("\n## 운영자 검수 대기 목록 (_review/)\n");
console.log("| 파일 | 확인할 내용 |");
console.log("|---|---|");
for (const [file, note] of reviewRows) console.log(`| ${file} | ${note} |`);
console.log(
  "\n확정되면 _review/의 파일을 위 매핑 규칙에 맞는 폴더로 옮기거나, 스크립트의 PLACE에 추가 후 재실행하세요."
);
console.log("MEDIA 카드 대표 이미지(img-1631 방송 컷 제안)도 운영자 지정이 필요합니다.");
