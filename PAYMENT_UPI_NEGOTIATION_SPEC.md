# Payment Method Migration & Budget Negotiation Specification

## Overview
This document specifies the complete transition from **Stripe Checkout** to a **Manual UPI / Barcode / Bank Transfer Payment System** with an interactive **N-Round Budget Negotiation Workflow** for the FAMX platform.

---

## 1. Core Workflow & Requirements

### 1.1 Budget Negotiation Flow ($N$ Rounds)
1. **Initial Submission**: Client submits a project request with an initial `proposedBudget`.
2. **Admin Counter-Quote**: Admin reviews the request and can either:
   - Accept the user's budget, OR
   - Quote a different feasible budget amount with a note.
3. **Client Counter-Offer**: Client receives the admin's quote and can:
   - Accept the admin quote, OR
   - Propose another counter-budget with a note.
4. **Iterative Negotiation ($N$ times)**: The budget can be counter-proposed back and forth as many times as necessary. Full negotiation history is logged with timestamps, amounts, and notes.
5. **Finalization by Admin**: Only the **Admin** has the authority to **Finalize** the budget. When agreed, Admin clicks **"Finalize Budget & Request Payment"**.
6. **Locking & Payment Trigger**: Finalizing locks the budget (`isBudgetFinalized = true`), sets the project `quoteAmount` to the final agreed value, and generates a payment request.

---

### 1.2 Manual Payment via Barcode, UPI ID & Bank Transfer
Once the budget is finalized by the Admin:
1. **Payment Amount Display**: The exact finalized budget amount is shown to the user.
2. **Admin-Configured Barcode (QR Code)**:
   - Displays the manual QR Code image set by Admin, or
   - Renders a dynamic scannable UPI QR code containing the exact finalized amount (`upi://pay?pa={upiId}&pn={upiName}&am={finalAmount}&cu=INR`).
3. **UPI ID Payment Option**:
   - Displays the Admin's UPI ID (e.g. `agency@upi`) with a quick-copy button.
4. **Bank Transfer Option**:
   - Displays Bank Name, Account Holder Name, Account Number, IFSC Code, and Branch Name with quick-copy buttons.
5. **Proof Submission by Client**:
   - Client pays using any of the 3 methods.
   - Client enters **UTR / Transaction Ref Number** and optionally uploads a **Payment Receipt Screenshot**.
   - Client submits proof (`status = PENDING_VERIFICATION`).
6. **Admin Verification & Approval**:
   - Admin receives notification of submitted payment proof.
   - Admin inspects UTR & screenshot.
   - Admin approves (`status = SUCCEEDED`, Project moves to `IN_PROGRESS`) or rejects with feedback (`status = REJECTED`).

---

## 2. Database Schema & Architecture Changes (`prisma/schema.prisma`)

### 2.1 Enums
```prisma
enum BudgetNegotiationParty {
  CLIENT
  ADMIN
}

enum PaymentMethod {
  UPI_QR
  UPI_ID
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING               // Initial payment request created
  PENDING_VERIFICATION  // Client submitted UTR / receipt proof
  SUCCEEDED             // Admin verified and approved payment
  REJECTED              // Admin rejected proof (invalid UTR/receipt)
  FAILED                // Expired / canceled payment
}
```

### 2.2 Model Updates

#### `Project` Model
```prisma
model Project {
  // ... existing fields
  isBudgetFinalized    Boolean                 @default(false)
  lastNegotiatedBy     BudgetNegotiationParty?
  negotiationHistory   BudgetHistory[]
  // ... existing relations
}
```

#### `BudgetHistory` Model (New)
```prisma
model BudgetHistory {
  id          String                 @id @default(uuid())
  projectId   String
  project     Project                @relation(fields: [projectId], references: [id], onDelete: Cascade)
  amount      Decimal                @db.Decimal(10, 2)
  proposedBy  BudgetNegotiationParty
  note        String?
  createdAt   DateTime               @default(now())

  @@index([projectId, createdAt])
}
```

#### `AdminPaymentSettings` Model (New)
```prisma
model AdminPaymentSettings {
  id            String   @id @default("default")
  upiId         String?  // e.g., company@upi
  upiName       String?  // e.g., FAMX Digital Agency
  qrCodePath    String?  // Custom static QR image upload storage path
  bankName      String?  // e.g., HDFC Bank
  accountName   String?  // e.g., FAMX Media Pvt Ltd
  accountNumber String?  // e.g., 50200012345678
  ifscCode      String?  // e.g., HDFC0001234
  branchName    String?  // e.g., MG Road Branch
  updatedAt     DateTime @updatedAt
}
```

#### `Payment` Model (Refactored from Stripe)
```prisma
model Payment {
  id              String        @id @default(uuid())
  projectId       String
  project         Project       @relation(fields: [projectId], references: [id])
  amount          Decimal       @db.Decimal(10, 2)
  paymentMethod   PaymentMethod?
  utrNumber       String?       // UTR / Ref No provided by client
  receiptPath     String?       // Uploaded screenshot path
  status          PaymentStatus @default(PENDING)
  rejectionReason String?
  verifiedAt      DateTime?
  verifiedById    String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([projectId])
}
```

---

## 3. Data Access & Server Actions (`lib/data/`)

### 3.1 Budget Negotiation (`lib/data/budget.ts`)
- **`proposeBudget(session, projectId, amount, note)`**:
  - Validates session & authorization.
  - Adds entry to `BudgetHistory`.
  - Updates `Project.proposedBudget` (if Client) or `Project.quoteAmount` (if Admin).
  - Updates `Project.lastNegotiatedBy`.
  - Triggers notification to counter-party.
- **`finalizeBudget(session, projectId, finalAmount)`**:
  - Restricted to `ADMIN` role.
  - Sets `Project.isBudgetFinalized = true`.
  - Sets `Project.quoteAmount = finalAmount`.
  - Sets `Project.status = QUOTED` (or `READY_FOR_PAYMENT`).
  - Creates initial `Payment` record in `PENDING` status with amount `finalAmount`.

### 3.2 Manual Payments & Settings (`lib/data/payments.ts`)
- **`getAdminPaymentSettings()`**: Returns active UPI and Bank credentials for clients.
- **`updateAdminPaymentSettings(session, settings)`**: Admin-only function to update UPI ID, Bank details, and Barcode QR Code image.
- **`submitPaymentProof(session, projectId, input: { paymentMethod, utrNumber, receiptAttachmentId })`**:
  - Updates `Payment` record with `utrNumber`, `receiptPath`, `paymentMethod`, and sets `status = PENDING_VERIFICATION`.
  - Notifies Admin to review.
- **`verifyPayment(session, paymentId, action: "APPROVE" | "REJECT", rejectionReason?)`**:
  - Restricted to `ADMIN`.
  - On `APPROVE`: Sets `Payment.status = SUCCEEDED`, updates `Project.status = IN_PROGRESS`.
  - On `REJECT`: Sets `Payment.status = REJECTED`, stores `rejectionReason`, notifies client to resubmit proof.

---

## 4. UI Component Architecture

### 4.1 Budget Negotiation Component (`components/BudgetNegotiator.tsx`)
- Displays negotiation history thread (Amount, Sender, Note, Timestamp).
- Client View:
  - Input box for Counter Budget + Note.
  - Buttons: "Send Counter Offer", "Accept Admin's Quote".
- Admin View:
  - Input box for Revised Quote + Note.
  - Buttons: "Send Revised Quote", **"Accept & Finalize Budget"**.
- Finalized Badge: Indicates when budget is locked by Admin.

### 4.2 Admin Payment Settings Screen (`app/admin/settings/payment/page.tsx`)
- Input fields for UPI ID, Merchant Name, Bank Name, Account Holder, Account Number, IFSC Code.
- File Uploader for manual Barcode / Payment QR Code image.

### 4.3 Client Payment Modal & View (`components/PaymentSection.tsx`)
- Triggered when `isBudgetFinalized = true` and `Payment.status = PENDING` or `REJECTED`.
- Card Header: **Final Agreed Amount** (e.g. `₹50,000`).
- Tabbed Options:
  1. **QR Code / Barcode**: Shows Admin's uploaded barcode image or dynamic QR code with exact amount.
  2. **UPI ID**: Displays `agency@upi` with Copy Button.
  3. **Bank Transfer**: Account #, IFSC, Bank Name with Copy Buttons.
- Payment Proof Form:
  - **UTR / Ref No**: Text Input (Required).
  - **Receipt Screenshot**: File Upload (Optional / Recommended).
  - **"Submit Payment Proof"** Button.

### 4.4 Admin Payment Verification Drawer (`components/AdminPaymentVerification.tsx`)
- Displays client submitted UTR Number and Receipt image preview.
- Action Buttons:
  - **"Approve & Start Project"** (`status = SUCCEEDED`).
  - **"Reject Proof"** (Opens reason modal $\rightarrow$ `status = REJECTED`).

---

## 5. Stripe Cleanup & Removal
1. Delete `/app/api/webhooks/stripe/route.ts`.
2. Delete `/lib/stripe.ts`.
3. Remove `stripe` package from `package.json`.
4. Remove `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from environment variables.
