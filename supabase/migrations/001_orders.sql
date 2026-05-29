-- Run this in Supabase SQL Editor

create table if not exists orders (
  id          uuid                     default gen_random_uuid() primary key,
  created_at  timestamp with time zone default now(),
  user_id     bigint,
  username    text,
  first_name  text,
  items       jsonb                    not null default '[]',
  total       integer                  not null default 0,
  address     jsonb                    not null default '{}',
  status      text                     not null default 'new'
);

-- Only service_role (backend) can read/write
alter table orders enable row level security;

create policy "service_role full access"
  on orders
  to service_role
  using (true)
  with check (true);

-- Index for dashboard queries
create index orders_created_at_idx on orders (created_at desc);
create index orders_status_idx     on orders (status);
