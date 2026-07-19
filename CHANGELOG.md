# Changelog

This file records verified Coach Dominion release capabilities. The repository has no release tags or authoritative release dates, so dates are intentionally omitted.

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
