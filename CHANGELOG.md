# Changelog

This file records verified Coach Dominion release capabilities. The repository has no release tags or authoritative release dates, so dates are intentionally omitted.

## Unreleased — Build 004C: Dominion Record Trends & Analytics

- Added deterministic four-week finalized-inspection trajectories, evidence-quality precedence, five domain directions, historical summaries, and calendar-contiguous compliance streaks.
- Added responsive dependency-free SVG discipline and evidence charts with finalized/provisional distinctions, fixed axes, limited-evidence flags, accessible text equivalents, and empty states.
- Added a rule-based Atlas Trend Report that distinguishes insufficient evidence from documented poor performance.
- Added user-scoped Supabase/local history derivation without storing redundant analytics state or recalculating finalized snapshots.
- Added dependency-free trend analytics tests and included them in the full test command.
- This remains unreleased Build 004C work toward Release 0.4.0; it does not mark the release complete.

## Unreleased — Build 004B: Weekly Inspection & After Action Report

- Added deterministic Monday-through-Sunday aggregation of Build 004A Dominion Record observations, including five domain scores, observation/day counts, evidence coverage, tie-aware rankings, safety signals, and rule-based next-week priorities.
- Added the Weekly Inspection War Room panel with week selection, evidence review, Atlas After Action Report, finalization controls, and read-only historical snapshots.
- Added owner-scoped `weekly_inspections` persistence with finalized-snapshot protection and user/week-scoped browser-local fallback.
- Added dependency-free weekly inspection tests and included them in the complete test command.
- This remains unreleased Build 004B work toward Release 0.4.0; it does not mark the release complete.

## Unreleased — Build 004A: Dominion Record Compliance Foundation

- Added five-domain daily execution records for mission, strength, running/cardio, recovery, and nutrition compliance.
- Added deterministic equal-weight Discipline Score calculation with transparent included/excluded evidence and an unscored state.
- Added non-punitive excused, not-applicable, restriction, and approved-modification representation without creating violations.
- Added an editable Dominion Record panel with Supabase persistence and isolated browser-local fallback behavior.
- Added the owner-scoped `daily_compliance` migration and deterministic Node assertion coverage.
- This is foundation work toward Release 0.4.0; Weekly Inspection and a full violations system remain out of scope.

## Release 0.3.1 — Atlas Morning Brief

- Added a deterministic Atlas command-voice layer driven by the existing readiness result.
- Added the four command states: Roll Call Required, Mission Authorized, Mission Reduced, and Hard Training Denied.
- Added a War Room Morning Brief panel with status, directive, command note, orders, restrictions, confidence, risk, and missing-evidence context.
- Added Node assertion coverage for all command states and RED/YELLOW safety constraints.

## Release 0.3.0 — Readiness Engine 2.0

- Expanded readiness output with confidence weighting, rationale, evidence availability, primary risk, instructions, and restrictions.
- Preserved deterministic GREEN, YELLOW, and RED readiness behavior, including the pain override.
- Connected mission, Daily Intelligence, and command-feed behavior to the shared readiness result.
- Added the dependency-free readiness-engine test suite.

## Release 0.2.0 — War Room and Mission Board

- Expanded the authenticated application into a War Room command-center layout.
- Added the Mission Board, readiness intelligence, command feed, Daily Intelligence, status bar, and Daily State summary.
- Added generated mission guidance and command events based on the user's current Daily State.

## Release 0.1.0 — Daily State Engine

- Added Morning Roll Call capture for energy, soreness, pain, optional recovery metrics, confidence, and comments.
- Added deterministic readiness and mission foundations in the browser application.
- Added Supabase `daily_state` and `command_feed` schema migrations with validation, row-level security, and user-scoped policies.
- Added authenticated persistence and retrieval of each user's current daily state.
