-- ============================================================================
-- Prince Group Marriage Registration — Supabase schema
-- Paste into the Supabase SQL editor and run once.
-- Tables: customers, marriage_details, payments, documents,
--         registration_status, staff, notifications
-- Storage: private bucket 'marriage-documents' + signed-URL upload/download RLS
-- ============================================================================

-- Optional: guaranteed UUID extension (enabled on all Supabase projects by
-- default; keeping for clarity).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  registration_id  text not null unique,
  bride_name       text default '',
  groom_name       text default '',
  mobile           text default '',
  whatsapp         text default '',
  district         text default '',
  state            text default 'Tamil Nadu',
  city             text default '',
  lang             text default 'en',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- marriage_details
-- ---------------------------------------------------------------------------
create table if not exists public.marriage_details (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id) on delete cascade,
  groom_age      text default '',
  bride_age      text default '',
  groom_contact  text default '',
  bride_contact  text default '',
  groom_occupation text default '',
  bride_occupation text default '',
  groom_village  text default '',
  bride_village  text default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','paid','failed')),
  amount      numeric(10,2) not null default 99.00,
  method      text default '',
  reference   text default '',
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  doc_key      text not null,
  file_name    text default '',
  size         bigint default 0,
  mime_type    text default '',
  storage_path text default '',
  uploaded_at  timestamptz not null default now(),
  unique (customer_id, doc_key)
);

-- ---------------------------------------------------------------------------
-- registration_status  (workflow: new -> payment_completed ->
--                        documents_uploaded -> verification -> processing ->
--                        completed)
-- ---------------------------------------------------------------------------
create table if not exists public.registration_status (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  status      text not null default 'new',
  note        text default '',
  changed_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  role      text default '',
  email     text default '',
  phone     text default '',
  active    boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- notifications  (admin WhatsApp + customer WhatsApp automation placeholder)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  type        text default 'customer' check (type in ('admin','customer')),
  channel     text default 'whatsapp',
  payload     jsonb,
  sent_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger (customers / marriage_details)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_marriage_details_updated on public.marriage_details;
create trigger trg_marriage_details_updated
  before update on public.marriage_details
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_customers_registration_id on public.customers(registration_id);
create index if not exists idx_customers_created_at on public.customers(created_at);
create index if not exists idx_documents_customer on public.documents(customer_id);
create index if not exists idx_payments_customer on public.payments(customer_id);
create index if not exists idx_status_customer on public.registration_status(customer_id);
create index if not exists idx_notifications_customer on public.notifications(customer_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for marriage documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('marriage-documents', 'marriage-documents', false)
on conflict (id) do nothing;

-- Allow authenticated, service-role, and signed-token operations on the bucket.
-- (Office access to bucket contents is handled server-side via signed URLs,
-- so we do not grant public anon reads here.)
create policy "Authenticated can manage bucket" on storage.objects
  for all using (bucket_id = 'marriage-documents')
  with check (bucket_id = 'marriage-documents');

-- ---------------------------------------------------------------------------
-- RLS: disallow all direct anon/public access to business data (default).
-- All anon write/read is intentionally blocked; the table is the server.
-- ---------------------------------------------------------------------------
alter table public.customers          enable row level security;
alter table public.marriage_details   enable row level security;
alter table public.payments           enable row level security;
alter table public.documents          enable row level security;
alter table public.registration_status enable row level security;
alter table public.staff              enable row level security;
alter table public.notifications      enable row level security;vs