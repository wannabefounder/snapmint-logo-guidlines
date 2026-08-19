-- Snapmint Logo Guidelines — content schema
-- Single-admin CMS. Public reads visible rows; every write requires the admin
-- email AND an MFA-elevated session (aal2), enforced in the database itself.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- admin gate
create or replace function public.admin_email() returns text
language sql immutable parallel safe as $$ select 'harsh.v@snapmint.com'::text $$;

create or replace function public.is_admin() returns boolean
language sql stable parallel safe as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = public.admin_email()
    and (auth.jwt() ->> 'aal') = 'aal2',
  false)
$$;

comment on function public.is_admin() is
  'True only for the single admin address on a session that has passed TOTP. '
  'Password alone yields aal1 and cannot write.';

-- ------------------------------------------------------------- shared helper
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ------------------------------------------------------------------- tables
create table if not exists public.site_config (
  id            boolean primary key default true check (id),
  brand_name    text not null default 'Snapmint',
  site_title    text not null default 'Logo Guidelines',
  site_tagline  text not null default '',
  footer_note   text not null default '',
  sidebar_note  text not null default '',
  updated_at    timestamptz not null default now()
);

create table if not exists public.logo_options (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  label       text not null,
  rank_label  text not null default '',
  hex         text not null default '#FF6F00',
  use_note    text not null default '',
  svg_path    text not null default '',
  png_path    text not null default '',
  sort_order  int  not null default 0,
  visible     boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.sections (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  nav_label         text not null,
  eyebrow           text not null default '',
  title             text not null default '',
  description       text not null default '',
  kind              text not null default 'widget'
                    check (kind in ('logo','colours','usage','widget')),
  note_body         text not null default '',
  is_coming_soon    boolean not null default false,
  empty_title       text not null default '',
  empty_body        text not null default '',
  sort_order        int  not null default 0,
  visible           boolean not null default true,
  updated_at        timestamptz not null default now()
);

create table if not exists public.widget_groups (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references public.sections(id) on delete cascade,
  title        text not null,
  blurb        text not null default '',
  sort_order   int  not null default 0,
  visible      boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table if not exists public.widget_items (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.widget_groups(id) on delete cascade,
  name              text not null,
  spec              text not null default '',
  cta               text not null default '',
  asset_key         text not null default '',
  preview_overrides jsonb not null default '{}'::jsonb,
  width             int  not null default 400,
  height            int  not null default 120,
  sort_order        int  not null default 0,
  visible           boolean not null default true,
  updated_at        timestamptz not null default now()
);

create table if not exists public.colours (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  hex         text not null,
  usage       text not null default '',
  sort_order  int  not null default 0,
  visible     boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.rules (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('do','dont','logo')),
  title       text not null default '',
  body        text not null default '',
  sort_order  int  not null default 0,
  visible     boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.audit_log (
  id        bigserial primary key,
  actor     text,
  action    text not null,
  entity    text not null,
  entity_id text,
  at        timestamptz not null default now()
);

-- ------------------------------------------------------------------ indexes
create index if not exists widget_groups_section_idx on public.widget_groups (section_id, sort_order);
create index if not exists widget_items_group_idx    on public.widget_items  (group_id, sort_order);
create index if not exists audit_log_at_idx          on public.audit_log     (at desc);

-- ----------------------------------------------------------------- triggers
do $$
declare t text;
begin
  foreach t in array array['site_config','logo_options','sections','widget_groups',
                           'widget_items','colours','rules'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- audit every write to content tables
create or replace function public.write_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id)
  values (coalesce(auth.jwt() ->> 'email', session_user), tg_op, tg_table_name,
          case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id')
               else (to_jsonb(new) ->> 'id') end);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['site_config','logo_options','sections','widget_groups',
                           'widget_items','colours','rules'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I
                    for each row execute function public.write_audit()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array['site_config','logo_options','sections','widget_groups',
                           'widget_items','colours','rules','audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- readable rows: visible to everyone, hidden rows only to the admin
do $$
declare t text;
begin
  foreach t in array array['logo_options','sections','widget_groups',
                           'widget_items','colours','rules'] loop
    execute format('drop policy if exists read_visible on public.%I', t);
    execute format('create policy read_visible on public.%I for select
                    to anon, authenticated using (visible or public.is_admin())', t);
    execute format('drop policy if exists admin_write on public.%I', t);
    execute format('create policy admin_write on public.%I for all
                    to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists read_config on public.site_config;
create policy read_config on public.site_config for select to anon, authenticated using (true);
drop policy if exists admin_config on public.site_config;
create policy admin_config on public.site_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_audit on public.audit_log;
create policy admin_audit on public.audit_log for select to authenticated
  using (public.is_admin());

-- PostgREST needs table privileges in addition to policies.
--
-- Supabase grants anon full DML on every new public table by default. RLS would
-- still reject the writes, but PostgREST answers them 204 (nothing matched)
-- rather than 401, which reads like success. Revoke first so an anonymous write
-- fails loudly at the privilege layer, then re-grant only what is needed.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
alter default privileges in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon;

grant usage on schema public to anon, authenticated;
grant select on public.site_config, public.logo_options, public.sections,
  public.widget_groups, public.widget_items, public.colours, public.rules to anon, authenticated;
revoke select on public.audit_log from anon;
grant select on public.audit_log to authenticated;
grant insert, update, delete on public.site_config, public.logo_options, public.sections,
  public.widget_groups, public.widget_items, public.colours, public.rules to authenticated;
