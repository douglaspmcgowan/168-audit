# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who want to understand where their 168 weekly hours go, including first-time auditors who need guidance, returning users who want a fast editing path, keyboard and assistive-technology users, and distracted mobile users completing the audit over several sessions.

## Product Purpose

Help a person describe an ideal week, reconstruct an actual week, reconcile each against the fixed 168-hour budget, interpret the largest gaps, and leave with a small, concrete plan. Success means a first-time user can understand the workflow immediately, safely resume after interruption, complete every step on any supported interface, and retain or export a trustworthy record.

## Positioning

The product treats a week as one fixed 168-hour allocation. Ideal and actual schedules share one editable model, making tradeoffs and discrepancies visible without requiring continuous time tracking.

## Operating Context

People may complete the audit in one sitting or across several sessions on desktop, tablet, or mobile. The core workflow is Plan, Compare, Reflect, History, and Center. A schedule may remain local, be backed up or exported, or be synchronized and selectively shared with a group when cloud access is configured.

## Capabilities and Constraints

- Ideal and actual weeks must each reconcile against a fixed 168-hour total.
- Categories contain one or more subcategories with hours and optional notes.
- Focus and All views edit the same schedule.
- Hours can be edited with number inputs or sliders.
- Category colors connect worksheet groups to the allocation chart.
- Local browser persistence, JSON recovery, CSV and Markdown exports, print, and read-only links protect portability.
- History snapshots preserve earlier schedule states.
- Center supports accounts, groups, invitations, membership, and explicitly shared schedules when Supabase is configured.
- Cloud controls remain unavailable when the public Supabase runtime configuration is absent.

## Brand Commitments

The product name is “168 — Audit Your Week.” Its personality is calm, candid, trustworthy, professional, clean, minimalist, and effective.

## Anti-references

Avoid surveillance-oriented time trackers, dense spreadsheet-only experiences, motivational dashboards that reward false precision, ornamental SaaS styling, and interfaces that hide local-data limitations.

## Evidence on Hand

- The runnable application and product copy are in `server.js`.
- Browser journeys and accessibility checks are in `tests/verify-live.mjs` and `tests/verify-overview.mjs`.
- Cloud role and sharing contracts are exercised in `tests/verify-cloud-ui.mjs`, `tests/verify-supabase-live.mjs`, and `tests/verify-supabase-ui-live.mjs`.
- The Supabase schema and row-level-security policies are in `supabase/schema.sql`.
- No testimonials, adoption claims, or outcome benchmarks are established; future work must not fabricate them.

## Product Principles

1. Make the next useful action obvious.
2. Keep the fixed 168-hour constraint visible and understandable.
3. Reveal complexity progressively while preserving a fast expert path.
4. Explain data behavior and calculations in plain language.
5. Protect progress through automatic saving, recovery, and portable exports.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Support keyboard-only completion, screen-reader semantics, 200% zoom and reflow, visible focus, reduced motion, color-independent status, 44px touch targets, light and dark themes, long and international text, and completion at 320px width.
