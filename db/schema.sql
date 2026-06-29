-- AdChad schema — run by lib/db.ts migrate(). Idempotent.
create table if not exists ads (
  id text primary key,                 -- foreplay_id
  brand_id text,
  advertiser text,
  link_url text,
  creative_url text,
  copy text,
  niches text[],
  running_duration int,
  first_seen timestamptz,
  raw jsonb,
  created_at timestamptz default now()
);
create table if not exists prospects (
  id text primary key,                 -- brand_id (or slug of advertiser)
  name text,
  website text,
  email text,
  x_handle text,
  x_followers int,
  segment text,                        -- A | B | unreachable
  vertical text,
  est_spend int,
  ltv_est int,
  status text default 'new',
  created_at timestamptz default now()
);
create table if not exists scores (
  id bigserial primary key,
  ad_id text references ads(id),
  prospect_id text references prospects(id),
  badness numeric, economic numeric, reach_safety numeric, total numeric,
  gate text,                           -- qualify | held | filter
  votes jsonb,
  created_at timestamptz default now()
);
create table if not exists roasts (
  id bigserial primary key,
  prospect_id text references prospects(id),
  ad_id text references ads(id),
  text text, hook text, model text,
  status text default 'drafted',       -- drafted | posted | emailed
  post_url text, tweet_id text,
  emailed_at timestamptz, sent_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists orders (
  id bigserial primary key,
  prospect_id text references prospects(id),
  tier int,                            -- 5 | 12 | 49
  stripe_id text, buyer_email text, amount int,
  status text default 'created',
  created_at timestamptz default now()
);
create table if not exists fixes (
  id bigserial primary key,
  order_id bigint references orders(id),
  headline text, body text, cta text, creative_dir text, variants jsonb,
  delivered_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists runs (
  id bigserial primary key,
  started_at timestamptz default now(),
  scanned int default 0, enriched int default 0, qualified int default 0,
  posted int default 0, emailed int default 0, revenue int default 0,
  errors jsonb
);
create table if not exists control (
  id int primary key default 1,
  paused boolean default false
);
alter table prospects add column if not exists email_source text;  -- scraped | guessed
alter table prospects add column if not exists stage text default 'new';  -- new→roasted→contacted→replied→customer
alter table fixes add column if not exists image_url text;          -- generated ad creative
-- one fix per order = the fulfillment idempotency key (deterministic worker upserts on it)
create unique index if not exists fixes_order_id_uniq on fixes (order_id);

-- every inbound/outbound touch (X post, reply, DM, email) — the agent's CRM history
create table if not exists interactions (
  id bigserial primary key,
  prospect_id text references prospects(id),
  channel text,                        -- x | email | note
  direction text,                      -- in | out
  ref text,                            -- tweet id / message id
  from_addr text, subject text, text text,
  handled boolean default false,
  created_at timestamptz default now()
);
-- P&L ledger — revenue in, tool cost out → the agent's margins
create table if not exists ledger (
  id bigserial primary key,
  kind text,                           -- revenue | cost
  amount_cents int, note text,
  created_at timestamptz default now()
);

alter table interactions add column if not exists ad_id text;  -- the SPECIFIC ad a roast/fix targets (not just the brand)

insert into control (id, paused) values (1, false) on conflict (id) do nothing;
