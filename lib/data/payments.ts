import { prisma } from "../prisma";
import { Session } from "../types";
import { PaymentMethod, PaymentStatus, ProjectStatus, Prisma } from "@prisma/client";
import { createNotification } from "./notifications";

export interface AdminPaymentSettingsInput {
  upiId?: string;
  upiName?: string;
  qrCodePath?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

export async function getAdminPaymentSettings() {
  let settings = await prisma.adminPaymentSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.adminPaymentSettings.create({
      data: {
        id: "default",
        upiId: "agency@upi",
        upiName: "FAMX Agency",
        bankName: "HDFC Bank",
        accountName: "FAMX Agency Pvt Ltd",
        accountNumber: "50200012345678",
        ifscCode: "HDFC0001234",
        branchName: "Main Branch",
      },
    });
  }

  return settings;
}

export async function updateAdminPaymentSettings(
  session: Session,
  input: AdminPaymentSettingsInput
) {
  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can update payment settings");
  }

  return await prisma.adminPaymentSettings.upsert({
    where: { id: "default" },
    update: {
      upiId: input.upiId?.trim() || null,
      upiName: input.upiName?.trim() || null,
      qrCodePath: input.qrCodePath || null,
      bankName: input.bankName?.trim() || null,
      accountName: input.accountName?.trim() || null,
      accountNumber: input.accountNumber?.trim() || null,
      ifscCode: input.ifscCode?.trim() || null,
      branchName: input.branchName?.trim() || null,
    },
    create: {
      id: "default",
      upiId: input.upiId?.trim() || null,
      upiName: input.upiName?.trim() || null,
      qrCodePath: input.qrCodePath || null,
      bankName: input.bankName?.trim() || null,
      accountName: input.accountName?.trim() || null,
      accountNumber: input.accountNumber?.trim() || null,
      ifscCode: input.ifscCode?.trim() || null,
      branchName: input.branchName?.trim() || null,
    },
  });
}

export async function createPaymentRequest(
  session: Session,
  projectId: string,
  amount: number | Prisma.Decimal
) {
  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can create payment requests");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const amountDecimal = new Prisma.Decimal(amount);
  if (amountDecimal.lte(0)) {
    throw new Error("Payment amount must be greater than 0");
  }

  const payment = await prisma.payment.create({
    data: {
      projectId,
      amount: amountDecimal,
      status: PaymentStatus.PENDING,
    },
  });

  await createNotification(project.clientId, "PAYMENT_REQUESTED", projectId);

  return payment;
}

export interface SubmitPaymentProofInput {
  paymentId: string;
  paymentMethod: PaymentMethod;
  utrNumber: string;
  receiptPath?: string;
}

export async function submitPaymentProof(
  session: Session,
  input: SubmitPaymentProofInput
) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { project: true },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (session.user.role === "CLIENT" && payment.project.clientId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  if (!input.utrNumber || input.utrNumber.trim().length < 4) {
    throw new Error("A valid Transaction Reference Number / UTR is required");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: input.paymentId },
    data: {
      paymentMethod: input.paymentMethod,
      utrNumber: input.utrNumber.trim(),
      receiptPath: input.receiptPath || null,
      status: PaymentStatus.PENDING_VERIFICATION,
      rejectionReason: null,
    },
  });

  // Notify admin for payment verification
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admin) {
    await createNotification(
      admin.id,
      "PAYMENT_VERIFICATION_REQUESTED",
      payment.projectId
    );
  }

  return updatedPayment;
}

export async function verifyPayment(
  session: Session,
  paymentId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
) {
  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can verify payments");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { project: true },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (action === "APPROVE") {
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SUCCEEDED,
        verifiedAt: new Date(),
        verifiedById: session.user.id,
      },
    });

    // Update project status to IN_PROGRESS
    await prisma.project.update({
      where: { id: payment.projectId },
      data: {
        status: ProjectStatus.IN_PROGRESS,
      },
    });

    await createNotification(
      payment.project.clientId,
      "PAYMENT_SUCCEEDED",
      payment.projectId
    );

    return updatedPayment;
  } else {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error("Rejection reason is required when rejecting payment proof");
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        rejectionReason: rejectionReason.trim(),
        verifiedAt: new Date(),
        verifiedById: session.user.id,
      },
    });

    await createNotification(
      payment.project.clientId,
      "PAYMENT_REJECTED",
      payment.projectId
    );

    return updatedPayment;
  }
}
