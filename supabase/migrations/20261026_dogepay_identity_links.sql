-- DogePay wallet-bound social account identity, isolated from existing Friends/Chat tables.
-- Client applications have no direct access; the Edge Function uses the service role.
create table if not exists public.dp_identity_link_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_kind text not null check(wallet_kind in ('mydoge', 'dogesoft', 'dogeos')),
  wallet_address text not null,
  message text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists dp_identity_link_challenges_user_expiry_idx
  on public.dp_identity_link_challenges(user_id, expires_at);
alter table public.dp_identity_link_challenges enable row level security;
revoke all on public.dp_identity_link_challenges from anon, authenticated;

create table if not exists public.dp_linked_wallets (
  user_id uuid not null references auth.users(id) on delete cascade,
  network text not null check (network in ('dogecoin', 'dogeos')),
  wallet_kind text not null check (wallet_kind in ('mydoge', 'dogesoft', 'dogeos')),
  wallet_address text not null,
  linked_at timestamptz not null default now(),
  primary key (user_id, network),
  unique (network, wallet_address),
  constraint dp_wallet_network_kind_check check(
    (network='dogecoin' and wallet_kind in ('mydoge', 'dogesoft')) or
    (network='dogeos' and wallet_kind='dogeos')
  )
);
alter table public.dp_linked_wallets enable row level security;
revoke all on public.dp_linked_wallets from anon, authenticated;
