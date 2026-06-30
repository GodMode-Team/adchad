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
alter table interactions add column if not exists link_url text;  -- public link for the event (e.g. the fix's X reply) — safe to surface in the feed

-- $49/mo retainer ("Hire Chad"): one-click off-session upsell + intake form. test (local) and live (prod) Stripe
-- share ONE db, and Stripe ids are mode-scoped — so the mode is tracked and test-mode money stays off public surfaces.
alter table prospects add column if not exists stripe_customer text;    -- reusable Stripe customer (saved on first $5/$12 checkout)
alter table prospects add column if not exists stripe_sub text;         -- active retainer subscription id (idempotency + "hired")
alter table prospects add column if not exists stripe_livemode boolean; -- mode the saved customer/sub belong to (test vs live)
alter table orders add column if not exists livemode boolean default true;  -- false = test-mode order → excluded from public P&L/feed
alter table ledger add column if not exists livemode boolean default true;  -- false = test-mode money  → excluded from public P&L/feed
create table if not exists onboarding (
  id bigserial primary key,
  prospect_id text references prospects(id),
  answers jsonb,                       -- the intake form responses (static curated questions)
  submitted_at timestamptz default now()  -- the 1-week "first report" clock starts here
);
-- idempotency: one order per Stripe id (webhook retries / the dual invoice.paid+payment_succeeded events can't double-book).
-- non-partial: Postgres treats NULL stripe_ids as distinct, so legacy null rows are unaffected and `on conflict` infers it.
create unique index if not exists orders_stripe_id_uniq on orders (stripe_id);
-- one intake row per prospect (the form upserts; blocks unbounded spam inserts)
create unique index if not exists onboarding_prospect_uniq on onboarding (prospect_id);

-- Launch campaign (spec-14): the hand-posted launch tweet's id lives on the control row (empty = campaign off);
-- comped free-fix orders are tagged source='launch' (amount=0) so they're auditable + excluded from real revenue.
alter table control add column if not exists launch_tweet_id text;
alter table orders  add column if not exists source text;  -- null = normal paid order | 'launch' = comped free fix

insert into control (id, paused) values (1, false) on conflict (id) do nothing;
