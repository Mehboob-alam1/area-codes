-- World Area Code Directory
-- Apply this migration in the Supabase SQL editor before pointing the API at Postgres.
-- The running API uses a JSON store with the same entities until that adapter is enabled.
-- Area codes are not forced into one city. Locations live in area_code_locations.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  source_type text not null,
  license text,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  official_name text,
  slug text not null,
  aliases jsonb not null default '[]'::jsonb,
  iso2 varchar(2) not null,
  iso3 varchar(3) not null,
  calling_code text,
  calling_codes jsonb not null default '[]'::jsonb,
  capital text,
  continent text,
  subregion text,
  currency_code text,
  currency_name text,
  currency_symbol text,
  languages jsonb not null default '[]'::jsonb,
  flag_emoji text,
  flag_url text,
  timezones jsonb not null default '[]'::jsonb,
  international_prefix text,
  national_prefix text,
  numbering_notes text,
  description text,
  source_id uuid references data_sources(id),
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists countries_slug_active_idx on countries (slug) where deleted_at is null;
create unique index if not exists countries_iso2_active_idx on countries (iso2) where deleted_at is null;
create unique index if not exists countries_iso3_active_idx on countries (iso3) where deleted_at is null;
create index if not exists countries_calling_code_idx on countries (calling_code);
create index if not exists countries_continent_idx on countries (continent);

create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id),
  name text not null,
  slug text not null,
  region_type text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists regions_country_slug_active_idx on regions (country_id, slug) where deleted_at is null;

create index if not exists regions_country_idx on regions (country_id);

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id),
  region_id uuid references regions(id),
  name text not null,
  slug text not null,
  latitude numeric,
  longitude numeric,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists cities_country_slug_active_idx on cities (country_id, slug) where deleted_at is null;
create index if not exists cities_region_idx on cities (region_id);

create table if not exists area_codes (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id),
  code text not null,
  code_type text not null default 'geographic',
  national_prefix text,
  international_format text,
  dialing_instructions text,
  notes text,
  source_id uuid references data_sources(id),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'outdated', 'conflicting', 'rejected')),
  verified_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists area_codes_country_code_active_idx on area_codes (country_id, code) where deleted_at is null;
create index if not exists area_codes_code_idx on area_codes (code);

create table if not exists area_code_locations (
  id uuid primary key default gen_random_uuid(),
  area_code_id uuid not null references area_codes(id) on delete cascade,
  country_id uuid not null references countries(id),
  region_id uuid references regions(id),
  city_id uuid references cities(id),
  created_at timestamptz not null default now()
);

create index if not exists area_code_locations_code_idx on area_code_locations (area_code_id);
create index if not exists area_code_locations_city_idx on area_code_locations (city_id);
create index if not exists area_code_locations_region_idx on area_code_locations (region_id);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'admin', 'editor', 'reviewer', 'analyst')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on audit_logs (created_at desc);

create table if not exists search_logs (
  id uuid primary key default gen_random_uuid(),
  search_query text not null,
  search_type text not null,
  result_count integer not null,
  created_at timestamptz not null default now()
);

create index if not exists search_logs_created_idx on search_logs (created_at desc);

drop trigger if exists countries_updated_at on countries;
create trigger countries_updated_at before update on countries for each row execute function set_updated_at();
drop trigger if exists regions_updated_at on regions;
create trigger regions_updated_at before update on regions for each row execute function set_updated_at();
drop trigger if exists cities_updated_at on cities;
create trigger cities_updated_at before update on cities for each row execute function set_updated_at();
drop trigger if exists area_codes_updated_at on area_codes;
create trigger area_codes_updated_at before update on area_codes for each row execute function set_updated_at();

alter table data_sources enable row level security;
alter table countries enable row level security;
alter table regions enable row level security;
alter table cities enable row level security;
alter table area_codes enable row level security;
alter table area_code_locations enable row level security;
alter table admin_users enable row level security;
alter table audit_logs enable row level security;
alter table search_logs enable row level security;

create policy "public read sources" on data_sources for select to anon, authenticated using (true);
create policy "public read countries" on countries for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy "public read regions" on regions for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy "public read cities" on cities for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy "public read area codes" on area_codes for select to anon, authenticated using (status = 'published' and deleted_at is null and verification_status <> 'rejected');
create policy "public read area code locations" on area_code_locations for select to anon, authenticated using (true);

-- Writes stay on the server with the service role, which bypasses RLS.
-- Do not add anon insert, update or delete policies.
