-- 안아줌 핵심 테이블

create extension if not exists pgcrypto;

create type public.purpose as enum ('adopt', 'rehome');
create type public.user_status as enum ('active', 'suspended', 'banned');
create type public.tri_state as enum ('yes', 'no', 'unknown');
create type public.pet_sex as enum ('male', 'female', 'unknown');
create type public.pet_size as enum ('small', 'medium', 'large');
create type public.post_status as enum ('active', 'adopted');
create type public.visibility as enum ('visible', 'pending_review', 'hidden');
create type public.media_type as enum ('image', 'video');
create type public.subscription_status as enum ('active', 'past_due', 'expired');
create type public.payment_status as enum ('paid', 'failed', 'refunded');
create type public.refund_reason as enum ('mistake', 'duplicate', 'system_error');
create type public.refund_status as enum ('requested', 'completed', 'rejected');
create type public.report_target as enum ('post', 'message', 'user');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
create type public.sanction_type as enum ('warning', 'suspend_7d', 'ban');
create type public.word_action as enum ('warn', 'block');
create type public.word_scope as enum ('post', 'chat', 'all');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'skipped');

-- 회원 공개 정보 (누구나 조회)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text unique check (char_length(nickname) between 2 and 20),
  primary_purpose public.purpose,
  is_verified boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- 회원 상태 (본인과 관리자만 조회, 서버와 관리자 함수만 수정)
create table public.account_status (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  is_admin boolean not null default false,
  status public.user_status not null default 'active',
  suspended_until timestamptz,
  warning_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.identity_verifications (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  provider text not null,
  ci_hash text not null unique,
  phone text not null,
  birth_year int not null,
  verified_at timestamptz not null default now()
);

create table public.banned_identities (
  ci_hash text primary key,
  reason text,
  created_at timestamptz not null default now()
);

create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  marketing boolean not null default false,
  agreed_at timestamptz not null default now()
);

-- 카테고리와 세부 종
create table public.categories (
  id smallint primary key,
  slug text not null unique,
  name text not null,
  sort_order smallint not null default 0
);

create table public.breeds (
  id int generated always as identity primary key,
  category_id smallint not null references public.categories (id),
  name text not null,
  is_cites boolean not null default false,
  is_banned boolean not null default false,
  requires_review boolean not null default false,
  sort_order int not null default 0,
  unique (category_id, name)
);

-- 분양글
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 60),
  category_id smallint not null references public.categories (id),
  breed_id int references public.breeds (id),
  breed_text text check (breed_text is null or char_length(breed_text) <= 40),
  sex public.pet_sex not null default 'unknown',
  birth_date date not null,
  region_sido text not null,
  region_sigungu text not null,
  size public.pet_size,
  neutered public.tri_state not null default 'unknown',
  vaccinated public.tri_state not null default 'unknown',
  registered public.tri_state not null default 'unknown',
  registration_no text,
  health_note text check (health_note is null or char_length(health_note) <= 1000),
  good_with_people public.tri_state not null default 'unknown',
  good_with_kids public.tri_state not null default 'unknown',
  good_with_animals public.tri_state not null default 'unknown',
  potty_trained public.tri_state not null default 'unknown',
  included_items text check (included_items is null or char_length(included_items) <= 300),
  description text not null check (char_length(description) between 10 and 3000),
  reason text not null check (char_length(reason) between 5 and 2000),
  is_urgent boolean not null default false,
  urgent_deadline date,
  cites_docs boolean,
  status public.post_status not null default 'active',
  visibility public.visibility not null default 'visible',
  review_note text,
  view_count int not null default 0,
  favorite_count int not null default 0,
  last_confirmed_at timestamptz not null default now(),
  adopted_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (breed_id is not null or breed_text is not null),
  check (not is_urgent or urgent_deadline is not null)
);

create index posts_list_idx on public.posts (category_id, status, created_at desc)
  where deleted_at is null and visibility = 'visible';
create index posts_urgent_idx on public.posts (urgent_deadline)
  where is_urgent and status = 'active' and deleted_at is null and visibility = 'visible';
create index posts_region_idx on public.posts (region_sido, region_sigungu);
create index posts_author_idx on public.posts (author_id);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  type public.media_type not null,
  storage_path text not null,
  sort_order smallint not null default 0,
  is_cover boolean not null default false,
  content_hash text,
  created_at timestamptz not null default now()
);

create index post_media_post_idx on public.post_media (post_id, sort_order);
create index post_media_hash_idx on public.post_media (content_hash) where content_hash is not null;

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- 구독과 결제 (서버만 기록)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.subscription_status not null default 'active',
  billing_key text,
  price int not null default 5900,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_live_per_user
  on public.subscriptions (user_id) where status in ('active', 'past_due');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  amount int not null,
  status public.payment_status not null,
  pg_payment_id text unique,
  period_start timestamptz not null,
  period_end timestamptz not null,
  paid_at timestamptz,
  refunded_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index payments_user_idx on public.payments (user_id, created_at desc);

create table public.payment_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  agreed_auto_billing boolean not null check (agreed_auto_billing),
  agreed_no_refund_after_chat boolean not null check (agreed_no_refund_after_chat),
  agreed_free_rehoming boolean not null check (agreed_free_rehoming),
  notice_version text not null,
  created_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason public.refund_reason not null,
  status public.refund_status not null default 'requested',
  note text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 채팅
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  rehomer_id uuid not null references public.profiles (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  first_message_at timestamptz,
  first_message_notified boolean not null default false,
  last_message_at timestamptz,
  last_message_preview text,
  adopter_last_read_at timestamptz,
  rehomer_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, adopter_id),
  check (adopter_id <> rehomer_id)
);

create index chat_rooms_adopter_idx on public.chat_rooms (adopter_id, created_at desc);
create index chat_rooms_rehomer_idx on public.chat_rooms (rehomer_id, last_message_at desc);
create index chat_rooms_payment_idx on public.chat_rooms (payment_id);

create table public.messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text check (body is null or char_length(body) <= 2000),
  image_path text,
  is_blocked boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now(),
  check (body is not null or image_path is not null)
);

create index messages_room_idx on public.messages (room_id, created_at);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.adoptions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.chat_rooms (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  rehomer_id uuid not null references public.profiles (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  rehomer_confirmed_at timestamptz,
  adopter_confirmed_at timestamptz,
  adopter_agreed_pledge boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 운영
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_post_id uuid references public.posts (id) on delete set null,
  target_message_id bigint references public.messages (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  detail text check (detail is null or char_length(detail) <= 1000),
  status public.report_status not null default 'open',
  resolution text,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);

create table public.sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.sanction_type not null,
  reason text not null,
  report_id uuid references public.reports (id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.banned_words (
  id int generated always as identity primary key,
  pattern text not null,
  is_regex boolean not null default false,
  action public.word_action not null,
  scope public.word_scope not null default 'all',
  label text not null,
  created_at timestamptz not null default now(),
  unique (pattern, scope)
);

create table public.notification_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  channel text not null default 'alimtalk',
  status public.notification_status not null default 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notification_logs_pending_idx on public.notification_logs (created_at) where status = 'pending';

create table public.admin_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
