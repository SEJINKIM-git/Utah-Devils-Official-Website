-- Phase 8 A2: 현재 하드코딩 문구를 관리용 site_content로 이관한다.
insert into public.site_content (key, value, label, description, multiline, max_length) values
  ('hero_title_sub', 'UTAH ASIA CAMPUS · BASEBALL CLUB', '메인 히어로 부제', '메인 화면의 작은 상단 문구입니다.', false, 80),
  ('hero_tagline', '유타대학교 아시아캠퍼스 야구동아리 Utah Devils', '메인 히어로 소개', '메인 화면 제목 아래 소개 문구입니다.', true, 160),
  ('about_p1', '2022년 2월 창단한 유타대학교의 야구동아리 Utah Devils는 야구를 좋아하는 학생들이 모여, 단순히 경기를 하는 것을 넘어 야구가 지닌 가치와 매력을 함께 만들어 가는 동아리입니다.', '데빌스 소개 1', '/devils 소개 첫 문단입니다.', true, 400),
  ('about_p2', '정기 리그와 교류전, 캠퍼스 행사, Utah Baseball Night를 꾸준히 운영하며 유타대학교 아시아캠퍼스를 대표하는 야구 커뮤니티로 성장하고 있습니다.', '데빌스 소개 2', '/devils 소개 두 번째 문단입니다.', true, 400),
  ('about_p3', '부원들은 경기뿐 아니라 스포츠 산업, 홍보·마케팅, 미디어 콘텐츠 제작 활동에도 참여합니다.', '데빌스 소개 3', '/devils 소개 세 번째 문단입니다.', true, 400),
  ('about_p4', '야구와 자신의 진로를 연결하며 실전 경험과 대학 생활의 추억을 함께 쌓아 갑니다.', '데빌스 소개 4', '/devils 소개 네 번째 문단입니다.', true, 400),
  ('fact_founded', '2022', '창단 연도', '메인 데빌스 영역의 팩트 값입니다.', false, 60),
  ('fact_affiliation', 'UAC', '소속', '데빌스 소개 영역의 팩트 값입니다.', false, 60),
  ('fact_home', 'INCHEON', '활동 지역', '메인 데빌스 영역의 팩트 값입니다.', false, 60),
  ('fact_members', '100+', '누적 회원', '메인 데빌스 영역의 팩트 값입니다.', false, 60),
  ('section_desc_players', 'Utah Devils 선수단과 시즌별 프로필을 확인하세요.', '선수 페이지 설명', '/players 제목 아래 설명입니다.', true, 200),
  ('section_desc_schedule', '시즌별 경기 일정과 결과를 확인하세요. 진행 중인 시즌의 미정 경기는 TBA로 표시됩니다.', '일정 페이지 설명', '/schedule 제목 아래 설명입니다.', true, 200),
  ('section_desc_archive', '연혁, 시즌 어워즈, 명예의 전당, 그리고 Utah Devils가 함께한 행사의 기록입니다.', '아카이브 설명', '/archive 제목 아래 설명입니다.', true, 200),
  ('section_desc_shop', 'Utah Devils 굿즈 수요조사와 지금까지 만든 굿즈를 확인하세요.', '굿즈 페이지 설명', '/shop 제목 아래 설명입니다.', true, 200),
  ('footer_about', '유타대학교 아시아캠퍼스 야구동아리', '푸터 소개', '푸터 왼쪽 한 줄 소개입니다.', false, 100),
  ('recruit_message', '새로운 데빌스를 기다립니다.', '모집 안내', '모집 섹션이 있을 때 표시하는 안내입니다.', true, 300)
on conflict (key) do nothing;
