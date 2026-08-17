-- Release stabilization: explicitly expose the account-scoped application tables to
-- authenticated recruits. Row-level security remains the authorization boundary.
--
-- Supabase projects created after the 2025 Data API hardening no longer expose new
-- public tables implicitly, so policies alone are not sufficient.

begin;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.daily_state,
  public.daily_compliance,
  public.weekly_inspections,
  public.performance_entries,
  public.fitness_test_attempts,
  public.personal_records,
  public.milestone_achievements,
  public.atlas_reviews,
  public.standards_violations,
  public.standards_violation_events,
  public.user_rank_status,
  public.rank_promotions,
  public.rank_status_events,
  public.connected_accounts,
  public.integration_sync_jobs,
  public.imported_records,
  public.running_state,
  public.core_program_state,
  public.coaching_loop_state,
  public.nutrition_feed_tokens,
  public.nutrition_state,
  public.strength_training_state,
  public.recruit_contract_state,
  public.weekly_orchestration_state,
  public.split_day_checkpoint_state,
  public.dominion_continuity_state,
  public.recruit_onboarding_state,
  public.body_progress_photos
to authenticated;

grant select, insert on table public.command_feed to authenticated;
grant select on table public.nutrition_feed_events to authenticated;

grant execute on function public.sync_dominion_continuity_state(
  bigint, integer, text, jsonb, timestamptz
) to authenticated;

grant execute on function public.sync_dominion_account_truth(
  bigint, integer, integer, text, jsonb, jsonb, text, timestamptz
) to authenticated;

commit;
