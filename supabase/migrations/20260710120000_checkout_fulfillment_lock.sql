alter table public.campaign_checkouts
  add column if not exists fulfillment_started_at timestamptz;

create index if not exists campaign_checkouts_fulfillment_started_at_idx
  on public.campaign_checkouts (fulfillment_started_at)
  where fulfillment_started_at is not null;
