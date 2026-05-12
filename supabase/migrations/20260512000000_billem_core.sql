create table if not exists public.payment_gateway_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  gateway_id text not null,
  encrypted_credentials jsonb not null,
  configured_fields text[] not null default '{}',
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, gateway_id)
);

alter table public.payment_gateway_connections enable row level security;

create policy "Users can read own gateway connection metadata"
on public.payment_gateway_connections
for select
using (auth.uid() = user_id);

create policy "Service role can manage gateway connections"
on public.payment_gateway_connections
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.invoice_payment_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null,
  gateway text not null,
  event_type text not null,
  amount integer,
  currency text,
  raw_event jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.invoice_payment_events enable row level security;

create policy "Service role can manage invoice payment events"
on public.invoice_payment_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
