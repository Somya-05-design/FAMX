# tasks.md — FAMX Implementation Checklist

> Ordered by the phases in `plan.md` §10. Each phase should be functionally testable before moving to the next. Do not start any of this until explicitly told "Start coding."

## Phase 0 — Project Setup

- [x] Initialize Next.js App Router project (TypeScript strict mode)
- [x] Set up ESLint/Prettier config, commit hooks (lint-staged + husky, or equivalent)
- [x] Create Supabase project (dev/staging) and a separate one for production
- [x] Install and configure Prisma; point `DATABASE_URL`/`DIRECT_URL` at Supabase Postgres
- [x] Configure Tailwind
- [ ] Set up Vercel project, connect repo, configure preview deployments
- [x] Add all env vars from `plan.md` §8.3 to local `.env.local` (never commit) and Vercel project settings

## Phase 1 — Foundation (Data Model, Auth, RLS)

- [x] Write full Prisma schema per `plan.md` §3; run initial migration
- [x] Seed `Service` table with initial catalog entries (Web Design, UI Design, Graphic Design)
- [x] Configure Supabase Auth: enable email/password + Google OAuth provider
- [x] Ensure `User.id` matches `auth.users.id` — implement a Supabase Auth trigger (or app-layer hook) that creates the corresponding `User` row on signup, defaulting `role = CLIENT`
- [ ] Manually create the first `ADMIN` user (update role directly in DB — no self-serve admin signup)
- [x] Write RLS policies for every table per `plan.md` §5; commit as raw-SQL Prisma migration
- [ ] **Verify RLS from the client SDK (not the SQL editor)**: confirm a Client-role JWT cannot read another client's `Project`/`ProjectMessage` rows
- [x] Build `lib/data/` scaffolding with the session-first pattern from `plan.md` §4 (start with `users.ts`, `projects.ts` stubs)
- [x] Build Next.js middleware for session handling + route-group role gating (`(client)` vs `(admin)`)
- [x] Build shared layout shells for Client and Admin route groups (left nav per `spec.md` §6/§7, no functional pages yet)

## Phase 2 — Core Project Flow

- [x] `lib/data/projects.ts`: `createProject`, `getProjectsForUser`, `getProjectById`, `updateProjectStatus`, `updateQuoteAmount` — each enforcing authorization per `plan.md` §4
- [x] Client: New Project wizard
  - [x] Step 1 — category selection (catalog cards + "Other" free-text option)
  - [x] Step 2 — title/description/requirements + file upload (Supabase Storage)
  - [x] Step 3 — proposed budget input + timeline tier selector (Instant/Week/Month/Custom date)
  - [x] Step 4 — review & submit → creates `Project` with `status = SUBMITTED`
  - [ ] Trigger `NEW_PROJECT_SUBMITTED` notification to Admin(s) (Phase 5)
- [x] Client: Overview page — hero card, stats (total/active/completed/total spent), recent projects list
- [x] Client: My Projects page — status filter tabs, project card grid, empty states
- [x] Client: Project detail view (read-only brief + status + chat placeholder for now)
- [x] Client: cancellation action (only enabled while `SUBMITTED`/`QUOTED`)
- [x] Admin: All Projects list — search (title/client name), status filter, sort by date
- [x] Admin: Project detail page — client info, full brief + attachments, quote input, status dropdown, dispute toggle (chat panel wired in Phase 4)
- [x] Implement and test the full status transition matrix (`SUBMITTED → QUOTED → IN_PROGRESS → COMPLETED`, `CANCELLED` branches) with unit tests asserting illegal transitions are rejected

## Phase 3 — Payments

- [ ] Stripe account setup (test mode), configure webhook endpoint locally (Stripe CLI) and in Vercel
- [x] `lib/data/payments.ts`: `createPaymentRequest(session, projectId, amount)` (Admin-only) → creates Stripe Checkout Session, persists `Payment` row with `status = PENDING`
- [x] Admin: "Ready for Payment" toggle + amount field on project detail page
- [x] Client: "Pay Now" action on project detail/card showing the exact Admin-entered amount, redirecting to Stripe Checkout
- [x] `/api/webhooks/stripe` route handler: verify signature, handle `checkout.session.completed` → update `Payment.status = SUCCEEDED`, trigger `PAYMENT_SUCCEEDED` notification + email (Phase 5)
- [x] Handle `checkout.session.expired`/failed cases → `Payment.status = FAILED`
- [x] Client Settings: "Manage Payment Methods" link to Stripe Customer Portal
- [x] Display payment history (list of `Payment` rows) on project detail page (both sides)
- [x] Compute and display "Total Money Spent" on client Overview from `SUCCEEDED` payments

## Phase 4 — Chat

- [ ] `lib/data/messages.ts`: `getMessagesForProject`, `postMessage` (with authorization + attachment handling)
- [ ] Build `ChatPanel` shared component (role-agnostic UI, used in both Client and Admin project detail views)
- [ ] Wire Supabase Realtime subscription (Postgres Changes on `ProjectMessage`, filtered by `projectId`)
- [ ] Support text messages, image attachments, PDF/document attachments (upload to Supabase Storage, link via `Attachment`)
- [ ] Trigger `NEW_MESSAGE` notification (in-app + conditional email) to the non-sender party on every new message
- [ ] Verify chat RLS policy again end-to-end (client A cannot subscribe to client B's project thread)

## Phase 5 — Notifications

- [ ] `lib/data/notifications.ts`: create/list/mark-read
- [ ] `NotificationBell` component (client) — feed of entries per `spec.md` §6.4, links into the relevant project
- [ ] Wire all trigger events end-to-end: new message, quote received/updated, payment requested, payment succeeded, status changed, new project submitted
- [ ] Email templates (Resend) for each triggering event; respect `emailNotificationsEnabled` (except payment receipts — confirm policy per `plan.md` §6.6)
- [ ] Client Settings: notification preference toggle wired to `User.emailNotificationsEnabled`

## Phase 6 — Settings & Polish

- [ ] Client Settings: profile (name, email, avatar if in scope)
- [ ] Responsive/mobile pass across client dashboard (card views, wizard, chat) — this is a priority area per `spec.md` §11
- [ ] Empty states, loading states, and error states across all pages
- [ ] Basic accessibility pass (semantic HTML, focus states, contrast on status badges)
- [ ] Copy pass on all client-facing status labels, notification text, email templates

## Phase 7 — Testing & Hardening

- [ ] Unit tests for every `lib/data/*` function — explicitly test the authorization boundary (cross-client access denied, admin allowed) and business rules (illegal status transitions rejected, payment amount fidelity)
- [ ] Playwright E2E suite covering the five critical paths in `plan.md` §9
- [ ] Full RLS policy re-verification pass using the client SDK against a non-privileged session for every table
- [ ] Confirm no service-role or Stripe secret keys are present in any client-side bundle (build and grep `.next/static` output)
- [ ] Load-check chat under expected concurrent connection count (well under Supabase's ~500 Pro-tier ceiling at our scale) — sanity check only, not a formal load test
- [ ] Production deployment checklist: separate prod Supabase project, prod Stripe keys (live mode), prod env vars set in Vercel, `prisma migrate deploy` run against production DB
- [ ] Final smoke test in production (test client account) end-to-end before go-live

## Explicitly Deferred (do not build unless scope changes)

- Multi-admin project assignment/ownership UI
- In-app service catalog management
- Formal revision/change-request workflow post-completion
- SLA enforcement/escalation on expected completion dates
- In-platform Stripe refund triggering
- Multi-currency support
- Email verification gate on signup
- Any marketplace/bidding/matching mechanics
