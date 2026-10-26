-- DogePay ID Friends/Chat. Supabase SQL Editor or supabase db push.
-- The Edge Function is the only permitted data client; NEVER expose service role.
create extension if not exists pgcrypto;
create table if not exists public.dp_sessions (
  token_hash text primary key,
  wallet text not null check (wallet ~ '^0x[0-9a-f]{40}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists dp_sessions_wallet_idx on public.dp_sessions(wallet);
create table if not exists public.dp_challenges (
  wallet text primary key check (wallet ~ '^0x[0-9a-f]{40}$'),
  nonce text not null,
  message text not null,
  expires_at timestamptz not null
);
create table if not exists public.dp_friendships (
  wallet_low text not null check(wallet_low ~ '^0x[0-9a-f]{40}$'),
  wallet_high text not null check(wallet_high ~ '^0x[0-9a-f]{40}$'),
  initiator text not null,
  status text not null check(status in ('pending','accepted')),
  updated_at timestamptz not null default now(),
  primary key(wallet_low,wallet_high),
  check(wallet_low < wallet_high)
);
create index if not exists dp_friendships_high_idx on public.dp_friendships(wallet_high);
create table if not exists public.dp_messages (
  id uuid primary key default gen_random_uuid(),
  sender text not null,
  recipient text not null,
  body text not null check(char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists dp_messages_pair_idx on public.dp_messages(sender,recipient,created_at desc);
create index if not exists dp_messages_reverse_idx on public.dp_messages(recipient,sender,created_at desc);
create table if not exists public.dp_notices (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  actor text not null,
  kind text not null,
  body text not null default '',
  at timestamptz not null default now()
);
create index if not exists dp_notices_wallet_idx on public.dp_notices(wallet,at desc);
create table if not exists public.dp_notice_reads (
  wallet text primary key,
  last_read timestamptz not null default to_timestamp(0)
);
create table if not exists public.dp_read_receipts (
  wallet text not null,
  peer text not null,
  read_at timestamptz not null default to_timestamp(0),
  primary key(wallet,peer)
);
alter table public.dp_sessions enable row level security;
alter table public.dp_challenges enable row level security;
alter table public.dp_friendships enable row level security;
alter table public.dp_messages enable row level security;
alter table public.dp_notices enable row level security;
alter table public.dp_notice_reads enable row level security;
alter table public.dp_read_receipts enable row level security;
revoke all on public.dp_sessions, public.dp_challenges, public.dp_friendships, public.dp_messages, public.dp_notices, public.dp_notice_reads, public.dp_read_receipts from anon, authenticated, public;
grant all on public.dp_sessions, public.dp_challenges, public.dp_friendships, public.dp_messages, public.dp_notices, public.dp_notice_reads, public.dp_read_receipts to service_role;
