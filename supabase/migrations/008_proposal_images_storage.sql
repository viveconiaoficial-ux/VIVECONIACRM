-- Imágenes ligadas al envío de la propuesta (rutas relativas en Storage)
alter table leads add column if not exists proposal_image_paths text[];

comment on column leads.proposal_image_paths is
  'Rutas en bucket proposal-images, ej. "{lead_id}/{uuid}.jpg". Orden = orden de visualización.';

update leads
set proposal_image_paths = array[]::text[]
where proposal_image_paths is null;

alter table leads
  alter column proposal_image_paths set default array[]::text[],
  alter column proposal_image_paths set not null;

-- Bucket público ligero (~768 KiB objeto; tipos típicos de capturas optimizadas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proposal-images',
  'proposal-images',
  true,
  786432,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Políticas (mismo modelo que desarrollo CRM con anon): restringir en producción con auth.uid()
drop policy if exists "proposal_images_select" on storage.objects;
drop policy if exists "proposal_images_insert" on storage.objects;
drop policy if exists "proposal_images_update" on storage.objects;
drop policy if exists "proposal_images_delete" on storage.objects;

create policy "proposal_images_select"
  on storage.objects for select
  using (bucket_id = 'proposal-images');

create policy "proposal_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'proposal-images');

create policy "proposal_images_update"
  on storage.objects for update
  using (bucket_id = 'proposal-images');

create policy "proposal_images_delete"
  on storage.objects for delete
  using (bucket_id = 'proposal-images');
