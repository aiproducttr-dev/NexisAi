alter table public.published_contents
  add column if not exists wordpress_post_id bigint,
  add column if not exists wordpress_url text;

create index if not exists published_contents_wordpress_post_id_idx
  on public.published_contents (wordpress_post_id)
  where wordpress_post_id is not null;
