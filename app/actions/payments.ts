"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createPaymentRequest, createPortalSession } from "@/lib/data/payments";
import { prisma } from "@/lib/prisma";

export async function requestPaymentAction(projectId: string, amount: number) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const payment = await createPaymentRequest(session, projectId, amount);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}`);

  return { id: payment.id, stripeSessionId: payment.stripeSessionId };
}

export async function requestBillingPortalAction() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const url = await createPortalSession(session);
  return { url };
}

export async function getPaymentCheckoutUrlAction(paymentId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { project: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Auth: client must own the project or user is admin
  if (session.user.role === "CLIENT" && payment.project.clientId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  if (!payment.stripeSessionId) {
    throw new Error("Stripe Checkout Session is not initialized");
  }

  const { stripe } = await import("@/lib/stripe");
  const checkoutSession = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
  if (!checkoutSession.url) {
    throw new Error("Checkout URL is not available");
  }

  return { url: checkoutSession.url };
}
