-- Storage remove()는 SELECT 권한도 필요함 (본인 폴더만)
create policy "owners read own post media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
