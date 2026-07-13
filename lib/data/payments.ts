import { prisma } from "../prisma";
import { stripe } from "../stripe";
import { Session } from "../types";
import { PaymentStatus, Prisma } from "@prisma/client";

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
    include: { client: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const amountDecimal = new Prisma.Decimal(amount);
  if (amountDecimal.lte(0)) {
    throw new Error("Payment amount must be greater than 0");
  }

  // Retrieve or create Stripe customer for the client
  let stripeCustomerId = project.client.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: project.client.email,
      name: project.client.name || undefined,
      metadata: {
        userId: project.clientId,
      },
    });
    stripeCustomerId = customer.id;

    await prisma.user.update({
      where: { id: project.clientId },
      data: { stripeCustomerId },
    });
  }

  // Create PENDING database payment record
  const payment = await prisma.payment.create({
    data: {
      projectId,
      amount: amountDecimal,
      status: PaymentStatus.PENDING,
    },
  });

  // Calculate amount in cents for Stripe Checkout API
  const amountInCents = Math.round(amountDecimal.toNumber() * 100);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice for Project: ${project.title}`,
            description: `Invoice billing request for project: ${project.title}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appUrl}/projects/${projectId}?payment=success`,
    cancel_url: `${appUrl}/projects/${projectId}?payment=cancel`,
    metadata: {
      projectId,
      paymentId: payment.id,
    },
  });

  // Update payment record with Stripe session reference
  return await prisma.payment.update({
    where: { id: payment.id },
    data: {
      stripeSessionId: checkoutSession.id,
    },
  });
}

export async function createPortalSession(session: Session) {
  if (session.user.role !== "CLIENT") {
    throw new Error("Only clients can access the billing portal");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser?.stripeCustomerId) {
    throw new Error("No billing history found. Please complete a payment first.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  });

  return portalSession.url;
}
