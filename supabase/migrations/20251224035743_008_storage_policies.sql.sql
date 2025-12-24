-- Authenticated can read media for public posts

create policy "Authenticated can read media for public posts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pet_media'
  and exists (
    select 1
    from public.posts p
    where p.storage_bucket = bucket_id
      and p.storage_path = name
      and p.visibility = 'public'
  )
);
