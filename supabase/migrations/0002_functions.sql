-- 안아줌 핵심 규칙 함수와 트리거

-- 가입 시 회원 행 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.account_status (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.account_status where user_id = (select auth.uid())),
    false
  );
$$;

-- 정지 기간이 지났으면 자동으로 이용 가능
create or replace function public.can_act(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.account_status s
    where s.user_id = p_user
      and (s.status = 'active'
        or (s.status = 'suspended' and s.suspended_until is not null and s.suspended_until <= now()))
  );
$$;

create or replace function public.is_verified_user(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = p_user and is_verified);
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();
create trigger account_status_touch before update on public.account_status
  for each row execute function public.touch_updated_at();

-- 금지어 검사: 차단이 경고보다 우선
create or replace function public.text_violation(p_text text, p_scope public.word_scope)
returns table (action public.word_action, label text)
language sql
stable
security definer
set search_path = ''
as $$
  with t as (
    select lower(coalesce(p_text, '')) as raw,
           regexp_replace(lower(coalesce(p_text, '')), '[\s\-\.\_]', '', 'g') as compact
  )
  select bw.action, bw.label
  from public.banned_words bw, t
  where (bw.scope = 'all' or bw.scope = p_scope)
    and (
      (bw.is_regex and (t.raw ~* bw.pattern or t.compact ~* bw.pattern))
      or (not bw.is_regex and (position(lower(bw.pattern) in t.raw) > 0
                               or position(lower(bw.pattern) in t.compact) > 0))
    )
  order by (bw.action = 'block') desc, bw.id
  limit 1;
$$;

create or replace function public.check_text(p_text text, p_scope public.word_scope)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('action', v.action, 'label', v.label)
       from public.text_violation(p_text, p_scope) v),
    jsonb_build_object('action', 'ok')
  );
$$;

-- 동물등록번호는 가려진 형태로만 저장
create or replace function public.mask_registration(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_value is null or btrim(p_value) = '' then null
    when position('*' in p_value) > 0 then p_value
    else (
      with d as (select regexp_replace(p_value, '\D', '', 'g') as n)
      select case
        when char_length(n) <= 6 then repeat('*', char_length(n))
        else left(n, 3) || repeat('*', char_length(n) - 6) || right(n, 3)
      end
      from d
    )
  end;
$$;

-- 분양글 저장 전 검사
create or replace function public.posts_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin boolean := public.is_admin()
    or (select auth.uid()) is null
    or coalesce(current_setting('anajum.system', true), '') = 'on';
  v_breed public.breeds;
  v_violation record;
  v_content_changed boolean;
begin
  if tg_op = 'UPDATE' and not v_admin then
    new.author_id := old.author_id;
    new.visibility := old.visibility;
    new.review_note := old.review_note;
    new.view_count := old.view_count;
    new.favorite_count := old.favorite_count;
    new.created_at := old.created_at;
  end if;

  if tg_op = 'INSERT' and not v_admin then
    new.visibility := 'visible';
    new.review_note := null;
    new.view_count := 0;
    new.favorite_count := 0;
  end if;

  new.registration_no := public.mask_registration(new.registration_no);
  if new.registered <> 'yes' then
    new.registration_no := null;
  end if;

  if new.breed_id is not null then
    select * into v_breed from public.breeds where id = new.breed_id;
    if v_breed.category_id <> new.category_id then
      raise exception 'BREED_CATEGORY_MISMATCH';
    end if;
    if v_breed.is_banned then
      raise exception 'BANNED_SPECIES';
    end if;
    if v_breed.is_cites and not coalesce(new.cites_docs, false) then
      raise exception 'CITES_DOCS_REQUIRED';
    end if;
  end if;

  v_content_changed := tg_op = 'INSERT'
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.reason is distinct from old.reason
    or new.health_note is distinct from old.health_note
    or new.included_items is distinct from old.included_items
    or new.breed_text is distinct from old.breed_text
    or new.breed_id is distinct from old.breed_id;

  if v_content_changed and not v_admin then
    select * into v_violation from public.text_violation(
      concat_ws(' ', new.title, new.description, new.reason, new.health_note, new.included_items, new.breed_text),
      'post'
    );
    if found and v_violation.action = 'block' then
      raise exception 'BANNED_CONTENT:%', v_violation.label;
    end if;
    if found and v_violation.action = 'warn' then
      new.visibility := 'pending_review';
      new.review_note := '금지어 의심: ' || v_violation.label;
    elsif new.breed_id is null or coalesce(v_breed.requires_review, false) then
      if tg_op = 'INSERT' or new.breed_id is distinct from old.breed_id or new.breed_text is distinct from old.breed_text then
        new.visibility := 'pending_review';
        new.review_note := '목록 외 동물 검토';
      end if;
    end if;
  end if;

  if new.status = 'adopted' and (tg_op = 'INSERT' or old.status <> 'adopted') then
    new.adopted_at := now();
  elsif new.status = 'active' then
    new.adopted_at := null;
  end if;

  if not new.is_urgent then
    new.urgent_deadline := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_before_write
  before insert or update on public.posts
  for each row execute function public.posts_before_write();

-- 대표사진은 게시글당 하나
create or replace function public.post_media_single_cover()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_cover then
    update public.post_media set is_cover = false
    where post_id = new.post_id and id <> new.id and is_cover;
  end if;
  return new;
end;
$$;

create trigger post_media_single_cover
  after insert or update of is_cover on public.post_media
  for each row when (new.is_cover)
  execute function public.post_media_single_cover();

-- 찜 수 집계
create or replace function public.favorites_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 일반 회원 수정에서는 찜 수를 건드리지 못하므로 시스템 권한으로 갱신
  perform set_config('anajum.system', 'on', true);
  if tg_op = 'INSERT' then
    update public.posts set favorite_count = favorite_count + 1 where id = new.post_id;
    return new;
  else
    update public.posts set favorite_count = greatest(favorite_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end;
$$;

create trigger favorites_count
  after insert or delete on public.favorites
  for each row execute function public.favorites_count();

create or replace function public.increment_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('anajum.system', 'on', true);
  update public.posts set view_count = view_count + 1
  where id = p_post_id and visibility = 'visible' and deleted_at is null;
end;
$$;

-- 분양자가 "아직 분양 중" 확인
create or replace function public.confirm_post_active(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('anajum.system', 'on', true);
  update public.posts
  set last_confirmed_at = now(),
      visibility = case when review_note = '장기 미확인' then 'visible'::public.visibility else visibility end,
      review_note = case when review_note = '장기 미확인' then null else review_note end
  where id = p_post_id and author_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'POST_NOT_FOUND';
  end if;
  perform set_config('anajum.system', 'off', true);
end;
$$;

create or replace function public.enqueue_notification(p_user uuid, p_template text, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_logs (user_id, template, payload)
  values (p_user, p_template, coalesce(p_payload, '{}'::jsonb));
$$;

-- 구독과 채팅방 한도
create or replace function public.live_subscription(p_user uuid)
returns public.subscriptions
language sql
stable
security definer
set search_path = ''
as $$
  select s.* from public.subscriptions s
  where s.user_id = p_user
    and s.status = 'active'
    and now() >= s.current_period_start
    and now() < s.current_period_end
  limit 1;
$$;

create or replace function public.kst_day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
$$;

create or replace function public.chat_quota()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_sub public.subscriptions;
  v_today int;
  v_period int := 0;
begin
  if v_uid is null then
    return null;
  end if;
  v_sub := public.live_subscription(v_uid);
  select count(*) into v_today from public.chat_rooms
    where adopter_id = v_uid and created_at >= public.kst_day_start();
  if v_sub.id is not null then
    select count(*) into v_period from public.chat_rooms
      where adopter_id = v_uid and created_at >= v_sub.current_period_start;
  end if;
  return jsonb_build_object(
    'subscribed', v_sub.id is not null,
    'today_used', v_today,
    'today_limit', 20,
    'period_used', v_period,
    'period_limit', 200,
    'period_end', v_sub.current_period_end,
    'cancel_at_period_end', coalesce(v_sub.cancel_at_period_end, false)
  );
end;
$$;

create or replace function public.create_chat_room(p_post_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_post public.posts;
  v_room uuid;
  v_sub public.subscriptions;
  v_payment uuid;
  v_today int;
  v_period int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_post from public.posts where id = p_post_id;
  if not found or v_post.deleted_at is not null or v_post.visibility <> 'visible' then
    raise exception 'POST_NOT_FOUND';
  end if;

  select id into v_room from public.chat_rooms where post_id = p_post_id and adopter_id = v_uid;
  if found then
    return v_room;
  end if;

  if v_post.author_id = v_uid then
    raise exception 'OWN_POST';
  end if;
  if v_post.status <> 'active' then
    raise exception 'POST_ADOPTED';
  end if;
  if not public.is_verified_user(v_uid) then
    raise exception 'VERIFICATION_REQUIRED';
  end if;
  if not public.can_act(v_uid) then
    raise exception 'ACCOUNT_RESTRICTED';
  end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = v_uid and blocked_id = v_post.author_id)
       or (blocker_id = v_post.author_id and blocked_id = v_uid)
  ) then
    raise exception 'BLOCKED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  v_sub := public.live_subscription(v_uid);
  if v_sub.id is null then
    raise exception 'SUBSCRIPTION_REQUIRED';
  end if;

  select id into v_payment from public.payments
    where subscription_id = v_sub.id and status = 'paid'
      and period_start <= now() and now() < period_end
    order by paid_at desc
    limit 1;

  select count(*) into v_today from public.chat_rooms
    where adopter_id = v_uid and created_at >= public.kst_day_start();
  if v_today >= 20 then
    raise exception 'DAILY_LIMIT';
  end if;

  select count(*) into v_period from public.chat_rooms
    where adopter_id = v_uid and created_at >= v_sub.current_period_start;
  if v_period >= 200 then
    raise exception 'PERIOD_LIMIT';
  end if;

  insert into public.chat_rooms (post_id, adopter_id, rehomer_id, payment_id)
  values (p_post_id, v_uid, v_post.author_id, v_payment)
  returning id into v_room;

  return v_room;
end;
$$;

create or replace function public.send_message(p_room_id uuid, p_body text, p_image_path text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.chat_rooms;
  v_other uuid;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_violation record;
  v_id bigint;
  v_status text := 'sent';
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_room from public.chat_rooms where id = p_room_id;
  if not found or v_uid not in (v_room.adopter_id, v_room.rehomer_id) then
    raise exception 'NOT_PARTICIPANT';
  end if;
  if v_body is null and p_image_path is null then
    raise exception 'EMPTY_MESSAGE';
  end if;
  if p_image_path is not null and split_part(p_image_path, '/', 1) <> p_room_id::text then
    raise exception 'INVALID_IMAGE_PATH';
  end if;
  if not public.can_act(v_uid) then
    raise exception 'ACCOUNT_RESTRICTED';
  end if;

  v_other := case when v_uid = v_room.adopter_id then v_room.rehomer_id else v_room.adopter_id end;
  if exists (
    select 1 from public.blocks
    where (blocker_id = v_uid and blocked_id = v_other) or (blocker_id = v_other and blocked_id = v_uid)
  ) then
    raise exception 'BLOCKED';
  end if;

  if v_body is not null then
    select * into v_violation from public.text_violation(v_body, 'chat');
    if found and v_violation.action = 'block' then
      insert into public.messages (room_id, sender_id, body, is_blocked, flag_reason)
      values (p_room_id, v_uid, v_body, true, v_violation.label)
      returning id into v_id;
      return jsonb_build_object('status', 'blocked', 'id', v_id, 'label', v_violation.label);
    end if;
    if found and v_violation.action = 'warn' then
      v_status := 'warned';
    end if;
  end if;

  insert into public.messages (room_id, sender_id, body, image_path, flag_reason)
  values (p_room_id, v_uid, v_body, p_image_path,
          case when v_status = 'warned' then v_violation.label end)
  returning id into v_id;

  update public.chat_rooms
  set last_message_at = now(),
      last_message_preview = coalesce(left(v_body, 80), '사진'),
      first_message_at = coalesce(first_message_at, now()),
      adopter_last_read_at = case when v_uid = adopter_id then now() else adopter_last_read_at end,
      rehomer_last_read_at = case when v_uid = rehomer_id then now() else rehomer_last_read_at end
  where id = p_room_id;

  if not v_room.first_message_notified then
    update public.chat_rooms set first_message_notified = true where id = p_room_id;
    perform public.enqueue_notification(v_room.rehomer_id, 'first_chat_rehomer',
      jsonb_build_object('room_id', p_room_id, 'post_id', v_room.post_id));
    perform public.enqueue_notification(v_room.adopter_id, 'first_chat_adopter',
      jsonb_build_object('room_id', p_room_id, 'post_id', v_room.post_id));
  end if;

  return jsonb_build_object('status', v_status, 'id', v_id,
    'label', case when v_status = 'warned' then v_violation.label end);
end;
$$;

create or replace function public.mark_room_read(p_room_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.chat_rooms
  set adopter_last_read_at = case when adopter_id = (select auth.uid()) then now() else adopter_last_read_at end,
      rehomer_last_read_at = case when rehomer_id = (select auth.uid()) then now() else rehomer_last_read_at end
  where id = p_room_id and (select auth.uid()) in (adopter_id, rehomer_id);
$$;

-- 입양 확정 (양쪽 모두 확정 시 완료)
create or replace function public.confirm_adoption(p_room_id uuid, p_agree_pledge boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.chat_rooms;
  v_post public.posts;
  v_adoption public.adoptions;
begin
  select * into v_room from public.chat_rooms where id = p_room_id;
  if not found or v_uid not in (v_room.adopter_id, v_room.rehomer_id) then
    raise exception 'NOT_PARTICIPANT';
  end if;

  select * into v_post from public.posts where id = v_room.post_id for update;
  if v_post.status = 'adopted' and not exists (
    select 1 from public.adoptions where room_id = p_room_id and completed_at is not null
  ) then
    raise exception 'POST_ADOPTED';
  end if;

  insert into public.adoptions (room_id, post_id, rehomer_id, adopter_id)
  values (p_room_id, v_room.post_id, v_room.rehomer_id, v_room.adopter_id)
  on conflict (room_id) do nothing;

  if v_uid = v_room.rehomer_id then
    update public.adoptions set rehomer_confirmed_at = coalesce(rehomer_confirmed_at, now())
    where room_id = p_room_id;
  else
    if not p_agree_pledge then
      raise exception 'PLEDGE_REQUIRED';
    end if;
    update public.adoptions
    set adopter_confirmed_at = coalesce(adopter_confirmed_at, now()), adopter_agreed_pledge = true
    where room_id = p_room_id;
  end if;

  select * into v_adoption from public.adoptions where room_id = p_room_id;

  if v_adoption.completed_at is null
     and v_adoption.rehomer_confirmed_at is not null
     and v_adoption.adopter_confirmed_at is not null then
    update public.adoptions set completed_at = now() where room_id = p_room_id
    returning * into v_adoption;
    update public.posts set status = 'adopted' where id = v_room.post_id;
    perform public.enqueue_notification(v_room.adopter_id, 'adoption_completed_adopter',
      jsonb_build_object('post_id', v_room.post_id));
    perform public.enqueue_notification(v_room.rehomer_id, 'adoption_completed_rehomer',
      jsonb_build_object('post_id', v_room.post_id));
  end if;

  return jsonb_build_object(
    'rehomer_confirmed', v_adoption.rehomer_confirmed_at is not null,
    'adopter_confirmed', v_adoption.adopter_confirmed_at is not null,
    'completed', v_adoption.completed_at is not null
  );
end;
$$;

-- 환불 가능 여부: 결제 후 7일 이내 + 그 결제 기간에 만든 채팅방 0개
create or replace function public.refund_eligibility(p_payment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_rooms int;
begin
  select * into v_payment from public.payments where id = p_payment_id;
  if not found or (v_payment.user_id <> (select auth.uid()) and not public.is_admin() and (select auth.uid()) is not null) then
    return jsonb_build_object('eligible', false, 'reason', 'NOT_FOUND');
  end if;
  if v_payment.status <> 'paid' then
    return jsonb_build_object('eligible', false, 'reason', 'NOT_PAID');
  end if;
  if exists (select 1 from public.refunds where payment_id = p_payment_id and status <> 'rejected') then
    return jsonb_build_object('eligible', false, 'reason', 'ALREADY_REQUESTED');
  end if;
  if now() > v_payment.paid_at + interval '7 days' then
    return jsonb_build_object('eligible', false, 'reason', 'EXPIRED');
  end if;
  select count(*) into v_rooms from public.chat_rooms
    where adopter_id = v_payment.user_id
      and (payment_id = p_payment_id
        or (created_at >= v_payment.period_start and created_at < v_payment.period_end));
  if v_rooms > 0 then
    return jsonb_build_object('eligible', false, 'reason', 'CHAT_USED');
  end if;
  return jsonb_build_object('eligible', true);
end;
$$;

-- 관리자 처리
create or replace function public.admin_log(p_action text, p_target_type text, p_target_id text, p_detail jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_logs (admin_id, action, target_type, target_id, detail)
  values ((select auth.uid()), p_action, p_target_type, p_target_id, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function public.admin_set_post_visibility(p_post_id uuid, p_visibility public.visibility, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;
  update public.posts set visibility = p_visibility, review_note = p_note where id = p_post_id;
  perform public.admin_log('post_visibility', 'post', p_post_id::text,
    jsonb_build_object('visibility', p_visibility, 'note', p_note));
end;
$$;

-- 1회 경고, 2회 7일 정지, 3회 영구정지. 명백한 금전 요구는 즉시 영구정지.
create or replace function public.admin_apply_violation(
  p_user uuid, p_reason text, p_report_id uuid default null, p_severe boolean default false
)
returns public.sanction_type
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
  v_type public.sanction_type;
  v_ends timestamptz;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  select warning_count into v_count from public.account_status where user_id = p_user for update;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if p_severe then
    v_type := 'ban';
  else
    v_count := v_count + 1;
    v_type := case when v_count >= 3 then 'ban' when v_count = 2 then 'suspend_7d' else 'warning' end;
  end if;

  if v_type = 'suspend_7d' then
    v_ends := now() + interval '7 days';
  end if;

  update public.account_status
  set warning_count = v_count,
      status = case v_type when 'ban' then 'banned'::public.user_status
                           when 'suspend_7d' then 'suspended'::public.user_status
                           else status end,
      suspended_until = case when v_type = 'suspend_7d' then v_ends else suspended_until end
  where user_id = p_user;

  insert into public.sanctions (user_id, type, reason, report_id, ends_at, created_by)
  values (p_user, v_type, p_reason, p_report_id, v_ends, (select auth.uid()));

  if v_type = 'ban' then
    insert into public.banned_identities (ci_hash, reason)
    select ci_hash, p_reason from public.identity_verifications where user_id = p_user
    on conflict (ci_hash) do nothing;
    update public.posts set visibility = 'hidden', review_note = '영구정지 회원'
    where author_id = p_user and visibility = 'visible';
  end if;

  perform public.enqueue_notification(p_user, 'sanction_' || v_type::text,
    jsonb_build_object('reason', p_reason, 'ends_at', v_ends));
  perform public.admin_log('sanction', 'user', p_user::text,
    jsonb_build_object('type', v_type, 'reason', p_reason, 'report_id', p_report_id));

  return v_type;
end;
$$;

create or replace function public.admin_lift_sanction(p_user uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;
  update public.account_status set status = 'active', suspended_until = null where user_id = p_user;
  delete from public.banned_identities
  where ci_hash in (select ci_hash from public.identity_verifications where user_id = p_user);
  perform public.admin_log('lift_sanction', 'user', p_user::text, jsonb_build_object('note', p_note));
end;
$$;

create or replace function public.admin_resolve_report(p_report_id uuid, p_status public.report_status, p_resolution text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;
  update public.reports
  set status = p_status, resolution = p_resolution, handled_by = (select auth.uid()), handled_at = now()
  where id = p_report_id;
  perform public.admin_log('resolve_report', 'report', p_report_id::text,
    jsonb_build_object('status', p_status, 'resolution', p_resolution));
end;
$$;

-- 예약 작업
create or replace function public.process_stale_posts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_logs (user_id, template, payload)
  select p.author_id, 'post_confirm', jsonb_build_object('post_id', p.id)
  from public.posts p
  where p.status = 'active' and p.visibility = 'visible' and p.deleted_at is null
    and p.last_confirmed_at < now() - interval '30 days'
    and not exists (
      select 1 from public.notification_logs n
      where n.template = 'post_confirm' and n.payload ->> 'post_id' = p.id::text
        and n.created_at > p.last_confirmed_at
    );

  update public.posts
  set visibility = 'hidden', review_note = '장기 미확인'
  where status = 'active' and visibility = 'visible' and deleted_at is null
    and last_confirmed_at < now() - interval '37 days';
end;
$$;

create or replace function public.queue_renewal_reminders()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_logs (user_id, template, payload)
  select s.user_id, 'renewal_reminder',
         jsonb_build_object('subscription_id', s.id, 'period_end', s.current_period_end, 'amount', s.price)
  from public.subscriptions s
  where s.status = 'active' and not s.cancel_at_period_end
    and s.current_period_end between now() + interval '2 days' and now() + interval '3 days'
    and not exists (
      select 1 from public.notification_logs n
      where n.template = 'renewal_reminder'
        and n.payload ->> 'subscription_id' = s.id::text
        and (n.payload ->> 'period_end')::timestamptz = s.current_period_end
    );
$$;

create or replace function public.expire_canceled_subscriptions()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.subscriptions
  set status = 'expired'
  where status = 'active' and cancel_at_period_end and current_period_end <= now();
$$;

revoke execute on function public.process_stale_posts() from public, anon, authenticated;
revoke execute on function public.queue_renewal_reminders() from public, anon, authenticated;
revoke execute on function public.expire_canceled_subscriptions() from public, anon, authenticated;
revoke execute on function public.enqueue_notification(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_log(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.text_violation(text, public.word_scope) from public, anon, authenticated;
revoke execute on function public.live_subscription(uuid) from public, anon, authenticated;
