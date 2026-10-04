-- 함수 실행 권한 정리
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

revoke execute on function
  public.posts_before_write(),
  public.post_media_single_cover(),
  public.favorites_count(),
  public.touch_updated_at(),
  public.mask_registration(text),
  public.kst_day_start()
from public, anon, authenticated;

revoke execute on function
  public.admin_apply_violation(uuid, text, uuid, boolean),
  public.admin_lift_sanction(uuid, text),
  public.admin_resolve_report(uuid, public.report_status, text),
  public.admin_set_post_visibility(uuid, public.visibility, text),
  public.can_act(uuid),
  public.chat_quota(),
  public.check_text(text, public.word_scope),
  public.confirm_adoption(uuid, boolean),
  public.confirm_post_active(uuid),
  public.create_chat_room(uuid),
  public.is_verified_user(uuid),
  public.mark_room_read(uuid),
  public.refund_eligibility(uuid),
  public.send_message(uuid, text, text)
from public, anon;

grant execute on function
  public.admin_apply_violation(uuid, text, uuid, boolean),
  public.admin_lift_sanction(uuid, text),
  public.admin_resolve_report(uuid, public.report_status, text),
  public.admin_set_post_visibility(uuid, public.visibility, text),
  public.can_act(uuid),
  public.chat_quota(),
  public.check_text(text, public.word_scope),
  public.confirm_adoption(uuid, boolean),
  public.confirm_post_active(uuid),
  public.create_chat_room(uuid),
  public.is_verified_user(uuid),
  public.mark_room_read(uuid),
  public.refund_eligibility(uuid),
  public.send_message(uuid, text, text)
to authenticated;

-- is_admin은 비로그인 게시글 조회 정책에서도 평가되므로 anon 유지
revoke execute on function public.is_admin(), public.increment_view(uuid) from public;
grant execute on function public.is_admin(), public.increment_view(uuid) to anon, authenticated;

-- 외래키 인덱스
create index if not exists admin_logs_admin_idx on public.admin_logs (admin_id);
create index if not exists adoptions_adopter_idx on public.adoptions (adopter_id);
create index if not exists adoptions_post_idx on public.adoptions (post_id);
create index if not exists adoptions_rehomer_idx on public.adoptions (rehomer_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);
create index if not exists consents_user_idx on public.consents (user_id);
create index if not exists favorites_post_idx on public.favorites (post_id);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists notification_logs_user_idx on public.notification_logs (user_id);
create index if not exists payment_consents_payment_idx on public.payment_consents (payment_id);
create index if not exists payment_consents_user_idx on public.payment_consents (user_id);
create index if not exists payments_subscription_idx on public.payments (subscription_id);
create index if not exists posts_breed_idx on public.posts (breed_id);
create index if not exists refunds_user_idx on public.refunds (user_id);
create index if not exists reports_handled_by_idx on public.reports (handled_by);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_target_message_idx on public.reports (target_message_id);
create index if not exists reports_target_post_idx on public.reports (target_post_id);
create index if not exists reports_target_user_idx on public.reports (target_user_id);
create index if not exists sanctions_created_by_idx on public.sanctions (created_by);
create index if not exists sanctions_report_idx on public.sanctions (report_id);
create index if not exists sanctions_user_idx on public.sanctions (user_id);

-- 중복 SELECT 정책 정리
drop policy "admin manages categories" on public.categories;
create policy "admin inserts categories" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "admin updates categories" on public.categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes categories" on public.categories for delete to authenticated using ((select public.is_admin()));

drop policy "admin manages breeds" on public.breeds;
create policy "admin inserts breeds" on public.breeds for insert to authenticated with check ((select public.is_admin()));
create policy "admin updates breeds" on public.breeds for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes breeds" on public.breeds for delete to authenticated using ((select public.is_admin()));

drop policy "authors manage media" on public.post_media;
create policy "authors insert media" on public.post_media for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "authors update media" on public.post_media for update to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "authors delete media" on public.post_media for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
