# RLS Policy Performance Runbook

## Production baseline

- 125 `auth_rls_initplan` warnings.
- Every flagged policy is a simple owner comparison: `auth.uid() = user_id` or `auth.uid() = id`.
- The flagged policies currently target `public`; anonymous requests still fail because `auth.uid()` is null.
- Four Weekly Inspection policies are already optimized and target `authenticated`.

## Migration guarantees

- No access predicate changes.
- No policies are dropped or recreated.
- Each policy retains its name, table, operation, `USING`, and `WITH CHECK` structure.
- `auth.uid()` becomes `(select auth.uid())`, allowing Postgres to cache the recruit ID once per statement.
- The role narrows from `public` to `authenticated`, avoiding needless anonymous evaluation without granting new access.
- The transaction aborts unless exactly 125 reviewed policies match.

## Production verification

1. Confirm the migration appears in Supabase migration history.
2. Run the performance advisor and require zero `auth_rls_initplan` warnings.
3. Confirm the security advisor has no new errors or warnings.
4. Confirm 125 optimized policies target only `authenticated` and contain a subquery-backed `auth.uid()` expression.
5. Smoke-test authenticated reads and writes for Profile, Today, Program, Calendar, Fuel, Workout, and Weekly Inspection.

Foreign-key indexes and unused-index review are deliberately outside this release.
