# CLAUDE.md — FAMX Engineering Guide

> Read this first. This file orients any engineer (human or AI) working in the FAMX codebase: what the product is, how the system is organized, the non-obvious decisions that shape the code, and the conventions to follow. For full product rules see `spec.md`. For architecture detail see `plan.md`. For the build sequence see `tasks.md`.

## 1. What FAMX Is

FAMX is a single-vendor agency client portal. FAMX (the company) provides creative/professional services (web design, UI design, graphic design, and custom services). Clients submit project requests with a proposed budget, requirements, and a target timeline. FAMX's Admin reviews each request, sets a binding quote, collects payment via Stripe, executes the work, and marks it complete — all coordinated through a per-project chat thread.

This is **not** a marketplace. There are no freelancers, no bidding, no matching algorithm. There is exactly one internal team (modeled as one or more Admin users) fulfilling every request.

## 2. Core Mental Model

Three nouns drive everything:

- **User** — either `CLIENT` or `ADMIN`. Two roles only. No staff/finance sub-roles in v1, but the schema must not hard-code "single admin" — allow multiple Admin rows.
- **Project** — the unit of work. Owned by exactly one Client. Has a lifecycle status, a proposed budget, an admin-set quote, a payment record, and a timeline tier.
- **ProjectMessage** — belongs to exactly one Project. The chat is scoped 1:1 to a project; there is no cross-project or DM messaging.

Everything else (payments, notifications, services catalog) hangs off these three.

## 3. Non-Obvious Decisions (read before touching auth/data access)

These decisions are easy to get wrong by defaulting to "typical Supabase tutorial" patterns. Don't.

### 3.1 Prisma is the source of truth for data access — RLS is defense-in-depth, not the primary gate

We use **Prisma** from server-only code (Server Actions, Route Handlers) to talk to Postgres. Prisma connects with a privileged database role and does **not** carry the end user's JWT into Postgres — so Supabase Row Level Security policies do **not** see `auth.uid()` correctly for Prisma queries the way they would for a browser client hitting PostgREST. This means:

- **Authorization for anything that goes through Prisma must be enforced explicitly in the data-access layer** (see `plan.md` §6.2) — every query that returns or mutates a `Project`, `ProjectMessage`, `Payment`, etc. must filter/check ownership (`clientId === session.user.id`) or role (`session.user.role === 'ADMIN'`) in application code. Never assume the database is protecting you when the call went through Prisma.
- We still **enable RLS on every table** as a safety net (in case of misconfiguration, direct API exposure, or future client-side Supabase usage), with policies that mirror the app-layer rules.
- The **one place RLS is the primary enforcement mechanism** is the chat feature: the browser subscribes to Supabase Realtime directly using the signed-in user's session, so the `project_messages` RLS policy (client sees only messages on their own projects; admin sees all) is what actually protects that data in transit. Get that policy right and test it from the client SDK, not the SQL editor (the SQL editor bypasses RLS and will give false confidence).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` (or the new `sb_secret_...` key) to any client bundle. It only belongs in server-only environment variables, never `NEXT_PUBLIC_*`.

### 3.2 Chat uses Supabase Realtime, not a third-party pub/sub service

Given our scale target (tens to low-hundreds of clients, well under Supabase's 500-concurrent-connection Pro tier), Supabase Realtime (Postgres change feeds + Broadcast) is used for the project chat. No Pusher/Ably in v1. If concurrent connections approach ~500 or message-delivery guarantees become business-critical, re-evaluate Ably as the documented upgrade path (see `plan.md` §6.4) — but don't add that complexity prematurely.

### 3.3 Payment amounts are always Admin-entered, never system-computed

There is no pricing engine. The client's initial budget is a non-binding proposal. The Admin always types the actual amount to charge (whether that's the full quote, a deposit, or a milestone) via a "Ready for Payment" action on the project. That amount becomes a Stripe PaymentIntent/Checkout Session, and what the client sees on screen must match exactly what was entered — no rounding, currency conversion, or fee-adjustment logic should silently change that number.

### 3.4 Status is a simple linear enum, not a graph

`ProjectStatus = SUBMITTED | QUOTED | IN_PROGRESS | COMPLETED` (+ a boolean `isDisputed` flag on Completed projects, +  a separate terminal `CANCELLED` state reachable only from `SUBMITTED` or `QUOTED`). Resist the urge to add a `DELIVERED`, `IN_REVIEW`, or `REJECTED` state — those were deliberately scoped out. "Client wants changes to the quote" is handled as a chat conversation, not a status transition; the Admin simply issues a new quote value on the same `QUOTED` status.

### 3.5 Refunds are out-of-band

Do not build Stripe refund API integration. When a dispute or pre-payment cancellation needs a refund, Admin handles it directly in the Stripe Dashboard or via bank transfer, and manually updates the FAMX record. Don't be tempted to "complete the feature" by wiring up `stripe.refunds.create` — it was explicitly descoped.

## 3.6 UI/Visual Design Comes From Figma, Not From These Docs

The product owner is designing the actual UI/UX themselves in Figma, based on the backend/data model and functional requirements defined here. Treat every layout, IA, and "screen contains X" description in `spec.md` §6–7 as a **functional/content specification only** — it tells you what data and actions a screen needs, not what it should look like.

Concretely:
- **Do not invent visual design direction** (color palette, typography, spacing system, component styling) beyond sensible, neutral defaults, until Figma designs are provided.
- When Figma designs are shared (screenshots, exported assets, or a file link), **they take precedence over any visual assumption in these docs** — rebuild the affected UI to match the Figma design exactly (layout, spacing, component states, responsive behavior), while keeping the underlying data/actions/authorization rules from `spec.md`/`plan.md` unchanged.
- If a Figma screen implies a functional change (a new field, a different flow step, a status not in the current model), stop and flag the discrepancy rather than silently expanding scope — functional changes still need to route through `spec.md`.
- Until Figma is provided for a given screen, implement it with clean, minimal, unstyled-but-usable markup (per `frontend-design` conventions) so it's functional and easy to restyle later — don't invest heavily in bespoke visual polish that will likely be discarded once the real design arrives.

## 4. Repository Conventions

- **Framework**: Next.js App Router, single app, TypeScript strict mode.
- **Data layer**: Prisma schema is the single source of truth for the data model. Never hand-edit generated migrations; always `prisma migrate dev` and commit the migration.
- **Data access pattern**: all reads/writes go through a `lib/data/*` module per entity (e.g. `lib/data/projects.ts`) that internally enforces the authorization rule from §3.1. Server Actions and Route Handlers call these modules — they never call `prisma.*` directly. This keeps the one place authorization can leak to a single reviewable surface.
- **Auth**: Supabase Auth (email/password + Google OAuth). Session/user role is read via Supabase server helpers in middleware and passed into the data-access layer — never trust a role claim from the client without re-verifying server-side.
- **Styling**: Tailwind, component conventions defined in `plan.md` §7.
- **Testing**: co-locate unit tests next to the module (`*.test.ts`), Playwright E2E specs live in `/e2e`. See `plan.md` §9 for the required critical-path E2E coverage.
- **Environment variables**: documented exhaustively in `plan.md` §8.3 — never introduce a new secret without adding it there.

## 5. What NOT to build (explicitly out of scope for v1)

- Multi-admin assignment/ownership logic (schema allows it, UI doesn't need it yet)
- In-app service catalog management UI (seeded directly in DB)
- Formal revision/change-request workflow after completion
- SLA enforcement/escalation on the expected completion date (informational only)
- In-platform Stripe refunds
- Multi-currency
- Email verification gate on signup
- Any bidding/matching/marketplace mechanics

If a request seems to need one of these, stop and confirm scope before implementing — these were deliberate cuts, not oversights.

## 6. Where to Look Next

- Full product rules, edge cases, and UX flows → `spec.md`
- System architecture, schema, API surface, security model, deployment → `plan.md`
- Ordered, checklist-style implementation plan → `tasks.md`
