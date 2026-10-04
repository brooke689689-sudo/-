-- 조회수·찜 수는 회원 수정으로 바꿀 수 없게 막아 두었으므로, 집계 함수만 시스템 권한으로 갱신
create or replace function public.favorites_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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

revoke execute on function public.favorites_count() from public, anon, authenticated;
grant execute on function public.increment_view(uuid) to anon, authenticated;
