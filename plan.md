# plan.md — FAMX Technical Architecture & Implementation Plan

## 1. Tech Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript strict | Single full-stack app, Server Actions fit our Admin-triggered mutations well |
| Database | Postgres via Supabase | Managed, integrates with Auth/Storage/Realtime |
| ORM | Prisma | Type-safe schema/migrations; team preference |
| Auth | Supabase Auth | Email/password + Google OAuth, session cookies work cleanly with Next.js middleware |
| File storage | Supabase Storage | Attachments (project briefs, chat files) |
| Realtime | Supabase Realtime | Chat delivery; free at our scale, no extra vendor |
| Payments | Stripe (Checkout Sessions + Webhooks) | Industry standard, good Next.js support |
| Email | Resend (or SendGrid) | Transactional email for notifications |
| Hosting | Vercel | Native Next.js integration, preview deploys |
| Testing | Vitest/Jest (unit) + Playwright (E2E) | Standard, good CI support |

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App (Vercel)                     │
│                                                               │
│  ┌───────────────┐   ┌──────────────────┐   ┌─────────────┐ │
│  │  Client (RSC/  │   │  Server Actions /│   │  Route      │ │
│  │  Client Comps) │──▶│  data-access     │──▶│  Handlers   │ │
│  │                │   │  layer (lib/data)│   │  (webhooks) │ │
│  └───────┬────────┘   └────────┬─────────┘   └──────┬──────┘ │
│          │                     │                     │        │
│          │ direct (browser)    │ Prisma (server role) │        │
│          ▼                     ▼                     ▼        │
└──────────┼─────────────────────┼─────────────────────┼────────┘
           │                     │                     │
   Supabase Realtime      Postgres (Supabase)     Stripe API
   (chat subscription,    via Prisma              (Checkout,
    RLS-enforced)         (app-layer auth)          Webhooks)
           │
   Supabase Storage
   (attachments, RLS-enforced on direct access;
    signed URLs issued server-side otherwise)
```

Two distinct access paths matter for security reasoning:
1. **Server-side path** (Server Actions/Route Handlers → Prisma → Postgres): authorization enforced in `lib/data/*`. RLS present but not relied upon here.
2. **Browser-direct path** (chat Realtime subscription, and any direct Storage downloads using signed/RLS-protected URLs): RLS is the actual enforcement mechanism.

## 3. Database Schema (Prisma)

```prisma
enum UserRole {
  CLIENT
  ADMIN
}

enum ProjectStatus {
  SUBMITTED
  QUOTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TimelineTier {
  INSTANT
  WITHIN_WEEK
  WITHIN_MONTH
  CUSTOM_DATE
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
}

enum NotificationType {
  NEW_MESSAGE
  QUOTE_RECEIVED
  PAYMENT_REQUESTED
  PAYMENT_SUCCEEDED
  PROJECT_STATUS_CHANGED
  NEW_PROJECT_SUBMITTED
}

model User {
  id                      String    @id @default(uuid()) // matches Supabase auth.users.id
  email                   String    @unique
  name                    String?
  role                    UserRole  @default(CLIENT)
  emailNotificationsEnabled Boolean @default(true)
  stripeCustomerId        String?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  projects                Project[]
  messages                ProjectMessage[]
  notifications           Notification[]
  attachments             Attachment[]
}

model Service {
  id          String   @id @default(uuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  projects    Project[]
}

model Project {
  id                 String        @id @default(uuid())
  clientId           String
  client             User          @relation(fields: [clientId], references: [id])
  serviceId          String?
  service            Service?      @relation(fields: [serviceId], references: [id])
  customServiceText  String?
  title              String
  description        String
  requirements        String?
  proposedBudget     Decimal       @db.Decimal(10, 2)
  timelineTier       TimelineTier
  customExpectedDate DateTime?
  quoteAmount        Decimal?      @db.Decimal(10, 2)
  status             ProjectStatus @default(SUBMITTED)
  isDisputed         Boolean       @default(false)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  attachments        Attachment[]
  messages           ProjectMessage[]
  payments           Payment[]
  notifications      Notification[]

  @@index([clientId])
  @@index([status])
}

model Attachment {
  id            String   @id @default(uuid())
  projectId     String?
  project       Project? @relation(fields: [projectId], references: [id])
  uploaderId    String
  uploader      User     @relation(fields: [uploaderId], references: [id])
  fileName      String
  storagePath   String
  mimeType      String
  sizeBytes     Int
  createdAt     DateTime @default(now())
  messages      ProjectMessage[]

  @@index([projectId])
}

model ProjectMessage {
  id           String      @id @default(uuid())
  projectId    String
  project      Project     @relation(fields: [projectId], references: [id])
  senderId     String
  sender       User        @relation(fields: [senderId], references: [id])
  body         String?
  attachmentId String?
  attachment   Attachment? @relation(fields: [attachmentId], references: [id])
  createdAt    DateTime    @default(now())

  @@index([projectId, createdAt])
}

model Payment {
  id                    String        @id @default(uuid())
  projectId             String
  project               Project       @relation(fields: [projectId], references: [id])
  stripeSessionId       String?
  stripePaymentIntentId String?
  amount                Decimal       @db.Decimal(10, 2)
  status                PaymentStatus @default(PENDING)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  @@index([projectId])
}

model Notification {
  id        String            @id @default(uuid())
  userId    String
  user      User              @relation(fields: [userId], references: [id])
  type      NotificationType
  projectId String?
  project   Project?          @relation(fields: [projectId], references: [id])
  read      Boolean           @default(false)
  createdAt DateTime          @default(now())

  @@index([userId, read])
}
```

Notes:
- `User.id` should equal the Supabase `auth.users.id` UUID so we never maintain a separate identity mapping table.
- All monetary values are `Decimal(10,2)` — never use floats for money.
- Every FK-bearing table has an index on the FK used for ownership filtering (`clientId`, `projectId`, `userId`) since that's the column every authorization check filters on.

## 4. Authorization: The Data-Access Layer Pattern

Per `claude.md` §3.1, Prisma bypasses RLS at the connection level, so we implement a mandatory data-access layer:

```
lib/data/
  projects.ts     // getProjectsForUser(session), getProjectById(session, id), createProject(...), updateStatus(...)
  messages.ts     // getMessagesForProject(session, projectId), postMessage(...)
  payments.ts     // createPaymentRequest(session, projectId, amount) — Admin-only
  notifications.ts
```

Rule enforced in every function: take the authenticated session as the **first argument**, never trust an ID passed from the client alone. Example shape (illustrative, not final code):

- `getProjectById(session, projectId)`: fetch the project; if `session.role === 'CLIENT'` assert `project.clientId === session.userId` or throw a 403-equivalent; if `session.role === 'ADMIN'`, allow.
- Every Server Action for a mutation re-derives the session server-side (via Supabase server client) — never accept a `role` or `userId` field from the request body as authoritative.

This makes the authorization logic auditable in one directory rather than scattered across every route/action.

## 5. Row Level Security (RLS) Policies

Enable RLS on every table. Representative policies (Postgres SQL, applied via a Supabase migration alongside Prisma migrations — see §5.1 on reconciling the two migration systems):

```sql
alter table "Project" enable row level security;

create policy "clients_select_own_projects"
  on "Project" for select
  using (auth.uid()::text = "clientId");

create policy "admin_select_all_projects"
  on "Project" for select
  using (exists (
    select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'
  ));

alter table "ProjectMessage" enable row level security;

create policy "participants_select_messages"
  on "ProjectMessage" for select
  using (
    exists (
      select 1 from "Project" p
      where p.id = "ProjectMessage"."projectId"
        and (p."clientId" = auth.uid()::text
             or exists (select 1 from "User" u where u.id = auth.uid()::text and u.role = 'ADMIN'))
    )
  );
```

Insert/update policies mirror the same ownership checks with `with check (...)`.

### 5.1 Reconciling Prisma migrations with RLS SQL
Prisma migrations manage table/column structure. RLS policies are pure SQL and don't fit Prisma's schema DSL. Approach: keep RLS policies in a dedicated `prisma/migrations/<timestamp>_rls_policies/migration.sql` (Prisma supports raw SQL migrations) so both live in the same migration history and run in the same `prisma migrate deploy` step — avoids a second, easily-forgotten migration system.

## 6. Third-Party Integrations

### 6.1 Supabase Auth
- Email/password + Google OAuth.
- No email verification gate (per spec) — but still send a welcome email.
- Session read via `@supabase/ssr` helpers in middleware; role (`CLIENT`/`ADMIN`) is looked up from our own `User` table (not from Supabase user metadata, since client-editable metadata must never drive authorization — see search finding on `user_metadata` RLS pitfalls).

### 6.2 Supabase Storage
- One bucket (e.g. `attachments`), path convention `projects/{projectId}/{attachmentId}-{fileName}`.
- RLS policies on `storage.objects` mirror the Project/ProjectMessage ownership rules.
- For server-rendered download links, generate short-lived signed URLs rather than relying on public bucket access.

### 6.3 Supabase Realtime (Chat)
- Client subscribes to a Postgres Changes channel filtered to `projectId` for `ProjectMessage` inserts.
- Because this is a genuine browser-direct connection, the RLS policy in §5 is what actually protects it — test this from the client SDK specifically (per research: the SQL editor bypasses RLS and gives false confidence about policy correctness).
- New messages sent via a Server Action (so the data-access layer's authorization still applies to the *write* path); the Realtime subscription only governs the *read/subscribe* path.

### 6.4 Realtime Upgrade Path (documented, not built now)
If concurrent connections approach Supabase's ~500 Pro-tier ceiling, or guaranteed delivery/message history becomes a hard requirement, migrate the chat layer to Ably (closest "enterprise-grade Pusher" analog, with message history and exactly-once delivery) while keeping Postgres as the source of truth. This is a documented contingency, not v1 work.

### 6.5 Stripe
- Checkout Sessions (not raw PaymentIntents directly) for simplicity — one Checkout Session per Admin-triggered "Ready for Payment" toggle, amount taken verbatim from Admin input.
- Webhook endpoint (`/api/webhooks/stripe`) handles `checkout.session.completed` → mark `Payment.status = SUCCEEDED`, trigger notification + email.
- Saved payment methods: use Stripe Customer Portal (simplest to implement, offloads PCI concerns entirely) linked from client Settings, rather than building custom card-management UI with Stripe Elements.
- No refund API usage (per spec §4.1/§12).

### 6.6 Email (Resend)
- Transactional templates: welcome, new quote, payment requested, payment succeeded, new chat message, status changed.
- Respect `User.emailNotificationsEnabled` for all except (arguably) payment receipts — treat payment receipts as always-on since they're transactional/legal in nature, not a "notification" the user should be able to silence. Confirm this with product owner before implementation if it matters.

## 7. Frontend Structure

> **Visual design note**: the structure below is functional (routes, components, what data/actions each screen needs). Actual visual design will be provided as Figma files by the product owner and takes precedence over any styling choices made before those are available — see `claude.md` §3.6. Build components with clean prop/data boundaries now so swapping in the real visual design later doesn't require restructuring, just restyling.

- App Router route groups: `(client)` and `(admin)`, each with their own layout enforcing role-based access (redirect if wrong role) at the layout level, backed up by the data-access layer (never rely on the redirect alone).
- Client dashboard: `/overview`, `/projects`, `/projects/new` (multi-step wizard, likely using URL search params or local state per step), `/messages`, `/settings`.
- Admin dashboard: `/admin` (the single All Projects list) and `/admin/projects/[id]` (detail page).
- Shared components: `ProjectCard`, `StatusBadge`, `ChatPanel` (used by both client and admin project detail views, with role-conditional controls), `NotificationBell`.

## 8. Environment & Deployment

### 8.1 Environments
- Local dev, Preview (per-PR via Vercel), Production.
- Separate Supabase projects for dev/staging vs production to avoid cross-contamination of client data.

### 8.2 Deployment
- Vercel, connected to the repo's main branch for production, automatic preview deployments per PR.
- Database migrations run as a build step or a manual `prisma migrate deploy` gate before promoting a deploy — do not rely on `prisma db push` in production.

### 8.3 Environment Variables (exhaustive list — do not add secrets outside this list without updating this doc)

| Variable | Scope | Notes |
|---|---|---|
| `DATABASE_URL` | server | Prisma connection string (pooled) |
| `DIRECT_URL` | server | Prisma direct connection (migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | safe to expose, RLS-protected |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | never `NEXT_PUBLIC_`, used only for admin tasks (e.g. user management) |
| `STRIPE_SECRET_KEY` | server only | |
| `STRIPE_WEBHOOK_SECRET` | server only | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | |
| `RESEND_API_KEY` | server only | |
| `NEXT_PUBLIC_APP_URL` | public | for building absolute links in emails |

## 9. Testing Strategy

- **Unit/integration**: every function in `lib/data/*` gets a test asserting the authorization boundary (client cannot read/write another client's project; admin can access everything) plus core business logic (status transition legality, payment amount fidelity).
- **E2E (Playwright)**, minimum critical-path coverage:
  1. Client signup → create project (through the full wizard) → appears in Admin's All Projects list.
  2. Admin sets a quote → client sees it reflected on their project card/detail.
  3. Admin toggles Ready for Payment → client completes Stripe Checkout (test mode) → payment reflected as succeeded on both sides.
  4. Admin marks project Completed → client can flag dispute.
  5. Chat: message sent by client appears for Admin (and vice versa) without a full page reload.

## 10. Phased Build Plan (see `tasks.md` for the granular checklist)

1. **Foundation** — repo scaffold, Supabase project, Prisma schema + migrations, Auth wiring, RLS policies, base layouts/route groups.
2. **Core project flow** — New Project wizard, My Projects/Overview, Admin All Projects + detail page, status transitions.
3. **Payments** — Stripe Checkout integration, webhook handling, payment history display.
4. **Chat** — ProjectMessage model, Realtime subscription, attachments in chat.
5. **Notifications** — in-app feed + email integration across all trigger events.
6. **Settings & polish** — profile, notification prefs, Stripe Customer Portal link, responsive/mobile pass.
7. **Testing & hardening** — fill out unit/E2E coverage, RLS policy verification pass (test from client SDK, not SQL editor), production deployment checklist.
