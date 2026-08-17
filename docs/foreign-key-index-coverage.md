# Foreign-Key Index Coverage Runbook

## Production baseline

- Nine `unindexed_foreign_keys` advisor findings remained after the policy-performance release.
- The reviewed child tables contain zero to six live rows and occupy 16-128 kB, so a transactional build is appropriate today.
- Every gap protects a real relationship path: five cascades, three restrict checks, and one set-null action.
- Ten `unused_index` observations are excluded because a short usage window is not enough evidence to remove an index.

## Migration guarantees

- The transaction first verifies all nine foreign-key names, child columns, parent columns, and delete actions against the production catalog.
- It creates one B-tree index with the foreign-key column as the leading key for each reviewed constraint.
- It does not alter constraints, rows, grants, policies, or existing indexes.
- It verifies all nine indexes are valid, ready, and correctly ordered before commit.
- Lock acquisition is capped at five seconds and the transaction at two minutes.

## Production verification

1. Confirm `foreign_key_index_coverage` appears in Supabase migration history.
2. Run the performance advisor and require zero `unindexed_foreign_keys` findings.
3. Confirm the ten pre-existing `unused_index` observations were not changed by this release.
4. Run the security advisor and require no new findings.
5. Confirm all nine new indexes are valid and have the reviewed foreign-key column first.

Index removal remains a separate evidence-led decision after a representative production usage window.
