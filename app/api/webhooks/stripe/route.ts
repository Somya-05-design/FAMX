import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  const bodyText = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      bodyText,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle specific webhook events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const paymentId = session.metadata?.paymentId;

        if (paymentId) {
          const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.SUCCEEDED,
              stripePaymentIntentId: session.payment_intent as string,
            },
            include: { project: true }
          });
          console.log(`Payment ${paymentId} succeeded!`);

          // Trigger PAYMENT_SUCCEEDED notification to Client and Admin(s)
          try {
            const { createNotification } = await import("@/lib/data/notifications");
            // Notify client
            await createNotification(
              updatedPayment.project.clientId,
              "PAYMENT_SUCCEEDED",
              updatedPayment.projectId
            );

            // Notify admins
            const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
            for (const admin of admins) {
              await createNotification(
                admin.id,
                "PAYMENT_SUCCEEDED",
                updatedPayment.projectId
              );
            }
          } catch (err) {
            console.error("Failed to trigger payment success notifications", err);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as any;
        const paymentId = session.metadata?.paymentId;

        if (paymentId) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.FAILED,
            },
          });
          console.log(`Payment ${paymentId} expired/failed.`);
        }
        break;
      }

      default:
        console.log(`Unhandled stripe webhook event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`Database error processing webhook: ${err.message}`);
    return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
