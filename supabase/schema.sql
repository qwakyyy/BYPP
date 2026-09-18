-- BYPP 밴드 동아리 웹사이트 스키마
-- Supabase SQL editor에 그대로 붙여넣어 실행하면 됩니다.

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  instrument text not null default '',
  role text not null default 'member' check (role in ('president', 'vice_president', 'member')),
  generation int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists invite_codes (
  code text primary key,
  role text not null check (role in ('president', 'vice_president', 'member')),
  generation int not null default 1,
  note text
);

create table if not exists performances (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date,
  phase text not null default 'draft' check (
    phase in (
      'draft',
      'song_submission',
      'session_signup_phase1',
      'session_signup_phase2',
      'setlist_locked',
      'scheduling',
      'done'
    )
  ),
  max_setlist_size int,
  max_songs_per_member_phase1 int not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references performances (id) on delete cascade,
  title text not null,
  artist text,
  submitted_by uuid not null references members (id),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists song_sessions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  session_type text not null,
  sheet_music_url text,
  member_id uuid references members (id),
  claimed_at timestamptz,
  unique (song_id, session_type)
);

-- 합주 일정은 공연 전체가 아니라 곡 단위다 (곡마다 참여 멤버가 다르므로).
-- timezone 없는 "동아리 현지 시간"으로 그대로 저장/표시한다 (UTC 변환 버그 방지)
create table if not exists rehearsal_slots (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  starts_at timestamp not null,
  ends_at timestamp not null
);

create table if not exists availabilities (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references rehearsal_slots (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  unique (slot_id, member_id)
);

-- 단계별 일정. 관리자가 설정하면 시작 시각이 지난 뒤 자동으로 다음 단계로 넘어간다
-- (session_signup_phase2의 ends_at은 셋리스트 자동 확정 트리거로도 쓰인다).
-- KST(+09:00) 오프셋을 포함한 timestamptz로 저장한다 (서버가 UTC로 돌아도 정확히 비교되도록).
create table if not exists phase_windows (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references performances (id) on delete cascade,
  phase text not null check (
    phase in ('song_submission', 'session_signup_phase1', 'session_signup_phase2', 'scheduling')
  ),
  starts_at timestamptz,
  ends_at timestamptz,
  unique (performance_id, phase)
);

-- RLS: 브라우저(anon key)는 읽기만 가능, 모든 쓰기는 서버(Service Role Key)에서만 수행한다.
alter table members enable row level security;
alter table performances enable row level security;
alter table songs enable row level security;
alter table song_sessions enable row level security;
alter table rehearsal_slots enable row level security;
alter table availabilities enable row level security;
alter table phase_windows enable row level security;
alter table invite_codes enable row level security; -- 정책을 하나도 안 만들어서 anon은 완전히 접근 불가

create policy "members readable" on members for select using (true);
create policy "performances readable" on performances for select using (true);
create policy "songs readable" on songs for select using (true);
create policy "song_sessions readable" on song_sessions for select using (true);
create policy "rehearsal_slots readable" on rehearsal_slots for select using (true);
create policy "availabilities readable" on availabilities for select using (true);
create policy "phase_windows readable" on phase_windows for select using (true);

-- Realtime 구독 대상 (RealtimeRefresher가 이 테이블들의 변경을 구독한다)
alter publication supabase_realtime add table songs;
alter publication supabase_realtime add table song_sessions;
alter publication supabase_realtime add table rehearsal_slots;
alter publication supabase_realtime add table availabilities;

