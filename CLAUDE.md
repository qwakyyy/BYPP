@AGENTS.md

# BYPP - 밴드 동아리 웹사이트

## 스택
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Postgres + Realtime만 사용, Supabase Auth는 사용 안 함)
- 배포: Vercel

## 인증/권한
- 비밀번호 없는 초대코드 로그인 (처음 보는 이름이면 프로필 생성, 있으면 그대로 로그인)
- 서버에서 signed httpOnly 쿠키 발급 (Web Crypto HMAC, `lib/auth.ts`)
- `members.role`: `president` / `vice_president` / `member` — 집행부 세분화는 이후 값만 추가
- 곡 신청 일정 시작 등 관리 기능은 `president`/`vice_president` 전용

## 핵심 흐름 (공연 1건 기준)
1. `song_submission` (1일) — 곡 등록 (제목 + 필요 세션 + 세션별 악보)
2. `session_signup_phase1` (1일) — 세션 선착순 신청, 1인당 최대 2곡(`max_songs_per_member_phase1`)
3. `session_signup_phase2` (1일) — 인원 제한 없이 선착순 신청
4. `setlist_locked` — 세션이 다 찬 곡을 `completed_at` 순으로 정렬, `max_setlist_size`까지 확정
5. `scheduling` — 미니 when2meet으로 합주 시간 조율

## 페이지
- `/login`, `/` (대시보드), `/songs`, `/songs/[id]`, `/setlist`, `/schedule`, `/admin`

## 설계 원칙 (Next.js 16 관련 주의)
- `middleware.ts`가 아니라 **`proxy.ts`** 사용 (Next 16에서 이름 변경, export도 `proxy`)
- `cookies()`는 비동기 — 항상 `await cookies()`
- 세션 신청 동시성은 `UPDATE ... WHERE member_id IS NULL` 단일 SQL로 원자 처리 (별도 락 불필요)
- 브라우저에는 Supabase anon key만 노출, 모든 쓰기는 Server Action에서 service role key로 수행
- 상세 설계는 이전 계획 문서 참고 (역할별 권한, 데이터 모델, phase 전이 규칙)
