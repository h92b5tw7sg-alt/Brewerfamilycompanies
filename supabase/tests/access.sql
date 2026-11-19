-- Transactional integration checks. Every fixture and change is rolled back.
begin;
do $$
declare tbl text; payload jsonb;
begin
 foreach tbl in array array['bfc_companies','bfc_timeline','bfc_articles','bfc_sources','bfc_media'] loop
  execute format('select to_jsonb(t) from public.%I t limit 1',tbl) into payload;
  if payload is null then raise exception 'Missing seed data: %',tbl; end if;
  payload := payload || '{"id":"__draft_probe__","status":"draft","source_url":"https://example.com/bfc-draft-probe"}'::jsonb;
  execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I,$1)',tbl,tbl) using payload;
 end loop;
end $$;
set local role anon;
do $$
declare tbl text; n integer;
begin
 foreach tbl in array array['bfc_companies','bfc_timeline','bfc_articles','bfc_sources','bfc_media'] loop
  execute format('select count(*) from public.%I where status <> ''published''',tbl) into n;
  if n<>0 then raise exception 'Anonymous draft exposure: %',tbl; end if;
  if has_table_privilege(current_user,'public.'||tbl,'INSERT') or has_table_privilege(current_user,'public.'||tbl,'UPDATE') or has_table_privilege(current_user,'public.'||tbl,'DELETE') then raise exception 'Anonymous write grant: %',tbl; end if;
 end loop;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$
declare tbl text; n integer; payload jsonb; blocked boolean;
begin
 foreach tbl in array array['bfc_companies','bfc_timeline','bfc_articles','bfc_sources','bfc_media'] loop
  execute format('select count(*) from public.%I where status <> ''published''',tbl) into n;
  if n<>0 then raise exception 'Non-editor draft exposure: %',tbl; end if;
  execute format('update public.%I set title=title',tbl); get diagnostics n = row_count;
  if n<>0 then raise exception 'Non-editor update allowed: %',tbl; end if;
  execute format('delete from public.%I',tbl); get diagnostics n = row_count;
  if n<>0 then raise exception 'Non-editor delete allowed: %',tbl; end if;
  execute format('select to_jsonb(t) from public.%I t limit 1',tbl) into payload;
  payload := payload || '{"id":"__insert_probe__","source_url":"https://example.com/bfc-insert-probe"}'::jsonb;
  blocked := false;
  begin
   execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I,$1)',tbl,tbl) using payload;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Non-editor insert allowed: %',tbl; end if;
 end loop;
 if has_table_privilege(current_user,'bfc_private.editors','INSERT') or has_table_privilege(current_user,'bfc_private.editors','UPDATE') or has_table_privilege(current_user,'bfc_private.editors','DELETE') then raise exception 'Editor role self-assignment allowed'; end if;
end $$;
reset role;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001');
insert into bfc_private.editors(user_id) values ('00000000-0000-4000-8000-000000000001');
set local role authenticated;
do $$
declare tbl text; n integer;
begin
 foreach tbl in array array['bfc_companies','bfc_timeline','bfc_articles','bfc_sources','bfc_media'] loop
  execute format('select count(*) from public.%I where id=''__draft_probe__''',tbl) into n;
  if n<>1 then raise exception 'Editor cannot read draft: %',tbl; end if;
  execute format('update public.%I set title=''Access test'' where id=''__draft_probe__''',tbl);
  get diagnostics n = row_count;
  if n<>1 then raise exception 'Editor cannot update: %',tbl; end if;
  execute format('delete from public.%I where id=''__draft_probe__''',tbl);
  get diagnostics n = row_count;
  if n<>1 then raise exception 'Editor cannot delete: %',tbl; end if;
 end loop;
end $$;
reset role;
rollback;
