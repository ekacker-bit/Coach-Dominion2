-- Cache the authenticated recruit ID once per statement in every remaining
-- simple owner policy. This preserves each policy's command and predicate
-- while removing per-row auth.uid() evaluation.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '2min';

do $migration$
declare
  policy_row record;
  optimized_using text;
  optimized_check text;
  changed_count integer := 0;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and roles = array['public']::name[]
      and coalesce(qual, '') in (
        '',
        '(auth.uid() = user_id)',
        '(auth.uid() = id)'
      )
      and coalesce(with_check, '') in (
        '',
        '(auth.uid() = user_id)',
        '(auth.uid() = id)'
      )
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%'
      )
    order by tablename, policyname
  loop
    optimized_using := case
      when policy_row.qual is null then null
      else replace(policy_row.qual, 'auth.uid()', '(select auth.uid())')
    end;

    optimized_check := case
      when policy_row.with_check is null then null
      else replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())')
    end;

    execute format(
      'alter policy %I on %I.%I to authenticated%s%s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      case
        when optimized_using is null then ''
        else format(' using (%s)', optimized_using)
      end,
      case
        when optimized_check is null then ''
        else format(' with check (%s)', optimized_check)
      end
    );

    changed_count := changed_count + 1;
  end loop;

  if changed_count <> 125 then
    raise exception
      'RLS policy baseline changed: expected 125 simple public owner policies, found %',
      changed_count;
  end if;
end
$migration$;

commit;
