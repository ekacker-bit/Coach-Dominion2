# Production security verification

The production security migration narrows the exposed database surface without changing Coach Dominion's canonical account model.

## Migration guarantees

- `public.users` and `public.daily_reports` remain available for rollback inspection but have RLS forced, no user policies, and no `anon` or `authenticated` table privileges.
- Auth bootstrap, timestamp, snapshot-protection, and nutrition-revocation functions run only through their registered triggers.
- Weekly Inspection has one owner policy per operation, limited to signed-in recruits.
- The redundant weekly inspection index is removed; the table's unique constraint remains authoritative.
- `ingest_nutrition_feed(text, jsonb)` intentionally remains callable by `anon` and `authenticated`. It authenticates a revocable hashed feed token, derives the user from that token, and accepts no user ID from the caller.

## Deployment checks

After applying the migration:

1. Run Supabase security and performance advisors.
2. Confirm both legacy tables have RLS enabled and no Data API grants for `anon` or `authenticated`.
3. Confirm trigger-only functions are not executable by `public`, `anon`, or `authenticated`.
4. Confirm the nutrition ingestion dry run still authorizes a valid feed token and rejects an invalid token.
5. Confirm Weekly Inspection read, finalize, and finalized-snapshot protection still work for the owning recruit.

## Platform control

Leaked-password protection is an Auth platform setting rather than a database migration. Enable it in the production project's Auth password-security settings before opening beta enrollment, then rerun the security advisor to confirm the warning is cleared.
