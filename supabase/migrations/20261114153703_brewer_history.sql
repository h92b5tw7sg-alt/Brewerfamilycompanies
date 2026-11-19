-- Brewer Family Companies public history database.
-- Public history only; private Brewer AI business information does not belong here.
begin;
create schema if not exists bfc_private;
revoke all on schema bfc_private from public, anon;
grant usage on schema bfc_private to authenticated;
create table bfc_private.editors (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table bfc_private.editors enable row level security;
revoke all on bfc_private.editors from public, anon, authenticated;
grant select on bfc_private.editors to authenticated;
create policy editors_see_own_membership on bfc_private.editors for select to authenticated
 using (user_id = (select auth.uid()));
-- Membership is assigned by a database administrator, never by visitors.
create table public.bfc_sources (
 id text primary key check(length(id)>0), title text not null check(length(title)>0),
 url text not null check(url ~ '^https://'), publisher_label text not null,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bfc_companies (
 id text primary key check(length(id)>0), title text not null check(length(title)>0),
 phase_label text not null default '', categories text[] not null default '{}',
 paragraphs jsonb not null default '[]' check(jsonb_typeof(paragraphs)='array'),
 reference_links jsonb not null default '[]' check(jsonb_typeof(reference_links)='array'),
 sort_order integer not null default 0 check(sort_order>=0),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bfc_timeline (
 id text primary key check(length(id)>0), title text not null check(length(title)>0),
 date_label text not null, era text not null,
 paragraphs jsonb not null default '[]' check(jsonb_typeof(paragraphs)='array'),
 reference_links jsonb not null default '[]' check(jsonb_typeof(reference_links)='array'),
 evidence_note text not null default '', full_width boolean not null default false,
 sort_order integer not null default 0 check(sort_order>=0),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bfc_articles (
 id text primary key check(length(id)>0), title text not null check(length(title)>0),
 publisher text not null, author text not null default '', date_label text not null default '',
 -- Retain month-only and approximate historical dates without inventing a day.
 date_sort text not null default '', source_url text not null unique check(source_url ~ '^https://'),
 categories text[] not null default '{}', article_type text not null default '',
 summary text not null, source_note text not null default '', evidence text not null default '',
 metadata jsonb not null default '{}' check(jsonb_typeof(metadata)='object'),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bfc_media (
 id text primary key check(length(id)>0), title text not null check(length(title)>0),
 kind text not null check(kind in ('image','video')), url text not null check(url ~ '^https://'),
 metadata jsonb not null default '{}' check(jsonb_typeof(metadata)='object'),
 sort_order integer not null default 0 check(sort_order>=0),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index bfc_companies_order on public.bfc_companies(sort_order) where status='published';
create index bfc_timeline_order on public.bfc_timeline(sort_order) where status='published';
create index bfc_articles_date on public.bfc_articles(date_sort desc) where status='published';
create index bfc_articles_categories on public.bfc_articles using gin(categories);
create index bfc_media_order on public.bfc_media(sort_order) where status='published';
create function bfc_private.touch_updated_at() returns trigger language plpgsql
 security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
revoke all on function bfc_private.touch_updated_at() from public, anon, authenticated;
-- No security-definer functions, publicly editable role claims, or secret frontend keys.
do $$
declare tbl text;
begin
 foreach tbl in array array['bfc_sources','bfc_companies','bfc_timeline','bfc_articles','bfc_media'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from public, anon, authenticated',tbl);
  execute format('grant select on public.%I to anon, authenticated',tbl);
  execute format('grant insert, update, delete on public.%I to authenticated',tbl);
  execute format('create policy published_read on public.%I for select to anon using (status = %L)',tbl,'published');
  execute format('create policy authenticated_read on public.%I for select to authenticated using (status = %L or exists (select 1 from bfc_private.editors where user_id = (select auth.uid())))',tbl,'published');
  execute format('create policy editor_insert on public.%I for insert to authenticated with check (exists (select 1 from bfc_private.editors where user_id = (select auth.uid())))',tbl);
  execute format('create policy editor_update on public.%I for update to authenticated using (exists (select 1 from bfc_private.editors where user_id = (select auth.uid()))) with check (exists (select 1 from bfc_private.editors where user_id = (select auth.uid())))',tbl);
  execute format('create policy editor_delete on public.%I for delete to authenticated using (exists (select 1 from bfc_private.editors where user_id = (select auth.uid())))',tbl);
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function bfc_private.touch_updated_at()',tbl);
 end loop;
end $$;
commit;
