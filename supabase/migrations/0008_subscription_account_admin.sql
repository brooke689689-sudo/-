-- 테스트 모드, 구독 관리, 환불, 탈퇴, 관리자 보강

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "admin reads settings" on public.app_settings
  for select to authenticated using ((select public.is_admin()));
create policy "admin updates settings" on public.app_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
revoke insert, delete on public.app_settings from anon, authenticated;

-- 출시 전 반드시 false 로 변경 (실제 PortOne 결제·본인인증 연결 후)
insert into public.app_settings (key, value) values ('test_mode', 'true'::jsonb);

create or replace function public.is_test_mode()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select value = 'true'::jsonb from public.app_settings where key = 'test_mode'), false);
$$;

alter table public.profiles add column withdrawn_at timestamptz;

-- 관리자 권한은 2단계 인증(aal2) 세션에서만
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
  ) and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

create or replace function public.can_act(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.account_status s
    join public.profiles p on p.id = s.user_id
    where s.user_id = p_user
      and p.withdrawn_at is null
      and (s.status = 'active'
        or (s.status = 'suspended' and s.suspended_until is not null and s.suspended_until <= now()))
  );
$$;

-- 테스트 본인인증 (test_mode 에서만)
create or replace function public.test_verify_identity(p_birth_year int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_ci text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_test_mode() then
    raise exception 'TEST_MODE_OFF';
  end if;
  if p_birth_year is null or p_birth_year < 1900 or p_birth_year > extract(year from now())::int then
    raise exception 'INVALID_BIRTH_YEAR';
  end if;
  v_ci := 'test_' || v_uid::text;
  if exists (select 1 from public.banned_identities where ci_hash = v_ci) then
    raise exception 'BANNED_IDENTITY';
  end if;
  insert into public.identity_verifications (user_id, provider, ci_hash, phone, birth_year)
  values (v_uid, 'test', v_ci, '010-0000-0000', p_birth_year)
  on conflict (user_id) do update set birth_year = excluded.birth_year, verified_at = now();
  update public.profiles set is_verified = true where id = v_uid;
end;
$$;

-- 구독 시작 (test_mode 에서만 즉시 결제 완료 처리. 실제 결제는 서버가 PortOne 확인 후 기록)
create or replace function public.test_start_subscription(
  p_auto_billing boolean, p_no_refund_after_chat boolean, p_free_rehoming boolean, p_notice_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_birth int;
  v_sub uuid;
  v_payment uuid;
  v_start timestamptz := now();
  v_end timestamptz := now() + interval '1 month';
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_test_mode() then
    raise exception 'TEST_MODE_OFF';
  end if;
  if not (coalesce(p_auto_billing, false) and coalesce(p_no_refund_after_chat, false) and coalesce(p_free_rehoming, false)) then
    raise exception 'CONSENT_REQUIRED';
  end if;
  if not public.is_verified_user(v_uid) then
    raise exception 'VERIFICATION_REQUIRED';
  end if;
  if not public.can_act(v_uid) then
    raise exception 'ACCOUNT_RESTRICTED';
  end if;
  select birth_year into v_birth from public.identity_verifications where user_id = v_uid;
  if v_birth is not null and extract(year from now() at time zone 'Asia/Seoul')::int - v_birth < 19 then
    raise exception 'UNDER_19';
  end if;
  if exists (select 1 from public.subscriptions where user_id = v_uid and status in ('active', 'past_due')) then
    raise exception 'ALREADY_SUBSCRIBED';
  end if;

  insert into public.subscriptions (user_id, status, billing_key, price, current_period_start, current_period_end)
  values (v_uid, 'active', 'test', 5900, v_start, v_end)
  returning id into v_sub;

  insert into public.payments (user_id, subscription_id, amount, status, pg_payment_id, period_start, period_end, paid_at)
  values (v_uid, v_sub, 5900, 'paid', 'test_' || gen_random_uuid()::text, v_start, v_end, now())
  returning id into v_payment;

  insert into public.payment_consents (user_id, payment_id, agreed_auto_billing, agreed_no_refund_after_chat, agreed_free_rehoming, notice_version)
  values (v_uid, v_payment, true, true, true, p_notice_version);

  return v_sub;
end;
$$;

create or replace function public.cancel_subscription()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.subscriptions set cancel_at_period_end = true, canceled_at = now()
  where user_id = (select auth.uid()) and status = 'active' and not cancel_at_period_end;
$$;

create or replace function public.resume_subscription()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.subscriptions set cancel_at_period_end = false, canceled_at = null
  where user_id = (select auth.uid()) and status = 'active' and cancel_at_period_end and current_period_end > now();
$$;

-- 환불 요청: 단순 변심/실수는 자동 판단, 중복 결제·시스템 오류는 관리자 확인
create or replace function public.request_refund(p_payment_id uuid, p_reason public.refund_reason, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_payment public.payments;
  v_elig jsonb;
  v_refund uuid;
begin
  select * into v_payment from public.payments where id = p_payment_id and user_id = v_uid for update;
  if not found or v_payment.status <> 'paid' then
    raise exception 'NOT_FOUND';
  end if;
  if exists (select 1 from public.refunds where payment_id = p_payment_id) then
    raise exception 'ALREADY_REQUESTED';
  end if;
  if not public.can_act(v_uid) then
    raise exception 'ACCOUNT_RESTRICTED';
  end if;

  if p_reason = 'mistake' then
    v_elig := public.refund_eligibility(p_payment_id);
    if not coalesce((v_elig ->> 'eligible')::boolean, false) then
      raise exception 'REFUND_%', v_elig ->> 'reason';
    end if;
  end if;

  insert into public.refunds (payment_id, user_id, reason, note)
  values (p_payment_id, v_uid, p_reason, left(p_note, 500))
  returning id into v_refund;

  if p_reason = 'mistake' and public.is_test_mode() then
    update public.refunds set status = 'completed', processed_at = now() where id = v_refund;
    update public.payments set status = 'refunded', refunded_at = now() where id = p_payment_id;
    update public.subscriptions set status = 'expired', current_period_end = least(current_period_end, now())
    where id = v_payment.subscription_id;
    return jsonb_build_object('status', 'completed');
  end if;

  return jsonb_build_object('status', 'requested');
end;
$$;

create or replace function public.admin_process_refund(p_refund_id uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refund public.refunds;
  v_payment public.payments;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;
  select * into v_refund from public.refunds where id = p_refund_id and status = 'requested' for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  select * into v_payment from public.payments where id = v_refund.payment_id;

  if p_approve then
    update public.refunds set status = 'completed', processed_at = now(), note = coalesce(p_note, note) where id = p_refund_id;
    update public.payments set status = 'refunded', refunded_at = now() where id = v_refund.payment_id;
    if v_refund.reason = 'mistake' then
      update public.subscriptions set status = 'expired', current_period_end = least(current_period_end, now())
      where id = v_payment.subscription_id;
    end if;
  else
    update public.refunds set status = 'rejected', processed_at = now(), note = coalesce(p_note, note) where id = p_refund_id;
  end if;

  perform public.admin_log('refund', 'refund', p_refund_id::text,
    jsonb_build_object('approve', p_approve, 'note', p_note, 'amount', v_payment.amount));
end;
$$;

-- 탈퇴: 글 숨김, 구독 해지 예약. 채팅은 6개월, 결제 기록은 5년 뒤 삭제
create or replace function public.withdraw_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  perform set_config('anajum.system', 'on', true);
  update public.posts set deleted_at = now() where author_id = v_uid and deleted_at is null;
  perform set_config('anajum.system', 'off', true);
  update public.subscriptions set cancel_at_period_end = true, canceled_at = coalesce(canceled_at, now())
  where user_id = v_uid and status in ('active', 'past_due');
  delete from public.favorites where user_id = v_uid;
  update public.profiles set withdrawn_at = now(), nickname = null, is_verified = false where id = v_uid;
end;
$$;

create or replace function public.purge_withdrawn()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.chat_rooms r
  using public.profiles p
  where p.withdrawn_at < now() - interval '6 months'
    and p.id in (r.adopter_id, r.rehomer_id);
  delete from auth.users u
  using public.profiles p
  where p.id = u.id and p.withdrawn_at < now() - interval '5 years';
end;
$$;

-- 테스트 모드 자동 갱신 (실제 결제는 PortOne 정기결제가 대신함)
create or replace function public.renew_test_subscriptions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.subscriptions;
begin
  if not public.is_test_mode() then
    return;
  end if;
  for v_sub in
    select * from public.subscriptions
    where status = 'active' and not cancel_at_period_end and billing_key = 'test' and current_period_end <= now()
    for update
  loop
    update public.subscriptions
    set current_period_start = v_sub.current_period_end,
        current_period_end = v_sub.current_period_end + interval '1 month'
    where id = v_sub.id;
    insert into public.payments (user_id, subscription_id, amount, status, pg_payment_id, period_start, period_end, paid_at)
    values (v_sub.user_id, v_sub.id, v_sub.price, 'paid', 'test_' || gen_random_uuid()::text,
            v_sub.current_period_end, v_sub.current_period_end + interval '1 month', now());
  end loop;
end;
$$;

-- 관리자 모니터링
create or replace function public.admin_monitoring()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;
  return jsonb_build_object(
    'adoptions', coalesce((
      select jsonb_agg(x order by x.cnt desc) from (
        select u.uid as user_id, p.nickname, count(*) as cnt
        from public.adoptions a
        cross join lateral (values (a.adopter_id), (a.rehomer_id)) as u(uid)
        join public.profiles p on p.id = u.uid
        where a.completed_at > now() - interval '90 days'
        group by u.uid, p.nickname
        having count(*) >= 3
      ) x), '[]'::jsonb),
    'posts', coalesce((
      select jsonb_agg(x order by x.cnt desc) from (
        select po.author_id as user_id, p.nickname, count(*) as cnt
        from public.posts po join public.profiles p on p.id = po.author_id
        where po.created_at > now() - interval '30 days'
        group by po.author_id, p.nickname
        having count(*) >= 5
      ) x), '[]'::jsonb),
    'quota', coalesce((
      select jsonb_agg(x order by x.period_cnt desc) from (
        select r.adopter_id as user_id, p.nickname,
               count(*) filter (where r.created_at >= public.kst_day_start()) as today_cnt,
               count(*) as period_cnt
        from public.chat_rooms r join public.profiles p on p.id = r.adopter_id
        where r.created_at > now() - interval '31 days'
        group by r.adopter_id, p.nickname
        having count(*) filter (where r.created_at >= public.kst_day_start()) >= 20 or count(*) >= 150
      ) x), '[]'::jsonb)
  );
end;
$$;

-- 설정 변경 기록
create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := coalesce(to_jsonb(new), to_jsonb(old));
begin
  insert into public.admin_logs (admin_id, action, target_type, target_id, detail)
  values ((select auth.uid()), lower(tg_op), tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'key'),
          jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  return coalesce(new, old);
end;
$$;

create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.audit_admin_change();
create trigger breeds_audit after insert or update or delete on public.breeds
  for each row execute function public.audit_admin_change();
create trigger banned_words_audit after insert or update or delete on public.banned_words
  for each row execute function public.audit_admin_change();
create trigger app_settings_audit after insert or update or delete on public.app_settings
  for each row execute function public.audit_admin_change();

revoke execute on function public.purge_withdrawn() from public, anon, authenticated;
revoke execute on function public.renew_test_subscriptions() from public, anon, authenticated;
revoke execute on function public.audit_admin_change() from public, anon, authenticated;
grant execute on function public.is_test_mode() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_act(uuid) to authenticated;
grant execute on function public.test_verify_identity(int) to authenticated;
grant execute on function public.test_start_subscription(boolean, boolean, boolean, text) to authenticated;
grant execute on function public.cancel_subscription() to authenticated;
grant execute on function public.resume_subscription() to authenticated;
grant execute on function public.request_refund(uuid, public.refund_reason, text) to authenticated;
grant execute on function public.admin_process_refund(uuid, boolean, text) to authenticated;
grant execute on function public.withdraw_account() to authenticated;
grant execute on function public.admin_monitoring() to authenticated;

select cron.schedule('purge-withdrawn', '30 18 * * *', 'select public.purge_withdrawn()');
select cron.schedule('renew-test-subscriptions', '*/30 * * * *', 'select public.renew_test_subscriptions()');
