-- Kampanya ödeme oturumları (iyzico Checkout Form)
create table if not exists public.campaign_checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text not null,
  city text not null,
  daily_budget numeric(12, 2) not null,
  days integer not null,
  total_cost numeric(12, 2) not null,
  conversation_id text not null unique,
  iyzico_token text,
  payment_id text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  campaign_id uuid references public.campaigns(id) on delete set null,
  content_slug text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists campaign_checkouts_user_id_idx
  on public.campaign_checkouts (user_id);

create index if not exists campaign_checkouts_payment_status_idx
  on public.campaign_checkouts (payment_status);

create index if not exists campaign_checkouts_iyzico_token_idx
  on public.campaign_checkouts (iyzico_token)
  where iyzico_token is not null;

alter table public.campaign_checkouts enable row level security;

drop policy if exists "Users read own campaign checkouts" on public.campaign_checkouts;
create policy "Users read own campaign checkouts"
  on public.campaign_checkouts
  for select
  using (auth.uid() = user_id);
