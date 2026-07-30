-- Build 017D: persist current and finalized strength-week reconciliation reviews.

alter table public.strength_training_state
  drop constraint if exists strength_training_state_state_type_check;

alter table public.strength_training_state
  add constraint strength_training_state_state_type_check
  check (state_type in ('PROFILE', 'DRAFT', 'PLAN', 'EXECUTION', 'HISTORY', 'ADJUSTMENT', 'SCHEDULE', 'WEEK_REVIEW'));
