-- 안아줌 보안 규칙 (RLS), 실시간, 파일 저장소

alter table public.profiles enable row level security;
alter table public.account_status enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.banned_identities enable row level security;
alter table public.consents enable row level security;
alter table public.categories enable row level security;
alter table public.breeds enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.favorites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_consents enable row level security;
alter table public.refunds enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.adoptions enable row level security;
alter table public.reports enable row level security;
alter table public.sanctions enable row level security;
alter table public.banned_words enable row level security;
alter table public.notification_logs enable row level security;
alter table public.admin_logs enable row level security;

-- 회원
create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "own profile update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (nickname, primary_purpose, onboarded_at) on public.profiles to authenticated;

create policy "own status or admin" on public.account_status
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.account_status from anon, authenticated;

create policy "own verification or admin" on public.identity_verifications
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.identity_verifications from anon, authenticated;

create policy "admin reads banned identities" on public.banned_identities
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.banned_identities from anon, authenticated;

create policy "own consents" on public.consents
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "insert own consents" on public.consents
  for insert to authenticated with check (user_id = (select auth.uid()));

-- 카테고리와 세부 종
create policy "categories are public" on public.categories
  for select to anon, authenticated using (true);
create policy "admin manages categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "breeds are public" on public.breeds
  for select to anon, authenticated using (true);
create policy "admin manages breeds" on public.breeds
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- 분양글 (삭제는 deleted_at 으로만)
create policy "visible posts or own or admin" on public.posts
  for select to anon, authenticated
  using (
    (deleted_at is null and visibility = 'visible')
    or author_id = (select auth.uid())
    or (select public.is_admin())
  );
create policy "verified users create posts" on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.is_verified_user((select auth.uid())))
    and (select public.can_act((select auth.uid())))
  );
create policy "authors update own posts" on public.posts
  for update to authenticated
  using (
    (author_id = (select auth.uid()) and deleted_at is null and (select public.can_act((select auth.uid()))))
    or (select public.is_admin())
  )
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
revoke delete on public.posts from anon, authenticated;

create policy "media follows post visibility" on public.post_media
  for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "authors manage media" on public.post_media
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

create policy "own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "remove own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

-- 구독과 결제 (기록은 서버만)
create policy "own subscriptions or admin" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.subscriptions from anon, authenticated;

create policy "own payments or admin" on public.payments
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.payments from anon, authenticated;

create policy "own payment consents" on public.payment_consents
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "insert own payment consents" on public.payment_consents
  for insert to authenticated with check (user_id = (select auth.uid()) and payment_id is null);
revoke update, delete on public.payment_consents from anon, authenticated;

create policy "own refunds or admin" on public.refunds
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.refunds from anon, authenticated;

-- 채팅 (생성과 전송은 함수로만)
create policy "participants read rooms" on public.chat_rooms
  for select to authenticated
  using ((select auth.uid()) in (adopter_id, rehomer_id) or (select public.is_admin()));
revoke insert, update, delete on public.chat_rooms from anon, authenticated;

create policy "participants read messages" on public.messages
  for select to authenticated
  using (
    (
      exists (
        select 1 from public.chat_rooms r
        where r.id = room_id and (select auth.uid()) in (r.adopter_id, r.rehomer_id)
      )
      and (not is_blocked or sender_id = (select auth.uid()))
    )
    or (select public.is_admin())
  );
revoke insert, update, delete on public.messages from anon, authenticated;

create policy "own blocks" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "add own blocks" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "remove own blocks" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

create policy "participants read adoptions" on public.adoptions
  for select to authenticated
  using ((select auth.uid()) in (adopter_id, rehomer_id) or (select public.is_admin()));
revoke insert, update, delete on public.adoptions from anon, authenticated;

-- 운영
create policy "own reports or admin" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "create own reports" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open' and handled_by is null);
revoke update, delete on public.reports from anon, authenticated;

create policy "own sanctions or admin" on public.sanctions
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.sanctions from anon, authenticated;

create policy "admin manages banned words" on public.banned_words
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin reads notifications" on public.notification_logs
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.notification_logs from anon, authenticated;

create policy "admin reads admin logs" on public.admin_logs
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.admin_logs from anon, authenticated;

-- 실시간 채팅
alter publication supabase_realtime add table public.messages, public.chat_rooms;

-- 파일 저장소
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('post-media', 'post-media', true, 52428800,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('chat-media', 'chat-media', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "verified users upload post media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_verified_user((select auth.uid())))
  );
create policy "owners delete post media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "participants upload chat media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-media'
    and exists (
      select 1 from public.chat_rooms r
      where r.id::text = (storage.foldername(name))[1]
        and (select auth.uid()) in (r.adopter_id, r.rehomer_id)
    )
  );
create policy "participants read chat media" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-media'
    and (
      exists (
        select 1 from public.chat_rooms r
        where r.id::text = (storage.foldername(name))[1]
          and (select auth.uid()) in (r.adopter_id, r.rehomer_id)
      )
      or (select public.is_admin())
    )
  );
