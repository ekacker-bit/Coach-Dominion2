# Contributing to Coach Dominion

## Repository rules

- `main` must remain deployable.
- Use one feature branch per build.
- Name build branches with `build-###x-description`, for example `build-003c-repository-cleanup`.
- Inspect the repository, current branch, working tree, and relevant implementation before editing.
- Keep each change within the approved build scope.
- Run all automated tests before committing.
- For Build 004E work, include the standards suite in validation: `node tests/standards-violations.test.js` and `npm.cmd test` on Windows.
- Submit changes through a pull request; do not merge feature work directly into `main`.
- Test the Vercel preview, including affected routes, before merging.
- Never commit secrets, environment files, credentials, private URLs, or user data.
- Never alter or apply Supabase migrations casually. Database work requires explicit scope, review, and a rollback-aware plan.
- Do not make direct production changes. Production configuration and services must be changed through an explicitly approved workflow.
- Codex must not push, merge, deploy, or modify remote services without explicit user approval.

## Development workflow

1. Confirm `main` is current and clean through the approved Git workflow.
2. Create a single-purpose build branch using the naming convention above.
3. Inspect existing behavior and tests before making changes.
4. Implement the smallest scoped change and preserve unrelated work.
5. Run:

   ```sh
   npm test
   git diff --check
   ```

6. Review the diff for secrets, unintended behavior changes, and accidental migration or configuration edits.
7. Commit intentionally, push only with approval, and open a pull request.
8. Validate the Vercel preview before requesting merge approval.

## Supabase and environment safety

Use ignored local environment files or approved platform configuration for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A Supabase service-role key must never be placed in browser code. Do not edit existing migration history to perform routine cleanup, and do not apply migrations to a remote project without explicit approval.
