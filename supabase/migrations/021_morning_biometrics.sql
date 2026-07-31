-- Build 018A: persistent morning biometrics and source provenance.

alter table public.daily_state
  add column if not exists heart_rate_variability numeric(7, 2)
    check (heart_rate_variability is null or heart_rate_variability between 1 and 500),
  add column if not exists objective_metric_sources jsonb not null default '{}'::jsonb
    check (jsonb_typeof(objective_metric_sources) = 'object'),
  add column if not exists objective_metrics_updated_at timestamptz;

comment on column public.daily_state.heart_rate_variability is
  'Morning HRV in milliseconds. Evaluated only against the user personal baseline after sufficient observations.';

comment on column public.daily_state.objective_metric_sources is
  'Per-metric provenance such as MANUAL or APPLE_HEALTH.';
