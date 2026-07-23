"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getAdminPaymentSettings,
  updateAdminPaymentSettings,
  submitPaymentProof,
  verifyPayment,
  AdminPaymentSettingsInput,
  SubmitPaymentProofInput,
} from "@/lib/data/payments";
import { finalizeBudgetAction } from "./budget";

export async function getAdminPaymentSettingsAction() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return await getAdminPaymentSettings();
}

export async function updateAdminPaymentSettingsAction(input: AdminPaymentSettingsInput) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const settings = await updateAdminPaymentSettings(session, input);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/payment");
  return settings;
}

export async function submitPaymentProofAction(input: SubmitPaymentProofInput) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const payment = await submitPaymentProof(session, input);
  revalidatePath(`/projects/${payment.projectId}`);
  revalidatePath(`/admin/projects/${payment.projectId}`);
  return { id: payment.id, status: payment.status };
}

export async function verifyPaymentAction(
  paymentId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const payment = await verifyPayment(session, paymentId, action, rejectionReason);
  revalidatePath(`/projects/${payment.projectId}`);
  revalidatePath(`/admin/projects/${payment.projectId}`);
  revalidatePath("/admin");
  return { id: payment.id, status: payment.status };
}

export async function requestPaymentAction(projectId: string, amount: number) {
  return await finalizeBudgetAction(projectId, amount);
}

export async function requestBillingPortalAction() {
  return { url: "/admin/settings/payment" };
}
