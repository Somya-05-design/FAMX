import { prisma } from "../prisma";
import { Session } from "../types";
import { BudgetNegotiationParty, ProjectStatus, PaymentStatus, Prisma } from "@prisma/client";
import { createNotification } from "./notifications";

export async function proposeBudget(
  session: Session,
  projectId: string,
  amount: number,
  note?: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.isBudgetFinalized) {
    throw new Error("Budget has already been finalized by admin");
  }

  const isClient = session.user.role === "CLIENT";
  const isAdmin = session.user.role === "ADMIN";

  if (isClient && project.clientId !== session.user.id) {
    throw new Error("Unauthorized access to project");
  }

  const proposedBy: BudgetNegotiationParty = isClient ? "CLIENT" : "ADMIN";
  const decimalAmount = new Prisma.Decimal(amount);

  if (decimalAmount.lte(0)) {
    throw new Error("Proposed budget amount must be greater than 0");
  }

  // Record in negotiation history
  await prisma.budgetHistory.create({
    data: {
      projectId,
      amount: decimalAmount,
      proposedBy,
      note: note ? note.trim() : null,
    },
  });

  // Update project current proposed amount and negotiator state
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      lastNegotiatedBy: proposedBy,
      ...(isClient ? { proposedBudget: decimalAmount } : { quoteAmount: decimalAmount }),
      status: project.status === ProjectStatus.SUBMITTED ? ProjectStatus.QUOTED : project.status,
    },
  });

  // Notify counter party
  const recipientId = isClient ? (await getAdminUserId()) : project.clientId;
  if (recipientId) {
    await createNotification(
      recipientId,
      "BUDGET_COUNTER_OFFER",
      projectId
    );
  }

  return updatedProject;
}

export async function finalizeBudget(
  session: Session,
  projectId: string,
  finalAmount: number
) {
  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can finalize the project budget");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const decimalAmount = new Prisma.Decimal(finalAmount);
  if (decimalAmount.lte(0)) {
    throw new Error("Final budget amount must be greater than 0");
  }

  // Update project to finalized status
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      isBudgetFinalized: true,
      quoteAmount: decimalAmount,
      status: ProjectStatus.QUOTED,
      lastNegotiatedBy: "ADMIN",
    },
  });

  // Record final step in history
  await prisma.budgetHistory.create({
    data: {
      projectId,
      amount: decimalAmount,
      proposedBy: "ADMIN",
      note: "Budget finalized by admin",
    },
  });

  // Check existing pending payment or create new one
  const existingPendingPayment = await prisma.payment.findFirst({
    where: {
      projectId,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PENDING_VERIFICATION, PaymentStatus.REJECTED] },
    },
  });

  if (existingPendingPayment) {
    await prisma.payment.update({
      where: { id: existingPendingPayment.id },
      data: {
        amount: decimalAmount,
        status: PaymentStatus.PENDING,
        paymentMethod: null,
        utrNumber: null,
        receiptPath: null,
        rejectionReason: null,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        projectId,
        amount: decimalAmount,
        status: PaymentStatus.PENDING,
      },
    });
  }

  // Notify client that budget is finalized and ready for payment
  await createNotification(project.clientId, "PAYMENT_REQUESTED", projectId);

  return updatedProject;
}

export async function getBudgetHistory(session: Session, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (session.user.role === "CLIENT" && project.clientId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const history = await prisma.budgetHistory.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return history.map((item) => ({
    ...item,
    amount: item.amount.toNumber(),
  }));
}

async function getAdminUserId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  return admin?.id || null;
}
