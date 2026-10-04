-- anajum.system 미설정 시 NULL이 되어 일반 사용자 검사가 건너뛰어지던 문제 수정
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
