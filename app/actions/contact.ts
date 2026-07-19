"use server";

import { prisma } from "@/lib/prisma";

export interface ContactFormState {
  error?: string;
  success?: boolean;
}

export async function submitContactInquiryAction(
  prevState: ContactFormState | null,
  formData: FormData
): Promise<ContactFormState> {
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim();
  const message = (formData.get("message") as string || "").trim();
  
  // Honeypot spam protection
  const website = formData.get("website") as string;
  if (website) {
    console.log("[SPAM DETECTED] Honeypot field filled. Silently ignoring submission.");
    return { success: true };
  }

  // Basic validation
  if (!name || !email || !message) {
    return { error: "All fields are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    // 1. Persist the inquiry in the database
    await prisma.contactInquiry.create({
      data: {
        name,
        email,
        message,
      },
    });

    console.log(`[CONTACT INQUIRY] Saved inquiry from ${name} (${email})`);

    // 2. Notify admins via Resend API if configured
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== "re_..." && !apiKey.startsWith("sk_test")) {
      try {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { email: true },
        });

        const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "FAMX System <onboarding@resend.dev>",
              to: adminEmails,
              subject: `[FAMX] New Contact Inquiry from ${name}`,
              html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap; background-color: #f4f4f5; padding: 12px; border-radius: 8px;">${message}</p>
              `,
            }),
          });

          if (!res.ok) {
            const errBody = await res.text();
            console.error(`Resend API notification failed: Status ${res.status} | ${errBody}`);
          } else {
            console.log(`[EMAIL SEND OUT] Resend notification email sent to admins: ${adminEmails.join(", ")}`);
          }
        } else {
          console.log("[CONTACT INQUIRY] No admin users found to notify.");
        }
      } catch (emailErr) {
        console.error("Failed to send contact inquiry email notification via Resend", emailErr);
      }
    } else {
      console.log(`[EMAIL SEND OUT] Resend is not configured (mock mode). Notification for contact from ${name} (${email}) logged.`);
    }

    return { success: true };
  } catch (dbErr) {
    console.error("Database failure while saving contact inquiry", dbErr);
    return { error: "Failed to submit inquiry due to server error. Please try again later." };
  }
}
