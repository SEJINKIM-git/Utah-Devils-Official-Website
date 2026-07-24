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
  "img-163": ["timeline/2024/img-163.jpg"],
  "img-166": ["timeline/2024/img-166.png"],
  "img-125": ["timeline/2023/img-125.png", "events/2023-baseball-night/img-125.png"],
  "img-128": ["timeline/2023/img-128.png", "events/2023-baseball-night/img-128.png"],
  "img-169": ["timeline/2024/img-169.jpg", "events/2024-assembly-dongsim/img-169.jpg"],
  "img-204": ["timeline/2025/img-204.jpg"],
  "img-207": ["timeline/2025/img-207.png"],
  "img-210": ["timeline/2025/img-210.png"],
  "img-246": ["timeline/2026/img-246.png"],
  "img-249": ["timeline/2026/img-249.jpg"],
  "img-252": ["timeline/2026/img-252.jpg"],
  // §4 어워즈 — 운영자 확정(2026-07-25) 반영.
  // 추출 라벨이 전 시즌에서 한 칸씩 밀려 있었음 → 카드 순서대로 재정렬.
  // 2022 (Rookie 없음, 5카드): MVP 이호원 → BB 권혁준 → BP 윤준영 → MIP 강배현 → Mgr 김채영
  "img-319": ["awards/2022/mvp-35-leehowon.jpg"],
  "img-320": ["awards/2022/bb-46-kwonhyukjoon.png"],
  "img-321": ["awards/2022/bp-52-yoonjunyoung.png"],
  "img-322": ["awards/2022/mip-25-kangbaehyun.jpg"],
  "img-323": ["awards/2022/manager-32-kimchaeyoung.png"],
  // 2023: MVP 김경재 → BB 박성연 → BP 이호원 → MIP 김태경 → Rookie 김경재 → Mgr 김은아
  "img-358": ["awards/2023/mvp-22-kimkyungjae.png"],
  "img-359": ["awards/2023/bb-27-parkseongyeon.jpg"],
  "img-360": ["awards/2023/bp-35-leehowon.png"],
  "img-361": ["awards/2023/mip-11-kimtaekyeong.png"],
  "img-362": ["awards/2023/rookie-22-kimkyungjae.png"],
  "img-363": ["awards/2023/manager-21-kimeuna.png"],
  // 2024: MVP 이호원 → BB 강배현 → BP 김태경 → MIP 정재형 → Rookie 황서현 → Mgr 박예영
  "img-396": ["awards/2024/mvp-35-leehowon.png"],
  "img-397": ["awards/2024/bb-25-kangbaehyun.png"],
  "img-398": ["awards/2024/bp-11-kimtaekyeong.jpg"],
  "img-399": ["awards/2024/mip-17-jungjaehyeong.png"],
  "img-400": ["awards/2024/rookie-82-hwangseohyun.jpg"],
  "img-401": ["awards/2024/manager-45-parkyeyoung.jpg"],
  // 2025: MVP 이호원(717) → BB 박상언(435, 소거법 ⚠️) → BP 황서현(752)
  //       → MIP 조경민(437) → Rookie 임희찬(438) → Mgr 김민정(439)
  "img-717": ["awards/2025/mvp-35-leehowon.jpg", "_reference/player-design-cuts/35-leehowon.jpg"],
  "img-435": ["awards/2025/bb-23-parksangeon.jpg"],
  "img-752": ["awards/2025/bp-82-hwangseohyun.png"],
  "img-437": ["awards/2025/mip-14-chokyungmin.jpg"],
  "img-438": ["awards/2025/rookie-13-limheechan.jpg"],
  "img-439": ["awards/2025/manager-51-kimminjung.jpg"],
  // §5 Hall of Fame Faculty (라벨 확정)
  "img-512": ["hof/faculty-greg-hill.png"],
  "img-513": ["hof/faculty-marisa-hill.png"],
  "img-514": ["hof/faculty-james-park.png"],
  "img-515": ["hof/faculty-molly-kinder.png"],
  // §6 선수 컷 — 드라이브 원본 대조용 (업로드 제외 _reference/), 운영자 확정 반영
  "img-676": ["_reference/player-design-cuts/1-sawyer.jpg"],
  "img-677": ["_reference/player-design-cuts/2-limjuho.jpg"],
  "img-678": ["_reference/player-design-cuts/13-limheechan.png"],
  "img-679": ["_reference/player-design-cuts/14-chokyungmin.png"],
  "img-714": ["_reference/player-design-cuts/18-yoonjunho.jpg"],
  "img-715": ["_reference/player-design-cuts/25-kangbaehyun.png"],
  "img-716": ["_reference/player-design-cuts/34-samuel.jpg"],
  "img-751": ["_reference/player-design-cuts/56-parkjimin.png"],
  // §8 행사 사진
  "img-1585": ["events/2022-baseball-night/img-1585.png"],
  "img-1586": ["events/2022-baseball-night/img-1586.png"],
  "img-1589": ["events/2022-baseball-night/img-1589.png"],
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
  // 운영자 보류 (2026-07-25)
  "img-037": "인물 세로컷 — 보류 (운영자 지시)",
  "img-434": "미배치 — 보류 (운영자 지시)",
  "img-436": "미배치 — 보류 (운영자 지시)",
  // 소거법 추정 — 확정 답변에 없던 파일
  "img-750": "선수 컷: 강래원(37) 추정 (751=박지민 확정에 따른 소거) — 재확인 필요",
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
