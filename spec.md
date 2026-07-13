# spec.md — FAMX Product Specification

## 1. Overview

FAMX is a single-vendor agency client portal built as one Next.js application. Clients submit project requests for creative/professional services; FAMX's Admin quotes, collects payment, executes, and delivers — all tracked per-project with an attached chat thread.

**Roles**: `CLIENT`, `ADMIN`. No other roles in v1.

**Primary currency**: USD. Single currency only.

## 2. User Roles & Permissions

| Capability | Client | Admin |
|---|---|---|
| Sign up / log in | ✅ (self-serve, email+password or Google) | Provisioned manually (no self-serve admin signup) |
| Create a project | ✅ | ❌ |
| View own projects | ✅ | ✅ (all projects) |
| View other clients' projects | ❌ | ✅ |
| Set/change quote amount | ❌ | ✅ (only Admin) |
| Toggle "Ready for Payment" + set amount | ❌ | ✅ |
| Make payment | ✅ | ❌ |
| Change project status | ❌ (implicitly via actions like cancel) | ✅ |
| Cancel a project | ✅ (only before `IN_PROGRESS`) | ✅ (any time) |
| Flag a completed project as disputed | ✅ | ✅ |
| Send/receive chat messages on a project | ✅ (own projects only) | ✅ (all projects) |
| Manage service catalog | ❌ | ❌ in-app (DB-seeded only in v1) |

There is no email-verification gate — a client can use the app immediately after signup.

## 3. Data Entities (conceptual — see `plan.md` §5 for exact Prisma schema)

### 3.1 User
- id, email, passwordHash (managed by Supabase Auth), role (`CLIENT` | `ADMIN`), name, createdAt
- Notification preference: `emailNotificationsEnabled` (boolean, default true)
- Stripe customer reference (for saved payment methods, if applicable)

### 3.2 Service (catalog)
- id, name (e.g. "Web Design", "UI Design", "Graphic Design"), description, isActive
- Seeded directly in the database; no in-app CRUD UI in v1.

### 3.3 Project
- id, clientId (FK → User)
- serviceId (FK → Service, nullable) — nullable because a client may submit a **custom/free-text service** instead of picking from the catalog
- customServiceText (string, nullable) — populated when serviceId is null
- title, description, requirements (long text)
- attachments (one or more files — see §3.5)
- proposedBudget (decimal, client-entered, non-binding)
- timelineTier (`INSTANT` | `WITHIN_WEEK` | `WITHIN_MONTH` | `CUSTOM_DATE`)
- customExpectedDate (date, nullable — populated only when timelineTier = `CUSTOM_DATE`)
- quoteAmount (decimal, nullable — Admin-set, becomes non-null once status reaches `QUOTED`)
- status (`SUBMITTED` | `QUOTED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`)
- isDisputed (boolean, default false — only meaningful when status = `COMPLETED`)
- createdAt, updatedAt

### 3.4 Payment
- id, projectId (FK), stripePaymentIntentId / stripeCheckoutSessionId, amount, status (`PENDING` | `SUCCEEDED` | `FAILED`), createdAt
- A project can have **multiple** Payment records over its life (e.g. a deposit, then a final payment) since the Admin can toggle "Ready for Payment" more than once.

### 3.5 Attachment
- id, projectId (FK, nullable — can also attach to a chat message), uploaderUserId, fileName, storagePath (Supabase Storage), mimeType, sizeBytes, createdAt

### 3.6 ProjectMessage (chat)
- id, projectId (FK), senderUserId, body (text, nullable if attachment-only), attachmentId (FK, nullable), createdAt, readAt (nullable, per-recipient read tracking — see §6.4 for exact mechanics)

### 3.7 Notification
- id, userId (recipient), type (`NEW_MESSAGE` | `QUOTE_RECEIVED` | `PAYMENT_REQUESTED` | `PROJECT_STATUS_CHANGED` | ...), projectId (FK, nullable), read (boolean), createdAt

## 4. Project Lifecycle

```
SUBMITTED → QUOTED → IN_PROGRESS → COMPLETED
    │           │
    └─────→ CANCELLED (client, only from SUBMITTED or QUOTED; or Admin, any time before COMPLETED)
```

- **SUBMITTED**: client just created the project. `quoteAmount` is null.
- **QUOTED**: Admin has entered a `quoteAmount`. If the client wants a different number, that happens via chat — Admin simply updates `quoteAmount` again (still `QUOTED`, no new status). There is no formal accept/reject action.
- **IN_PROGRESS**: Admin manually flips this once they've confirmed (via chat) the client is proceeding. This is **not** gated by payment completion — payment can be requested before or during `IN_PROGRESS` at Admin's discretion (see §5).
- **COMPLETED**: Admin marks this once work is delivered. No separate "Delivered" state.
- **CANCELLED**: reachable by client only while `SUBMITTED` or `QUOTED` (i.e., before work has started / before `IN_PROGRESS`). Admin can cancel at any stage prior to `COMPLETED`.
- **Dispute**: once `COMPLETED`, either party can flag `isDisputed = true`. This is a flag only — no workflow, no automatic refund, no status change. Resolution happens manually (chat + Admin action outside the flag itself).

### 4.1 Cancellation & Refunds
- Client-initiated cancellation is only allowed pre-`IN_PROGRESS` (i.e., before any payment would typically have been collected).
- If a payment was somehow already collected before cancellation, or a dispute arises after completion, **refunds are handled outside the platform** (Stripe Dashboard or bank transfer) — FAMX Admin manually reflects the outcome by updating the project record. No in-app refund trigger.

## 5. Payments

- Stripe is the payment processor.
- The Admin controls a **"Ready for Payment"** toggle on a project's detail page. Turning it on requires entering an amount (defaults to `quoteAmount` but is editable per-request — supports deposits/milestones).
- On toggle-on, the system creates a Stripe Checkout Session (or PaymentIntent) for exactly that amount and surfaces a "Pay Now" action to the client, showing the same amount the Admin entered.
- Multiple payment requests can be issued across a project's life (e.g., 50% deposit, then remainder before delivery) — this is entirely at Admin discretion, not a system-enforced milestone schema.
- Successful payments are recorded via Stripe webhook → `Payment` row with status `SUCCEEDED`.
- "Total money spent" (shown on the client Overview) = sum of all `SUCCEEDED` payments across all of that client's projects.
- No refund API integration (see §4.1).

## 6. Client Application — Information Architecture

> **Note on scope**: the sections below define *functional* structure — what each screen must contain and do. Visual design (layout, styling, spacing, component look) is being designed separately in Figma by the product owner and will supersede any implied visual detail here once provided. See `claude.md` §3.6.

Left panel navigation:

### 6.1 Overview
- Hero card: "Start a Project" button (→ New Project flow) + "View All Projects" button (→ My Projects)
- Stats row: Total Projects, Active Projects, Completed Projects, Total Money Spent
- "Recent Projects" list below (most recently updated, small card previews)

### 6.2 My Projects
- Filter tabs: All / Active (Submitted+Quoted+In Progress) / Completed
- Grid/gallery of project cards. Each card shows: title, service/category, status badge, quote or proposed budget, expected timeline, last-message preview snippet, unread indicator.
- Clicking a card opens the project detail view (brief + status + chat, client-facing version — no quote-editing controls, obviously).

### 6.3 New Project (stepwise wizard)
1. **Category** — select from catalog (Web Design / UI / Graphic Design / ...) or choose "Other" to free-text a custom service.
2. **Details** — title, description/requirements, optional PDF/document/image attachment(s).
3. **Budget & Timeline** — proposed budget (number input) + timeline tier selector: Instant/Rush, Within a Week, Within a Month, or a custom date picker. Budget and timeline are independent fields — timeline tiers do not auto-populate a suggested budget.
4. Review & Submit → creates Project with status `SUBMITTED`, notifies Admin.

### 6.4 Messages
- A **notification feed**, not a unified inbox: entries like "Admin replied on [Project Title]" with a timestamp. Clicking an entry navigates to that project's own chat thread (there is no message-reading UI on this page itself).
- Read/unread state per notification entry.

### 6.5 Settings
- Profile: name, email (read-only or change-with-reverification depending on Supabase Auth capability — see `plan.md`), avatar (optional).
- Notification preferences: toggle `emailNotificationsEnabled`.
- Payment methods: view/manage saved Stripe payment methods (via Stripe Customer Portal or embedded Stripe Elements — decide in `plan.md`).

## 7. Admin Application — Information Architecture

> **Note on scope**: as with §6, this defines functional content/structure only — final visual design comes from Figma (see `claude.md` §3.6).

Deliberately minimal — a single **All Projects** list/table view (no separate multi-section panel in v1):

- Searchable (by project title or client name), filterable by status, sortable by date (created/updated).
- Clicking a row opens the **Project Detail page**, a single scrollable page containing:
  - Client info (name, email, contact)
  - Full brief: description, requirements, attachments (viewable/downloadable)
  - Quote input field (sets/updates `quoteAmount`)
  - "Ready for Payment" toggle + amount field (triggers Stripe request as described in §5)
  - Status dropdown: Submitted / Quoted / In Progress / Completed (manually advances the project)
  - Dispute flag toggle (visible/actionable once status = Completed)
  - Chat panel (same thread the client sees)

No separate service-catalog management UI, no separate Clients list, no separate Payments section — all of that is either DB-seeded (catalog) or visible in-context on the project page (payments, client info).

## 8. Chat

- One thread per project. Participants: the owning Client + any Admin.
- Supports: text messages, image attachments, PDF/document attachments.
- Delivery: near-real-time via Supabase Realtime (see `plan.md` §6.3–6.4 for the technical rationale and upgrade path).
- No typing indicators or presence indicators in v1.
- New messages generate: (a) an in-app Notification-feed entry for the recipient, (b) an email if the recipient has `emailNotificationsEnabled = true`.

## 9. Notifications

Channels: **email** + **in-app notification feed/bell**. No push notifications in v1.

Triggering events:
- New chat message (to the non-sender party)
- Quote received/updated (client)
- Payment requested (client)
- Payment succeeded (both, optional for Admin)
- Status change (client)
- New project submitted (Admin)

Each User can globally disable email notifications via Settings; in-app notifications are always generated regardless (cannot be disabled in v1).

## 10. Security & Data Isolation

- Clients can only ever see/access their own projects, attachments, messages, and payments.
- Admin can see everything.
- Enforcement is layered: application-level authorization in the data-access layer (primary, since Prisma is used server-side) + Postgres RLS policies mirroring the same rules (defense-in-depth, and the actual primary control for the Supabase Realtime chat subscription). See `claude.md` §3.1 and `plan.md` §6 for full detail.
- No special encryption requirements beyond what Supabase/Stripe provide by default; no formal audit-log requirement in v1 (basic `createdAt`/`updatedAt` timestamps suffice).

## 11. Non-Functional Requirements

- **Scale target**: MVP — tens to low-hundreds of concurrent clients. Design sensibly; do not over-engineer for scale that doesn't exist yet.
- **Hosting**: Vercel.
- **Testing**: unit/integration tests for business logic (status transitions, payment amount handling, authorization checks in the data-access layer) + Playwright E2E covering: signup → create project → (as Admin) quote → (as client) pay → (as Admin) complete.
- **Accessibility**: standard semantic HTML, keyboard navigability, sufficient color contrast on status badges — no formal WCAG audit required for v1 but shouldn't be actively inaccessible.
- **Responsiveness**: fully responsive; client dashboard especially should work well on mobile (card view was explicitly chosen with this in mind).

## 12. Explicitly Out of Scope for v1

See `claude.md` §5 for the authoritative list (kept in one place to avoid drift between documents).
