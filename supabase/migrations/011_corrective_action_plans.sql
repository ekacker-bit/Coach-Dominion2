-- Build 011B: corrective action execution and verification fields.
alter table public.standards_violations
  add column if not exists corrective_action_success_criteria text,
  add column if not exists completion_evidence text,
  add column if not exists completion_submitted_at timestamptz;
