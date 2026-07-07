alter table public.published_contents
  add column if not exists devto_article_id bigint,
  add column if not exists devto_url text;

create index if not exists published_contents_devto_article_id_idx
  on public.published_contents (devto_article_id)
  where devto_article_id is not null;
