# Utah Devils 홈페이지 — 이미지 배치 명세서 (Phase 6 부속 문서)

Canva 초안 PDF(11페이지)에서 추출한 사진 92장(img-NNN)이 초안의 어느 위치에 배치되어 있고,
누구/무엇을 가리키며, 웹사이트의 어느 슬롯에 들어가야 하는지 정의한다.
Task 2(DB 연결)·Task 3(프론트 슬롯)의 기준 문서. 시각 대조는 `docs/design_images_inventory.jpg`.

⚠️ = 라벨이 인접 카드와 겹쳐 신원 확신도가 낮음 → `~/devils-images/_review/`로 분리됨.
운영자 확정 후 `scripts/sort-design-photos.mjs`의 PLACE에 추가하고 재실행한다.

## 0. 핵심 결정

1. **Faculty 4명 사진은 PDF 추출본(img-512~515) 사용** — 드라이브에 없어도 됨
2. **HoF 학생/매니저 카드는 디자인상 사진 없음** — photo_url은 Faculty만 채운다 (타이포 카드 유지)
3. **2022~2024 행사 사진도 추출본으로 해결** (웹 썸네일 해상도 충분)
4. **선수(p5) 추출 컷은 드라이브 Player Interview 고해상 원본 대조용** — `_reference/`, 업로드 제외

## 1. 정리 후 로컬 구조 (`~/devils-images/`) ↔ 슬롯

| 폴더 | 내용 | 웹사이트 슬롯 |
|---|---|---|
| logos/ | emblem(img-033), circle-a/b/c(004/086/1003), mascot-a/b(006/014) | 파비콘·OG·헤더 아이콘 / 푸터 / #devils 장식·404·empty state |
| main/ | hero-bg(032), mood-1~4(046/048/050/052) | #hero 배경(선택, 성능 확인 후) / 섹션 사이 분위기 컷 (순서 유지) |
| timeline/2022~2026/ | 연도별 스냅 (122 / 125·128 / 169 / 204·207·210 / 246·249·252) | /devils 연도 블록 우측(모바일 하단) 스냅 — 정적 상수 매핑 |
| awards/{시즌}/ | 부문-등번호-인물 확정 9장 (§4 확정 항목만) | /archive 어워즈 카드 (season_awards.photo_url — sql/05) |
| hof/ | faculty-greg-hill·marisa-hill·james-park·molly-kinder (512~515) | /archive HoF Faculty 카드 |
| events/{slug}/ | §8 행사별 그룹 | archive_events.photo_urls 배열 + 라이트박스 |
| games/ | (드라이브 대표컷, 선택) | — |
| _review/ | ⚠️ 27장 | 운영자 확정 대기 |
| _reference/ | 선수 컷 대조용 | 업로드 안 함 |

행사 slug: 2022/2023/2025-baseball-night, 2024-assembly-dongsim(국회동심한마당),
2024-carnival-10th(10주년 카니발), 2025-dongsim, 2025-neungheodae, 2026-childrens-day.

## 2. 어워즈 확정 매핑 (업로드 완료분 → seed_photos.sql 대상)

| 시즌 | 부문 | 인물 | 파일 |
|---|---|---|---|
| 2022 | Best Pitcher | 윤준영(52) | awards/2022/bp-52-yoonjunyoung.jpg |
| 2023 | Best Pitcher | 이호원(35) | awards/2023/bp-35-leehowon.jpg |
| 2023 | Rookie | 김경재(22) | awards/2023/rookie-22-kimkyungjae.jpg |
| 2023 | Manager | 김은아(21) | awards/2023/manager-21-kimeuna.jpg |
| 2024 | Best Batter | 강배현(25) | awards/2024/bb-25-kangbaehyun.jpg |
| 2024 | Best Pitcher | 김태경(11) | awards/2024/bp-11-kimtaekyeong.jpg |
| 2024 | Rookie | 황서현(82) | awards/2024/rookie-82-hwangseohyun.jpg |
| 2024 | Manager | 박예영(45) | awards/2024/manager-45-parkyeyoung.jpg |
| 2025 | Best Pitcher | 황서현(82) | awards/2025/bp-82-hwangseohyun.jpg |

MVP 카드(2022/2024/2025 이호원 추정)와 나머지는 전부 _review — 확정 후 추가.

## 3. 검수 대기 목록 (_review/ 27장)

| 파일 | 확인할 내용 |
|---|---|
| img-037.png | 인물 세로컷 — 초안 배치 미확인, 용도 확인 |
| img-163.jpg / img-166.png | 타임라인 2023~2024 경계 — 연도 확정 |
| img-319.jpg | 2022 MVP 이호원(35) 추정 — 대형 걸침 |
| img-321.png / img-323.png | 2022 권혁준(46) BB vs 김채영(32) Manager — 매칭 확정 |
| img-322.jpg | 2022 MIP 강배현(25) 추정 |
| img-358.png | 2023 BB 박성연(27) 추정 — MVP 김경재 인접 |
| img-360.png / img-363.png | 2023 김태경(11) MIP vs 잔여 카드 |
| img-398.jpg | 2024 MVP 이호원(35) 추정 — 대형 |
| img-401.jpg | 2024 MIP 정재형(17) 추정 |
| img-434.jpg / img-436.png | 미배치 — 사용 여부 |
| img-437.jpg | 2025 Rookie 임희찬(13) 추정 |
| img-438.jpg | 2025 Manager 김민정(51) 추정 — 조경민 MIP 걸침 |
| img-439.jpg | 2025 MVP 이호원(35) 추정 |
| img-676/678/679/714/715/716/751 | 선수 컷 신원 (확정돼도 드라이브 원본 대조용) |
| img-717.jpg | **문서 충돌**: §4 박상언(23) 2025 BB vs §6 이호원(35) |
| img-752.png | **문서 충돌**: §4 조경민(14) 2025 MIP vs §6 강래원(37) |
| img-1589.png | 2022 vs 2023 Baseball Night 경계 |

미지정: MEDIA 카드 대표 이미지 (제안: img-1631 방송 컷) — 운영자 지정.

## 4. 사용 안 함

img-039/041/043/044 (섹션 아이콘 — 텍스트 카드로 구현됨), img-1466 (구장/팀 아이콘 자리 — 경기 카드 텍스트 유지).

## 5. 파이프라인

1. `node scripts/sort-design-photos.mjs` — 추출본 → ~/devils-images 재배치 (+ _review 분리)
2. 드라이브 확보분(roster 원본, 2026 행사 고해상, 투명 로고)을 같은 구조에 추가 — 드라이브 우선 원칙
3. `SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-images.mjs ~/devils-images` (키는 셸로만)
4. `sql/05_awards_photo.sql` 실행 → `sql/seed/seed_photos.sql`(Task 2에서 생성) 실행
5. Task 3 프론트 슬롯: 로고/파비콘/OG → PLAYER 카드 → HoF Faculty → 행사 갤러리+라이트박스 → MEDIA → 분위기 컷
