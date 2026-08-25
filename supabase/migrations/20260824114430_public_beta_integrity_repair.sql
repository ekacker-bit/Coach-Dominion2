-- Build 030P: keep Fuel persistence types identical across the client and database.

begin;

alter table if exists public.nutrition_state
  drop constraint if exists nutrition_state_state_type_check;

-- Normalize legacy aliases without losing the newest payload when both names exist.
insert into public.nutrition_state (user_id, state_type, state_key, payload, created_at, updated_at)
select
  user_id,
  case state_type
    when 'FASTING' then 'FASTING_PROTOCOL'
    when 'FASTING_LOG' then 'FASTING_EXECUTION'
    when 'MEAL_LOG' then 'MEAL_EXECUTION'
    when 'CLOSED_LOOP' then 'FUEL_CLOSED_LOOP'
  end,
  state_key,
  payload,
  created_at,
  updated_at
from public.nutrition_state
where state_type in ('FASTING', 'FASTING_LOG', 'MEAL_LOG', 'CLOSED_LOOP')
on conflict (user_id, state_type, state_key) do update
set payload = case
      when excluded.updated_at >= public.nutrition_state.updated_at then excluded.payload
      else public.nutrition_state.payload
    end,
    created_at = least(public.nutrition_state.created_at, excluded.created_at),
    updated_at = greatest(public.nutrition_state.updated_at, excluded.updated_at);

delete from public.nutrition_state
where state_type in ('FASTING', 'FASTING_LOG', 'MEAL_LOG', 'CLOSED_LOOP');

alter table public.nutrition_state
  add constraint nutrition_state_state_type_check check (state_type in (
    'BASELINE_HISTORY',
    'ADAPTIVE_GOAL',
    'ADAPTIVE_APPROVAL',
    'MEAL_WINDOW',
    'REVIEW_HISTORY',
    'MANUAL_DAY',
    'FASTING_PROTOCOL',
    'FASTING_EXECUTION',
    'MEAL_EXECUTION',
    'FUEL_CLOSED_LOOP'
  ));

commit;
