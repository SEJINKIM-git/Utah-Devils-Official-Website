# Supabase Storage 사진 업로드 가이드

**작성일:** 2026-07-24  
**대상:** 운영자 (비전공)  
**목적:** 홈페이지 각 섹션의 사진을 Supabase에 업로드하고 링크하는 방법

---

## 📋 개요

Utah Devils 공식 홈페이지는 다음 섹션에 사진을 표시합니다:

| 섹션 | 테이블 | 컬럼 | 예시 |
|---|---|---|---|
| **Hall of Fame** | `hall_of_fame` | `photo_url` | 단일 사진 (선수/스태프 프로필) |
| **Archive Events** | `archive_events` | `photo_urls` | 여러 장 (행사 사진들) |

현재 모든 사진 URL이 비어있습니다. 이 가이드에 따라 업로드하면 홈페이지에 자동 반영됩니다.

---

## 🚀 빠른 시작

### Step 1: Supabase 대시보시 접속

1. https://supabase.com 접속
2. 좌측 메뉴에서 **Storage** 클릭
3. `official-site` 버킷 확인 (없으면 생성)

### Step 2: 폴더 구조 확인

`official-site` 버킷 내 다음 폴더가 있어야 합니다:

```
official-site/
├── hof/          ← Hall of Fame 사진
├── events/       ← Archive Events 사진
├── products/     ← 굿즈 사진 (미사용)
└── roster/       ← 선수 단체사진 (향후 확장)
```

**폴더가 없으면:**
1. **Upload** 버튼 → **Create folder** → 폴더명 입력
2. 4개 폴더 생성

---

## 📸 Hall of Fame 사진 업로드

### 파일 규격

| 규격 | 값 |
|---|---|
| **용량** | 500KB 이하 권장 (1MB 초과 불가) |
| **해상도** | 최소 400×600px (세로) |
| **비율** | 3:4 ~ 1:1 권장 |
| **형식** | JPG, PNG |
| **파일명** | 영문_학번 또는 영문명 (예: `howon_lee.jpg`) |

### 업로드 방법

1. **Supabase Storage → `official-site/hof/` 폴더 진입**
2. **Upload** 버튼 → 사진 선택
3. 업로드 완료 후 **파일명 우클릭 → Copy URL** (또는 **Share** 버튼)

### 데이터베이스 연결

**Supabase Table Editor:**
1. **hall_of_fame** 테이블 열기
2. 해당 선수/스태프 행의 `photo_url` 컬럼 클릭
3. 복사한 URL 붙여넣기 (예: `https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/hof/howon_lee.jpg`)
4. **저장** (Enter 누르면 자동)

#### 예시

- 이호원(선수): `official-site/hof/howon_lee.jpg`
- Greg Hill(스태프): `official-site/hof/greg_hill.jpg`

---

## 🎬 Archive Events 사진 업로드

### 파일 규격

| 규격 | 값 |
|---|---|
| **용량** | 500KB 이하 권장 |
| **해상도** | 최소 800×600px (가로) |
| **비율** | 16:9 ~ 1:1 권장 (카드 레이아웃에 맞춤) |
| **형식** | JPG, PNG |
| **파일명** | 행사명_순서 (예: `2025_baseball_night_01.jpg`) |

### 업로드 방법

1. **Supabase Storage → `official-site/events/` 폴더 진입**
2. **Upload** → 같은 행사 사진 여러 장 선택
3. 각 파일마다 **Copy URL**

### 데이터베이스 연결

**Supabase Table Editor:**
1. **archive_events** 테이블 열기
2. 해당 행사 행의 `photo_urls` 컬럼 클릭
3. **배열 형식**으로 URL들을 입력:

```sql
["https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025_baseball_night_01.jpg", "https://vdnhdncxmkzcmqmvqgfb.supabase.co/storage/v1/object/public/official-site/events/2025_baseball_night_02.jpg"]
```

#### 더 간단한 방법 (텍스트 편집기)

1. URL을 텍스트 파일에 한 줄씩 작성:
   ```
   https://...baseball_night_01.jpg
   https://...baseball_night_02.jpg
   https://...baseball_night_03.jpg
   ```
2. Supabase SQL Editor에서:
   ```sql
   update archive_events
   set photo_urls = array[
     'https://...baseball_night_01.jpg',
     'https://...baseball_night_02.jpg',
     'https://...baseball_night_03.jpg'
   ]
   where title = '2025 Utah Baseball Night';
   ```

---

## 🖼️ 권장 이미지 규격 (상세)

### Hall of Fame 선수 카드
- **크기:** 세로형 (Portrait)
- **최적 해상도:** 400×600px ~ 600×900px
- **비율:** 3:4 (세로)
- **스타일:** 상반신 또는 전신 사진

### Archive Events 그룹 사진
- **크기:** 가로형 (Landscape) 또는 정사각형
- **최적 해상도:** 800×600px ~ 1200×900px
- **비율:** 16:9 또는 1:1
- **스타일:** 팀 단체사진, 행사 현장 사진

---

## ⚠️ 주의사항

### 파일 크기 관리
- **500KB 이상이면 이미지 압축 도구 사용:**
  - https://imagecompressor.com (무료, 온라인)
  - 또는 Mac **미리보기 → 도구 → 크기 조정**

### URL 복사 시 주의
- 전체 URL을 정확히 복사 (https://부터 .jpg까지)
- 끝에 공백 없도록 확인

### 배열 형식 (archive_events)
- 큰 따옴표 사용: `["url1", "url2"]`
- 쉼표와 공백 정확히 입력
- 빈 배열: `[]`

---

## 🔍 확인 방법

업로드 후 다음을 확인하세요:

1. **로컬 개발 환경:**
   ```bash
   npm run dev
   # http://localhost:3000/archive 또는 /players 접속
   # 사진이 보이는지 확인
   ```

2. **배포 사이트:**
   - https://utah-devils-official-website.vercel.app
   - 대기 2~5분 후 새로고침
   - 사진 표시 확인

3. **문제가 있으면:**
   - 브라우저 개발자 도구 (F12) → **Console** 탭
   - 에러 메시지 확인 후 운영팀에 보고

---

## 💾 Storage 권한 (기술자 참고)

`official-site` 버킷은 **Public** 설정이어야 합니다:
- Storage → official-site 선택
- **Policies** → Insert/Update/Delete는 `service_role`만 허용
- Select(읽기)는 `public` 허용

---

## 📞 문제 해결

| 문제 | 원인 | 해결 |
|---|---|---|
| 사진이 안 보임 | URL 오류 / 파일 없음 | URL 복사 재확인, 파일 존재 여부 확인 |
| "Too large" 에러 | 파일 크기 > 1MB | 이미지 압축 후 재업로드 |
| 배열 형식 오류 | 따옴표/쉼표 오류 | `["url1", "url2"]` 형식 정확히 입력 |
| 캐시 문제 | 브라우저 캐시 | Ctrl+Shift+Delete (캐시 삭제) 후 새로고침 |

---

## 📝 운영 체크리스트

- [ ] Supabase Storage `official-site` 버킷 확인
- [ ] 4개 폴더(`hof`, `events`, `products`, `roster`) 생성
- [ ] Hall of Fame 선수 사진 10장 업로드
- [ ] `hall_of_fame.photo_url` 컬럼에 URL 입력
- [ ] Archive Events 사진들 업로드 (행사별 그룹)
- [ ] `archive_events.photo_urls` 배열 입력
- [ ] 로컬 개발 서버에서 사진 표시 확인
- [ ] 배포 사이트에서 최종 확인

---

**완료 후:** 운영팀에 "사진 업로드 완료" 보고해주세요.  
**문의:** 기술 팀원에게 연락 주세요.
